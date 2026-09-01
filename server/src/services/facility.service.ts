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
}

export interface NearbyFacilityQuery {
  latitude: number;
  longitude: number;
  radiusKm?: number; // default 50km
  district?: string;
  type?: FacilityType;
  serviceName?: string;
  hasBeds?: boolean;
  hasMedicine?: string; // search for medicine in stock
  testName?: string;
}

/**
 * Calculates Haversine distance in kilometers between two GPS coordinates.
 */
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

export const facilityService = {
  /**
   * Register a new healthcare facility (FR-05).
   * Accessible by SUPER_ADMIN or DISTRICT_ADMIN (within their district).
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
    } = input;

    const facility = await prisma.facility.create({
      data: {
        name: name.trim(),
        type,
        district: district.trim(),
        village: village?.trim() || null,
        address: address?.trim() || null,
        pincode: pincode?.trim() || null,
        latitude: latitude !== undefined ? new Prisma.Decimal(latitude) : null,
        longitude: longitude !== undefined ? new Prisma.Decimal(longitude) : null,
        contactPhone: contactPhone?.trim() || null,
        contactEmail: contactEmail?.trim() || null,
        workingHours: workingHours?.trim() || "24x7 Emergency / 09:00 - 17:00 OPD",
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
      },
      include: {
        bedStatus: true,
        services: true,
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
      ...(district && district !== "ALL" ? { district: { equals: district, mode: "insensitive" } } : {}),
      ...(type ? { type } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { village: { contains: search, mode: "insensitive" } },
              { district: { contains: search, mode: "insensitive" } },
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
      ...(service
        ? {
            services: {
              some: {
                name: { contains: service, mode: "insensitive" },
                isActive: true,
              },
            },
          }
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
          doctors: {
            where: { isAvailable: true },
            select: { id: true, specialty: true, qualification: true, user: { select: { fullName: true } } },
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
   * Nearby Facility Search with distance computation (FR-08).
   */
  async getNearbyFacilities(query: NearbyFacilityQuery) {
    const { latitude, longitude, radiusKm = 50, district, type, serviceName, hasBeds, hasMedicine, testName } = query;

    const where: Prisma.FacilityWhereInput = {
      isActive: true,
      latitude: { not: null },
      longitude: { not: null },
      ...(district && district !== "ALL" ? { district: { equals: district, mode: "insensitive" } } : {}),
      ...(type ? { type } : {}),
      ...(hasBeds ? { bedStatus: { availableBeds: { gt: 0 } } } : {}),
      ...(serviceName ? { services: { some: { name: { contains: serviceName, mode: "insensitive" }, isActive: true } } } : {}),
      ...(hasMedicine ? { medicines: { some: { medicineName: { contains: hasMedicine, mode: "insensitive" }, isAvailable: true, quantity: { gt: 0 } } } } : {}),
      ...(testName ? { diagnostics: { some: { testName: { contains: testName, mode: "insensitive" }, isAvailable: true } } } : {}),
    };

    const facilities = await prisma.facility.findMany({
      where,
      include: {
        bedStatus: true,
        services: { where: { isActive: true } },
        medicines: { where: { isAvailable: true } },
        diagnostics: { where: { isAvailable: true } },
        doctors: {
          where: { isAvailable: true },
          select: { id: true, specialty: true, qualification: true, user: { select: { fullName: true } } },
        },
      },
    });

    // Calculate distance and filter by radius
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
   * Used by Facility Admin or Super/District Admin.
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
        unit: unit?.trim() || "strips",
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
   * Update or Upsert Diagnostic Test (FR-07).
   */
  async upsertDiagnostic(facilityId: string, data: {
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
};
