import { prisma } from '../config/prisma';
import { redisCache } from '../config/redis';
import { FacilityType, Prisma } from '@prisma/client';

export interface CreateFacilityInput {
  name: string;
  type: FacilityType;
  district: string;
  village?: string;
  address?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  contactPhone?: string;
  contactEmail?: string;
  workingHours?: string;
  services?: string[]; // list of service names
  totalBeds?: number;
  availableBeds?: number;
  oxygenBedsTotal?: number;
  oxygenBedsAvailable?: number;
  icuBedsTotal?: number;
  icuBedsAvailable?: number;
  medicines?: Array<{
    medicineName: string;
    category?: string;
    quantity: number;
    unit?: string;
    stockThreshold?: number;
    isAvailable?: boolean;
  }>;
  diagnostics?: Array<{
    testName: string;
    category?: string;
    isAvailable?: boolean;
    turnaroundHours?: number;
    costInr?: number;
  }>;
  slots?: Array<{
    slotName: string;
    startTime?: string;
    endTime?: string;
    maxCapacity?: number;
    isAvailable?: boolean;
  }>;
}

export interface NearbyFacilityQuery {
  latitude: number;
  longitude: number;
  radiusKm?: number; // default 50km
  district?: string;
  type?: FacilityType;
  serviceName?: string;
  hasBeds?: boolean;
  hasDoctor?: boolean;
  hasMedicine?: string; // search for medicine in stock
  testName?: string;
}

/**
 * Standard public health services recognized across National Health Mission / Maharashtra Health Services
 */
export const STANDARD_SERVICES = [
  { name: 'General Consultation', category: 'OPD' },
  { name: 'Specialist Consultation', category: 'OPD' },
  { name: 'Maternal Care', category: 'MCH' },
  { name: 'Child Healthcare', category: 'MCH' },
  { name: 'Diagnostics', category: 'LAB' },
  { name: 'Pharmacy', category: 'PHARMACY' },
  { name: 'Emergency Services', category: 'EMERGENCY' },
  { name: 'Vaccination', category: 'PREVENTIVE' },
  { name: 'Chronic Disease Care', category: 'NCD' },
];

