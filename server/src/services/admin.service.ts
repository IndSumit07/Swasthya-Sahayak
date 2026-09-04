import { supabaseAdmin } from '../config/supabase';
import { prisma } from '../config/prisma';
import { redisCache } from '../config/redis';
import { UserRole, RegistrationStep } from '@prisma/client';

export interface ProvisionUserInput {
  email: string;
  password?: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  district?: string;        // Required for DISTRICT_ADMIN
  facilityId?: string;      // Required for FACILITY_ADMIN, DOCTOR, HEALTH_WORKER
  specialty?: string;       // For DOCTOR
  qualification?: string;   // For DOCTOR
  registrationNo?: string;  // For DOCTOR
  workerType?: string;      // For HEALTH_WORKER (e.g. "ASHA", "ANM", "CHO")
  villageArea?: string;     // For HEALTH_WORKER
}

export const adminService = {
  /**
   * Provision a staff user with role verification.
   * - SUPER_ADMIN can create any role (DISTRICT_ADMIN, FACILITY_ADMIN, DOCTOR, HEALTH_WORKER).
   * - DISTRICT_ADMIN can create FACILITY_ADMIN (within their district), DOCTOR, HEALTH_WORKER.
   */
  async provisionUser(input: ProvisionUserInput, actor: { userId: string; role: UserRole }) {
    const {
      email,
      password = "Password@123", // default secure initial password if not provided
      fullName,
      phone,
      role,
      district,
      facilityId,
      specialty,
      qualification,
      registrationNo,
      workerType,
      villageArea,
    } = input;

    // Authorization checks based on Role Hierarchy
    if (actor.role === UserRole.DISTRICT_ADMIN) {
      if (role === UserRole.SUPER_ADMIN || role === UserRole.DISTRICT_ADMIN) {
        throw new Error('District Admins cannot provision Super Admins or other District Admins');
      }

      // Check that the target facility belongs to the District Admin's district
      if (facilityId) {
        const adminRecord = await prisma.districtAdmin.findUnique({ where: { userId: actor.userId } });
        if (adminRecord && adminRecord.district !== 'ALL') {
          const facility = await prisma.facility.findUnique({ where: { id: facilityId } });
          if (facility && facility.district.toLowerCase() !== adminRecord.district.toLowerCase()) {
            throw new Error(`Cannot assign staff to facility outside your district (${adminRecord.district})`);
          }
        }
      }
    } else if (actor.role !== UserRole.SUPER_ADMIN) {
      throw new Error('Only Super Admins and District Admins can provision staff accounts');
    }

    // Role-specific validation
    if (role === UserRole.DISTRICT_ADMIN && !district) {
      throw new Error('District name is required when provisioning a District Admin');
    }
    if (role === UserRole.FACILITY_ADMIN && !facilityId) {
      throw new Error('Facility selection is required when provisioning a Facility Admin');
    }

    // 1. Create or retrieve Supabase Auth User
    let supabaseUserId: string;
    const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true, // auto-confirm provisioned accounts
      user_metadata: { full_name: fullName.trim() },
    });

    if (createError) {
      // If user already exists in auth, check if they exist in users table
      if (createError.message.toLowerCase().includes('already registered') || createError.message.toLowerCase().includes('already exists')) {
        const existing = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
        if (existing) {
          throw new Error(`User with email "${email}" is already registered as ${existing.role}`);
        }
        // Retrieve existing Supabase user ID
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
        const found = listData?.users?.find(u => u.email?.toLowerCase() === email.trim().toLowerCase());
        if (!found) throw new Error(createError.message);
        supabaseUserId = found.id;
      } else {
        throw new Error(createError.message);
      }
    } else {
      supabaseUserId = createData.user.id;
    }

    // 2. Insert User into PostgreSQL with Role & Active status
    const user = await prisma.user.upsert({
      where: { id: supabaseUserId },
      create: {
        id: supabaseUserId,
        email: email.trim().toLowerCase(),
        fullName: fullName.trim(),
        phone: phone?.trim() || null,
        role,
        status: 'ACTIVE',
      },
      update: {
        fullName: fullName.trim(),
        phone: phone?.trim() || null,
        role,
        status: 'ACTIVE',
      },
    });

    // 3. Mark registration progress as complete
    await prisma.registrationProgress.upsert({
      where: { userId: user.id },
      create: { userId: user.id, currentStep: RegistrationStep.COMPLETE },
      update: { currentStep: RegistrationStep.COMPLETE },
    });

    // 4. Create linked Role Record
    if (role === UserRole.DISTRICT_ADMIN && district) {
      await prisma.districtAdmin.upsert({
        where: { userId: user.id },
        create: { userId: user.id, district: district.trim() },
        update: { district: district.trim() },
      });
    } else if (role === UserRole.FACILITY_ADMIN && facilityId) {
      await prisma.facilityAdmin.upsert({
        where: { userId: user.id },
        create: { userId: user.id, facilityId },
        update: { facilityId },
      });
    } else if (role === UserRole.DOCTOR) {
      await prisma.doctor.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          facilityId: facilityId || null,
          specialty: specialty?.trim() || "General Medicine",
          qualification: qualification?.trim() || "MBBS",
          registrationNo: registrationNo?.trim() || null,
        },
        update: {
          facilityId: facilityId || undefined,
          specialty: specialty?.trim() || undefined,
          qualification: qualification?.trim() || undefined,
          registrationNo: registrationNo?.trim() || undefined,
        },
      });
    } else if (role === UserRole.HEALTH_WORKER) {
      await prisma.healthWorker.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          facilityId: facilityId || null,
          workerType: workerType?.trim() || "ASHA",
          villageArea: villageArea?.trim() || null,
        },
        update: {
          facilityId: facilityId || undefined,
          workerType: workerType?.trim() || undefined,
          villageArea: villageArea?.trim() || undefined,
        },
      });
    }

    // Invalidate Redis caches
    await Promise.all([
      redisCache.del(`user:profile:${user.id}`),
      redisCache.del(`user:identity:${user.id}`),
      redisCache.delPattern('admin:staff:*'),
      redisCache.delPattern('admin:district:summary:*'),
    ]).catch(() => {});

    return {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      status: user.status,
    };
  },

  /**
   * List staff users (Super Admin sees all, District Admin sees within district).
   */
  async listStaff(actor: { userId: string; role: UserRole }, filters: { role?: UserRole; district?: string }) {
    let districtScope = filters.district;

    if (actor.role === UserRole.DISTRICT_ADMIN) {
      const adminRecord = await prisma.districtAdmin.findUnique({ where: { userId: actor.userId } });
      if (adminRecord && adminRecord.district !== 'ALL') {
        districtScope = adminRecord.district;
      }
    }

    const cacheKey = `admin:staff:${actor.userId}:${actor.role}:${filters.role || 'ALL'}:${(districtScope || 'ALL').toUpperCase()}`;
    const cached = await redisCache.get<any[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const staff = await prisma.user.findMany({
      where: {
        role: filters.role ? filters.role : { not: UserRole.PATIENT },
        ...(districtScope
          ? {
              OR: [
                { districtAdmin: { district: districtScope } },
                { facilityAdmin: { facility: { district: districtScope } } },
                { doctor: { facility: { district: districtScope } } },
                { healthWorker: { facility: { district: districtScope } } },
              ],
            }
          : {}),
      },
      include: {
        districtAdmin: true,
        facilityAdmin: { include: { facility: true } },
        doctor: { include: { facility: true } },
        healthWorker: { include: { facility: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Cache staff list for 60 seconds
    await redisCache.set(cacheKey, staff, 60);

    return staff;
  },

  /**
   * District-wide facility & resource summary.
   * High-traffic metric queried immediately on district & state dashboards.
   */
  async getDistrictSummary(district?: string) {
    const cacheKey = `admin:district:summary:${(district || 'ALL').toUpperCase()}`;
    const cached = await redisCache.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    const facilities = await prisma.facility.findMany({
      where: district && district !== "ALL" ? { district: { equals: district, mode: "insensitive" } } : undefined,
      include: {
        bedStatus: true,
        doctors: true,
        medicines: true,
      },
    });

    const totalFacilities = facilities.length;
    const totalBeds = facilities.reduce((sum, f) => sum + (f.bedStatus?.totalBeds ?? 0), 0);
    const availableBeds = facilities.reduce((sum, f) => sum + (f.bedStatus?.availableBeds ?? 0), 0);
    const totalDoctors = facilities.reduce((sum, f) => sum + f.doctors.length, 0);

    const summary = {
      district: district || "All Maharashtra",
      totalFacilities,
      totalBeds,
      availableBeds,
      totalDoctors,
    };

    // Cache district summary metrics for 3 minutes (180s TTL)
    await redisCache.set(cacheKey, summary, 180);

    return summary;
  },
};
