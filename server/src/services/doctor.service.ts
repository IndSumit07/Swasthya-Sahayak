import { prisma } from "../config/prisma";
import { redisCache } from "../config/redis";
import { Prisma } from "@prisma/client";

export interface DoctorSearchQuery {
  specialty?: string;
  facilityId?: string;
  district?: string;
  isAvailable?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export const doctorService = {
  /**
   * Search and filter doctors across public health facilities (FR-13).
   * Supports filtering by Specialty, Facility, District/Location, Availability, and Name.
   * High-performance Redis caching with TTL of 60 seconds.
   */
  async searchDoctors(query: DoctorSearchQuery) {
    const { specialty, facilityId, district, isAvailable, search, limit = 50, offset = 0 } = query;

    const cacheKey = `doctors:search:${(specialty || "ALL").toUpperCase()}:${facilityId || "ALL"}:${(district || "ALL").toUpperCase()}:${isAvailable !== undefined ? (isAvailable ? "1" : "0") : "ALL"}:${(search || "").trim().toLowerCase()}:${limit}:${offset}`;

    const cached = await redisCache.get<{ doctors: any[]; total: number }>(cacheKey);
    if (cached) {
      return cached;
    }

    const where: Prisma.DoctorWhereInput = {
      ...(isAvailable !== undefined ? { isAvailable } : {}),
      ...(facilityId ? { facilityId } : {}),
      ...(specialty && specialty !== "ALL" && specialty !== "All Specialties"
        ? { specialty: { contains: specialty, mode: "insensitive" } }
        : {}),
      ...(district && district !== "ALL" && district !== "All Districts"
        ? { facility: { district: { equals: district, mode: "insensitive" } } }
        : {}),
      ...(search
        ? {
            OR: [
              { user: { fullName: { contains: search, mode: "insensitive" } } },
              { specialty: { contains: search, mode: "insensitive" } },
              { qualification: { contains: search, mode: "insensitive" } },
              { facility: { name: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    const [doctors, total] = await Promise.all([
      prisma.doctor.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              avatarUrl: true,
            },
          },
          facility: {
            select: {
              id: true,
              name: true,
              type: true,
              district: true,
              village: true,
              contactPhone: true,
              workingHours: true,
            },
          },
          rosterEntries: {
            where: { status: "ON_DUTY" },
            take: 1,
          },
        },
        orderBy: [{ isAvailable: "desc" }, { user: { fullName: "asc" } }],
        take: limit,
        skip: offset,
      }),
      prisma.doctor.count({ where }),
    ]);

    const result = { doctors, total, limit, offset };

    // Cache doctors search results for 60 seconds
    await redisCache.set(cacheKey, result, 60);

    return result;
  },

  /**
   * Get distinct list of medical specialties available across facilities (FR-13).
   */
  async getSpecialties() {
    const cacheKey = "doctors:specialties:list";
    const cached = await redisCache.get<string[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const doctors = await prisma.doctor.findMany({
      where: { specialty: { not: null } },
      select: { specialty: true },
      distinct: ["specialty"],
    });

    const specialties = doctors
      .map((d) => d.specialty?.trim())
      .filter((s): s is string => Boolean(s))
      .sort();

    // Cache specialties list for 10 minutes (600s TTL)
    await redisCache.set(cacheKey, specialties, 600);

    return specialties;
  },
};
