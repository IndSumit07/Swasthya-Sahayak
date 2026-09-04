import { prisma } from "../config/prisma";
import { redisCache } from "../config/redis";

export interface CreatePrescriptionInput {
  patientId: string;
  doctorId: string;
  facilityId: string;
  diagnosis: string;
  advice?: string;
  followUpDate?: string | Date;
  items: Array<{
    medicineName: string;
    dosage: string;
    duration: string;
    frequency?: string;
    instructions?: string;
    inStock?: boolean;
  }>;
}

/**
 * Invalidate Redis caches for prescriptions
 */
export async function invalidatePrescriptionCaches(id?: string): Promise<void> {
  try {
    if (id) {
      await redisCache.del(`prescriptions:id:${id}`);
    }
    await redisCache.delPattern("prescriptions:list:*");
  } catch {
    // Non-blocking
  }
}

export class PrescriptionService {
  static async list(filters: { patientId?: string; doctorId?: string; facilityId?: string }) {
    const cacheKey = `prescriptions:list:${filters.patientId || "ALL"}:${filters.doctorId || "ALL"}:${filters.facilityId || "ALL"}`;
    const cached = await redisCache.get<any[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const where: any = {};
    if (filters.patientId) where.patientId = filters.patientId;
    if (filters.doctorId) where.doctorId = filters.doctorId;
    if (filters.facilityId) where.facilityId = filters.facilityId;

    const prescriptions = await prisma.prescription.findMany({
      where,
      include: {
        items: true,
        facility: {
          select: {
            id: true,
            name: true,
            type: true,
            district: true,
            village: true,
          },
        },
        doctor: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
              },
            },
          },
        },
        patient: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Cache prescription list for 60 seconds (1 minute TTL)
    await redisCache.set(cacheKey, prescriptions, 60);

    return prescriptions;
  }

  static async getById(id: string) {
    const cacheKey = `prescriptions:id:${id}`;
    const cached = await redisCache.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    const prescription = await prisma.prescription.findUnique({
      where: { id },
      include: {
        items: true,
        facility: true,
        doctor: { include: { user: true } },
        patient: { include: { user: true } },
      },
    });

    if (prescription) {
      // Cache detail for 2 minutes (120 seconds TTL)
      await redisCache.set(cacheKey, prescription, 120);
    }

    return prescription;
  }

  static async create(data: CreatePrescriptionInput) {
    const prescription = await prisma.prescription.create({
      data: {
        patientId: data.patientId,
        doctorId: data.doctorId,
        facilityId: data.facilityId,
        diagnosis: data.diagnosis,
        advice: data.advice || null,
        followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
        items: {
          create: data.items.map((item) => ({
            medicineName: item.medicineName,
            dosage: item.dosage,
            duration: item.duration,
            frequency: item.frequency || null,
            instructions: item.instructions || null,
            inStock: item.inStock !== false,
          })),
        },
      },
      include: {
        items: true,
        facility: true,
        doctor: { include: { user: true } },
        patient: { include: { user: true } },
      },
    });

    await invalidatePrescriptionCaches();
    return prescription;
  }

  static async delete(id: string) {
    const deleted = await prisma.prescription.delete({
      where: { id },
    });

    await invalidatePrescriptionCaches(id);
    return deleted;
  }
}
