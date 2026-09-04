import { prisma } from "../config/prisma";
import { redisCache } from "../config/redis";
import { ReferralPriority, ReferralStatus } from "@prisma/client";

/**
 * Invalidate Redis caches for referrals
 */
export async function invalidateReferralCaches(id?: string): Promise<void> {
  try {
    if (id) {
      await redisCache.del(`referrals:id:${id}`);
    }
    await redisCache.delPattern("referrals:list:*");
  } catch {
    // Non-blocking
  }
}

export class ReferralService {
  static async list(filters: { patientId?: string; fromFacilityId?: string; toFacilityId?: string; status?: ReferralStatus; priority?: ReferralPriority; district?: string }) {
    const cacheKey = `referrals:list:${filters.patientId || "ALL"}:${filters.fromFacilityId || "ALL"}:${filters.toFacilityId || "ALL"}:${filters.status || "ALL"}:${filters.priority || "ALL"}:${filters.district || "ALL"}`;
    const cached = await redisCache.get<any[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const where: any = {};
    if (filters.patientId) where.patientId = filters.patientId;
    if (filters.fromFacilityId) where.fromFacilityId = filters.fromFacilityId;
    if (filters.toFacilityId) where.toFacilityId = filters.toFacilityId;
    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;
    if (filters.district) {
      where.OR = [
        { fromFacility: { district: filters.district } },
        { toFacility: { district: filters.district } },
      ];
    }

    const referrals = await prisma.referral.findMany({
      where,
      include: {
        fromFacility: true,
        toFacility: true,
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
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

    // Cache referrals list for 60 seconds (1 minute TTL)
    await redisCache.set(cacheKey, referrals, 60);

    return referrals;
  }

  static async getById(id: string) {
    const cacheKey = `referrals:id:${id}`;
    const cached = await redisCache.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    const referral = await prisma.referral.findUnique({
      where: { id },
      include: {
        fromFacility: true,
        toFacility: true,
        createdBy: true,
        patient: { include: { user: true } },
      },
    });

    if (referral) {
      // Cache referral detail for 2 minutes (120 seconds TTL)
      await redisCache.set(cacheKey, referral, 120);
    }

    return referral;
  }

  static async create(data: {
    patientId: string;
    fromFacilityId: string;
    toFacilityId: string;
    createdById: string;
    reason: string;
    requiredSpecialty?: string;
    priority?: ReferralPriority;
    notes?: string;
  }) {
    const referral = await prisma.referral.create({
      data: {
        patientId: data.patientId,
        fromFacilityId: data.fromFacilityId,
        toFacilityId: data.toFacilityId,
        createdById: data.createdById,
        reason: data.reason,
        requiredSpecialty: data.requiredSpecialty || null,
        priority: data.priority || "ROUTINE",
        status: "CREATED",
        notes: data.notes || null,
      },
      include: {
        fromFacility: true,
        toFacility: true,
        createdBy: true,
        patient: { include: { user: true } },
      },
    });

    await invalidateReferralCaches();
    return referral;
  }

  static async updateStatus(id: string, status: ReferralStatus) {
    const updated = await prisma.referral.update({
      where: { id },
      data: { status },
      include: {
        fromFacility: true,
        toFacility: true,
        patient: { include: { user: true } },
      },
    });

    await invalidateReferralCaches(id);
    return updated;
  }

  static async delete(id: string) {
    const deleted = await prisma.referral.delete({
      where: { id },
    });

    await invalidateReferralCaches(id);
    return deleted;
  }
}