/**
 * Calculates Haversine distance in kilometers between two GPS coordinates.
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export function buildServiceWhereClause(service: string): Prisma.FacilityWhereInput {
  const s = service.trim().toLowerCase();
  const keywords: string[] = [];

  if (s.includes('maternal')) {
    keywords.push('maternal', 'mother', 'obstetrics', 'delivery');
  } else if (s.includes('child')) {
    keywords.push('child', 'pediatric', 'immunization', 'vaccin');
  } else if (s.includes('specialist')) {
    keywords.push('specialist', 'specialty', 'surgery', 'ortho', 'cardio');
  } else if (s.includes('general')) {
    keywords.push('general', 'consultation', 'opd');
  } else if (s.includes('diagnost') || s.includes('lab') || s.includes('patholog')) {
    keywords.push('diagnost', 'pathology', 'radiology', 'x-ray', 'blood');
  } else if (s.includes('pharmacy')) {
    keywords.push('pharmacy', 'drug', 'medicine');
  } else if (s.includes('emergency')) {
    keywords.push('emergency', 'trauma', 'triage', 'icu');
  } else if (s.includes('vaccin') || s.includes('immuniz')) {
    keywords.push('vaccin', 'immuniz');
  } else if (s.includes('chronic') || s.includes('ncd')) {
    keywords.push('chronic', 'ncd', 'cardio', 'dialysis', 'diabetes');
  } else {
    keywords.push(s);
  }

  const conditions: Prisma.FacilityWhereInput[] = keywords.map((k) => ({
    services: {
      some: {
        name: { contains: k, mode: 'insensitive' },
        isActive: true,
      },
    },
  }));

  if (s.includes('pharmacy')) {
    conditions.push({ type: FacilityType.PHARMACY });
  }
  if (s.includes('diagnost') || s.includes('lab')) {
    conditions.push({ type: FacilityType.DIAGNOSTIC_CENTER });
  }

  return { OR: conditions };
}

export const facilityService = {
  /**
   * Register a new healthcare facility (FR-05).
   * Supports all 6 institutional types: PHC, CHC, Rural Hospital, District Hospital, Diagnostic Center, Pharmacy.
   * Persists location coordinates, working hours, beds, medicines, diagnostics, and slots.
   */
  async createFacility(input: CreateFacilityInput) {
    const {
      name,
      type,
      district,
      village,
      address,
      pincode,
      latitude,
      longitude,
      contactPhone,
      contactEmail,
      workingHours,
      services,
      totalBeds = 10,
      availableBeds = 5,
      oxygenBedsTotal = 2,
      oxygenBedsAvailable = 1,
      icuBedsTotal = 0,
      icuBedsAvailable = 0,
      medicines,
      diagnostics,
      slots,
    } = input;

    const facility = await prisma.facility.create({
      data: {
        name: name.trim(),
        type,
        district: district.trim(),
        village: village?.trim() || null,
        address: address?.trim() || null,
        pincode: pincode?.trim() || null,
        latitude: latitude !== undefined && latitude !== null ? new Prisma.Decimal(latitude) : null,
        longitude: longitude !== undefined && longitude !== null ? new Prisma.Decimal(longitude) : null,
        contactPhone: contactPhone?.trim() || null,
        contactEmail: contactEmail?.trim() || null,
        workingHours: workingHours?.trim() || '24x7 Emergency / 09:00 - 17:00 OPD',
        bedStatus: {
          create: {
            totalBeds,
            availableBeds,
            oxygenBedsTotal,
            oxygenBedsAvailable,
            icuBedsTotal,
            icuBedsAvailable,
          },
        },
        services: services && services.length > 0
          ? {
              create: services.map((s) => ({
                name: s.trim(),
              })),
            }
          : undefined,
        medicines: medicines && medicines.length > 0
          ? {
              create: medicines.map((m) => ({
                medicineName: m.medicineName.trim(),
                category: m.category?.trim() || null,
                quantity: m.quantity ?? 100,
                unit: m.unit?.trim() || 'strips',
                stockThreshold: m.stockThreshold ?? 20,
                isAvailable: m.isAvailable ?? true,
              })),
            }
          : undefined,
        diagnostics: diagnostics && diagnostics.length > 0
          ? {
              create: diagnostics.map((d) => ({
                testName: d.testName.trim(),
                category: d.category?.trim() || null,
                isAvailable: d.isAvailable ?? true,
                turnaroundHours: d.turnaroundHours ?? 24,
                costInr: d.costInr ?? 0,
              })),
            }
          : undefined,
        slots: slots && slots.length > 0
          ? {
              create: slots.map((sl) => ({
                slotName: sl.slotName.trim(),
                startTime: sl.startTime || '09:00',
                endTime: sl.endTime || '12:00',
                maxCapacity: sl.maxCapacity ?? 20,
                isAvailable: sl.isAvailable ?? true,
              })),
            }
          : undefined,
      },
      include: {
        bedStatus: true,
        services: true,
        medicines: true,
        diagnostics: true,
        slots: true,
      },
    });

    // Invalidate any facilities search cache
    await redisCache.delPattern('facilities:*').catch(() => {});

    return facility;
  },

  /**
   * Search and filter facilities directory (FR-05 / FR-06).
   */
  async listFacilities(query: {
    district?: string;
    type?: FacilityType;
    search?: string;
    hasAvailableBeds?: boolean;
    service?: string;
    limit?: number;
    offset?: number;
  }) {
    const { district, type, search, hasAvailableBeds, service, limit = 50, offset = 0 } = query;

    const where: Prisma.FacilityWhereInput = {
      isActive: true,
      ...(district && district !== 'All Districts' && district !== 'ALL'
        ? { district: { equals: district, mode: 'insensitive' } }
        : {}),
      ...(type && (type as string) !== 'ALL' ? { type } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { village: { contains: search, mode: 'insensitive' } },
              { district: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(hasAvailableBeds
        ? {
            bedStatus: {
              availableBeds: { gt: 0 },
            },
          }
        : {}),
      ...(service && service !== 'All Services' && service !== 'ALL'
        ? buildServiceWhereClause(service)
        : {}),
    };

    const [facilities, total] = await Promise.all([
      prisma.facility.findMany({
        where,
        include: {
          bedStatus: true,
          services: { where: { isActive: true } },
          medicines: { where: { isAvailable: true } },
          diagnostics: { where: { isAvailable: true } },
          slots: { where: { isAvailable: true } },
          doctors: {
            where: { isAvailable: true },
            select: {
              id: true,
              specialty: true,
              qualification: true,
              isAvailable: true,
              user: { select: { fullName: true } },
            },
          },
        },
        orderBy: [{ district: 'asc' }, { name: 'asc' }],
        take: limit,
        skip: offset,
      }),
      prisma.facility.count({ where }),
    ]);

    return { facilities, total, limit, offset };
  },

  /**
   * Get single facility with complete live resource status (FR-07).
   */
  async getFacilityById(id: string) {
    const cacheKey = `facilities:id:${id}`;
    const cached = await redisCache.get<any>(cacheKey);
    if (cached) return cached;

    const facility = await prisma.facility.findUnique({
      where: { id },
      include: {
        bedStatus: true,
        services: true,
        medicines: { orderBy: { medicineName: 'asc' } },
        diagnostics: { orderBy: { testName: 'asc' } },
        slots: { orderBy: { slotName: 'asc' } },
        doctors: {
          include: {
            user: { select: { id: true, fullName: true, email: true, phone: true } },
          },
        },
        workers: {
          include: {
            user: { select: { id: true, fullName: true, phone: true } },
          },
        },
        admins: {
          include: {
            user: { select: { id: true, fullName: true, email: true } },
          },
        },
      },
    });

    if (!facility) throw new Error('Health facility not found');

    // Cache for 5 minutes (300s)
    await redisCache.set(cacheKey, facility, 300);

    return facility;
  },

  /**
   * Unified FR-07 Facility Availability Matrix:
   * Returns Doctor availability, Appointment slots, Bed availability, Diagnostic availability,
   * and Medicine availability matching the exact example format from FR-07.
   */
  async getFacilityAvailabilityMatrix(facilityId: string) {
    const facility = await prisma.facility.findUnique({
      where: { id: facilityId },
      include: {
        bedStatus: true,
        doctors: {
          include: {
            user: { select: { fullName: true } },
          },
        },
        diagnostics: { orderBy: { testName: 'asc' } },
        medicines: { orderBy: { medicineName: 'asc' } },
        slots: { orderBy: { slotName: 'asc' } },
      },
    });

    if (!facility) throw new Error('Health facility not found');

    const bed = facility.bedStatus;
    const bedAvailableCount = bed?.availableBeds ?? 0;
    const bedStatusText = bedAvailableCount > 0 ? `${bedAvailableCount} Available` : 'Unavailable';

    // Build the consolidated FR-07 resource list
    const summaryMatrix: Array<{
      item: string;
      category: 'DOCTOR' | 'DIAGNOSTIC' | 'MEDICINE' | 'BED' | 'SLOT';
      status: string;
      isAvailable: boolean;
    }> = [];

    // 1. Doctors
    if (facility.doctors && facility.doctors.length > 0) {
      facility.doctors.forEach((d) => {
        const title = d.specialty ? `${d.specialty} Doctor` : `Dr. ${d.user?.fullName || 'Doctor'}`;
        summaryMatrix.push({
          item: title,
          category: 'DOCTOR',
          status: d.isAvailable ? 'Available' : 'Unavailable',
          isAvailable: d.isAvailable,
        });
      });
    } else {
      summaryMatrix.push({
        item: 'General Doctor',
        category: 'DOCTOR',
        status: 'Available',
        isAvailable: true,
      });
    }

    // 2. Diagnostic tests
    if (facility.diagnostics && facility.diagnostics.length > 0) {
      facility.diagnostics.forEach((t) => {
        summaryMatrix.push({
          item: t.testName,
          category: 'DIAGNOSTIC',
          status: t.isAvailable ? 'Available' : 'Unavailable',
          isAvailable: t.isAvailable,
        });
      });
    }

    // 3. Essential Medicines
    if (facility.medicines && facility.medicines.length > 0) {
      facility.medicines.forEach((m) => {
        const available = m.isAvailable && m.quantity > 0;
        summaryMatrix.push({
          item: m.medicineName,
          category: 'MEDICINE',
          status: available ? 'Available' : 'Unavailable',
          isAvailable: available,
        });
      });
    }

    // 4. Inpatient Beds
    summaryMatrix.push({
      item: 'Beds',
      category: 'BED',
      status: bedStatusText,
      isAvailable: bedAvailableCount > 0,
    });

    // 5. Appointment Slots
    if (facility.slots && facility.slots.length > 0) {
      facility.slots.forEach((sl) => {
        summaryMatrix.push({
          item: sl.slotName,
          category: 'SLOT',
          status: sl.isAvailable ? 'Available' : 'Unavailable',
          isAvailable: sl.isAvailable,
        });
      });
    }

    return {
      facilityId: facility.id,
      facilityName: facility.name,
      facilityType: facility.type,
      district: facility.district,
      village: facility.village,
      workingHours: facility.workingHours,
      beds: {
        total: bed?.totalBeds ?? 0,
        available: bed?.availableBeds ?? 0,
        oxygenTotal: bed?.oxygenBedsTotal ?? 0,
        oxygenAvailable: bed?.oxygenBedsAvailable ?? 0,
        icuTotal: bed?.icuBedsTotal ?? 0,
        icuAvailable: bed?.icuBedsAvailable ?? 0,
        statusText: bedStatusText,
      },
      doctors: facility.doctors.map((d) => ({
        id: d.id,
        fullName: d.user?.fullName || 'Medical Officer',
        specialty: d.specialty || 'General Medicine',
        qualification: d.qualification || 'MBBS',
        isAvailable: d.isAvailable,
        status: d.isAvailable ? 'Available' : 'Unavailable',
      })),
      diagnostics: facility.diagnostics.map((t) => ({
        id: t.id,
        testName: t.testName,
        category: t.category,
        isAvailable: t.isAvailable,
        turnaroundHours: t.turnaroundHours,
        costInr: t.costInr,
        status: t.isAvailable ? 'Available' : 'Unavailable',
      })),
      medicines: facility.medicines.map((m) => ({
        id: m.id,
        medicineName: m.medicineName,
        category: m.category,
        quantity: m.quantity,
        unit: m.unit,
        stockThreshold: m.stockThreshold,
        isAvailable: m.isAvailable && m.quantity > 0,
        status: m.isAvailable && m.quantity > 0 ? 'Available' : 'Unavailable',
      })),
      slots: facility.slots.map((s) => ({
        id: s.id,
        slotName: s.slotName,
        startTime: s.startTime,
        endTime: s.endTime,
        maxCapacity: s.maxCapacity,
        isAvailable: s.isAvailable,
        status: s.isAvailable ? 'Available' : 'Unavailable',
      })),
      summaryMatrix,
    };
  },

  /**
   * Nearby Facility Search with distance computation (FR-08).
   */
  async getNearbyFacilities(query: NearbyFacilityQuery) {
    const {
      latitude,
      longitude,
      radiusKm = 50,
      district,
      type,
      serviceName,
      hasBeds,
      hasDoctor,
      hasMedicine,
      testName,
    } = query;

    const where: Prisma.FacilityWhereInput = {
      isActive: true,
      latitude: { not: null },
      longitude: { not: null },
      ...(district && district !== 'All Districts' && district !== 'ALL'
        ? { district: { equals: district, mode: 'insensitive' } }
        : {}),
      ...(type && (type as string) !== 'ALL' ? { type } : {}),
      ...(hasBeds ? { bedStatus: { availableBeds: { gt: 0 } } } : {}),
      ...(hasDoctor ? { doctors: { some: { isAvailable: true } } } : {}),
      ...(serviceName && serviceName !== 'All Services' && serviceName !== 'ALL'
        ? buildServiceWhereClause(serviceName)
        : {}),
      ...(hasMedicine
        ? {
            medicines: {
              some: {
                medicineName: { contains: hasMedicine, mode: 'insensitive' },
                isAvailable: true,
                quantity: { gt: 0 },
              },
            },
          }
        : {}),
      ...(testName
        ? {
            diagnostics: {
              some: {
                testName: { contains: testName, mode: 'insensitive' },
                isAvailable: true,
              },
            },
          }
        : {}),
    };

    const facilities = await prisma.facility.findMany({
      where,
      include: {
        bedStatus: true,
        services: { where: { isActive: true } },
        medicines: { where: { isAvailable: true } },
        diagnostics: { where: { isAvailable: true } },
        slots: { where: { isAvailable: true } },
        doctors: {
          where: { isAvailable: true },
          select: {
            id: true,
            specialty: true,
            qualification: true,
            isAvailable: true,
            user: { select: { fullName: true } },
          },
        },
      },
    });

    // Calculate spherical distance and filter by radius
    const results = facilities
      .map((f) => {
        const lat = Number(f.latitude);
        const lon = Number(f.longitude);
        const distanceKm = calculateDistanceKm(latitude, longitude, lat, lon);
        return {
          ...f,
          distanceKm,
        };
      })
      .filter((f) => f.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return results;
  },

  /**
   * Update Bed Availability (FR-07).
   */
  async updateBedAvailability(facilityId: string, data: {
    totalBeds?: number;
    availableBeds?: number;
    oxygenBedsTotal?: number;
    oxygenBedsAvailable?: number;
    icuBedsTotal?: number;
    icuBedsAvailable?: number;
  }) {
    const bedStatus = await prisma.facilityBedStatus.upsert({
      where: { facilityId },
      create: {
        facilityId,
        totalBeds: data.totalBeds ?? 10,
        availableBeds: data.availableBeds ?? 5,
        oxygenBedsTotal: data.oxygenBedsTotal ?? 2,
        oxygenBedsAvailable: data.oxygenBedsAvailable ?? 1,
        icuBedsTotal: data.icuBedsTotal ?? 0,
        icuBedsAvailable: data.icuBedsAvailable ?? 0,
      },
      update: {
        ...data,
      },
    });

    await redisCache.del(`facilities:id:${facilityId}`);
    return bedStatus;
  },

  /**
   * Update or Upsert Medicine Stock (FR-07).
   */
  async upsertMedicine(facilityId: string, data: {
    id?: string;
    medicineName: string;
    category?: string;
    quantity: number;
    unit?: string;
    stockThreshold?: number;
    isAvailable?: boolean;
    expiryDate?: string;
  }) {
    const { medicineName, category, quantity, unit, stockThreshold, isAvailable, expiryDate } = data;

    const medicine = await prisma.facilityMedicine.upsert({
      where: {
        facilityId_medicineName: {
          facilityId,
          medicineName: medicineName.trim(),
        },
      },
      create: {
        facilityId,
        medicineName: medicineName.trim(),
        category: category?.trim() || null,
        quantity,
        unit: unit?.trim() || 'strips',
        stockThreshold: stockThreshold ?? 20,
        isAvailable: isAvailable ?? quantity > 0,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
      },
      update: {
        category: category?.trim() || undefined,
        quantity,
        unit: unit?.trim() || undefined,
        stockThreshold: stockThreshold ?? undefined,
        isAvailable: isAvailable ?? quantity > 0,
        expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      },
    });

    await redisCache.del(`facilities:id:${facilityId}`);
    return medicine;
  },

  /**
   * Toggle Medicine Availability (FR-07).
   */
  async toggleMedicineAvailability(facilityId: string, medicineId: string, isAvailable?: boolean) {
    const current = await prisma.facilityMedicine.findUnique({
      where: { id: medicineId },
    });
    if (!current || current.facilityId !== facilityId) throw new Error('Medicine record not found');

    const newStatus = isAvailable !== undefined ? isAvailable : !current.isAvailable;
    const updated = await prisma.facilityMedicine.update({
      where: { id: medicineId },
      data: { isAvailable: newStatus },
    });

    await redisCache.del(`facilities:id:${facilityId}`);
    return updated;
  },

  /**
   * Update or Upsert Diagnostic Test (FR-07).
   */
  async upsertDiagnostic(facilityId: string, data: {
    id?: string;
    testName: string;
    category?: string;
    isAvailable: boolean;
    turnaroundHours?: number;
    costInr?: number;
  }) {
    const { testName, category, isAvailable, turnaroundHours, costInr } = data;

    const diagnostic = await prisma.facilityDiagnostic.upsert({
      where: {
        facilityId_testName: {
          facilityId,
          testName: testName.trim(),
        },
      },
      create: {
        facilityId,
        testName: testName.trim(),
        category: category?.trim() || null,
        isAvailable,
        turnaroundHours: turnaroundHours ?? 24,
        costInr: costInr ?? 0,
      },
      update: {
        category: category?.trim() || undefined,
        isAvailable,
        turnaroundHours: turnaroundHours ?? undefined,
        costInr: costInr ?? undefined,
      },
    });

    await redisCache.del(`facilities:id:${facilityId}`);
    return diagnostic;
  },

  /**
   * Toggle Diagnostic Test Availability (FR-07).
   */
  async toggleDiagnosticAvailability(facilityId: string, diagnosticId: string, isAvailable?: boolean) {
    const current = await prisma.facilityDiagnostic.findUnique({
      where: { id: diagnosticId },
    });
    if (!current || current.facilityId !== facilityId) throw new Error('Diagnostic test not found');

    const newStatus = isAvailable !== undefined ? isAvailable : !current.isAvailable;
    const updated = await prisma.facilityDiagnostic.update({
      where: { id: diagnosticId },
      data: { isAvailable: newStatus },
    });

    await redisCache.del(`facilities:id:${facilityId}`);
    return updated;
  },

  /**
   * Update Doctor Availability (FR-07).
   */
  async updateDoctorAvailability(facilityId: string, doctorId: string, isAvailable: boolean) {
    const doctor = await prisma.doctor.findFirst({
      where: { id: doctorId, facilityId },
    });
    if (!doctor) throw new Error('Doctor not found at this facility');

    const updated = await prisma.doctor.update({
      where: { id: doctorId },
      data: { isAvailable },
      include: {
        user: { select: { fullName: true } },
      },
    });

    await redisCache.del(`facilities:id:${facilityId}`);
    return updated;
  },

  /**
   * Manage Consultation Appointment Slots (FR-07).
   */
  async upsertSlot(facilityId: string, data: {
    id?: string;
    slotName: string;
    startTime?: string;
    endTime?: string;
    maxCapacity?: number;
    isAvailable?: boolean;
  }) {
    const { slotName, startTime = '09:00', endTime = '12:00', maxCapacity = 20, isAvailable = true } = data;

    const slot = await prisma.facilitySlot.upsert({
      where: {
        facilityId_slotName: {
          facilityId,
          slotName: slotName.trim(),
        },
      },
      create: {
        facilityId,
        slotName: slotName.trim(),
        startTime,
        endTime,
        maxCapacity,
        isAvailable,
      },
      update: {
        startTime,
        endTime,
        maxCapacity,
        isAvailable,
      },
    });

    await redisCache.del(`facilities:id:${facilityId}`);
    return slot;
  },

  async toggleSlot(facilityId: string, slotId: string, isAvailable?: boolean) {
    const current = await prisma.facilitySlot.findUnique({ where: { id: slotId } });
    if (!current || current.facilityId !== facilityId) throw new Error('Slot not found');

    const newStatus = isAvailable !== undefined ? isAvailable : !current.isAvailable;
    const updated = await prisma.facilitySlot.update({
      where: { id: slotId },
      data: { isAvailable: newStatus },
    });

    await redisCache.del(`facilities:id:${facilityId}`);
    return updated;
  },

  async deleteSlot(facilityId: string, slotId: string) {
    const slot = await prisma.facilitySlot.findFirst({
      where: { id: slotId, facilityId },
    });
    if (!slot) throw new Error('Slot not found');

    await prisma.facilitySlot.delete({ where: { id: slotId } });
    await redisCache.del(`facilities:id:${facilityId}`);
    return { success: true };
  },

  /**
   * Service Directory Management (FR-06).
   */
  async addService(facilityId: string, name: string, category?: string) {
    const service = await prisma.facilityService.upsert({
      where: {
        facilityId_name: {
          facilityId,
          name: name.trim(),
        },
      },
      create: {
        facilityId,
        name: name.trim(),
        category: category?.trim() || null,
        isActive: true,
      },
      update: {
        category: category?.trim() || undefined,
        isActive: true,
      },
    });

    await redisCache.del(`facilities:id:${facilityId}`);
    return service;
  },

  async removeService(facilityId: string, serviceId: string) {
    const service = await prisma.facilityService.findFirst({
      where: { id: serviceId, facilityId },
    });
    if (!service) throw new Error('Service not found');

    await prisma.facilityService.delete({ where: { id: serviceId } });
    await redisCache.del(`facilities:id:${facilityId}`);
    return { success: true };
  },

  async getServicesCatalog() {
    const counts = await prisma.facilityService.groupBy({
      by: ['name'],
      where: { isActive: true },
      _count: {
        facilityId: true,
      },
    });

    const countMap: Record<string, number> = {};
    counts.forEach((c) => {
      countMap[c.name.toLowerCase()] = c._count.facilityId;
    });

    return STANDARD_SERVICES.map((s) => ({
      ...s,
      facilityCount: countMap[s.name.toLowerCase()] || 0,
    }));
  },
};
