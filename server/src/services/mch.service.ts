import { prisma } from "../config/prisma";
import { redisCache } from "../config/redis";
import { MchRiskLevel } from "@prisma/client";

export interface CreateMchInput {
  patientId?: string;
  healthWorkerId?: string;
  facilityId?: string;
  motherName: string;
  age?: number;
  village?: string;
  edd?: string | Date;
  trimester?: string;
  riskLevel?: MchRiskLevel;
  ancCount?: number;
  hemoglobin?: number;
  ifaDelivered?: boolean;
  notes?: string;
}

/**
 * Invalidate Redis caches for MCH records
 */
export async function invalidateMchCaches(): Promise<void> {
  try {
    await redisCache.delPattern("mch:list:*");
  } catch {
    // Non-blocking
  }
}

export class MchService {
  static async list(filters: { healthWorkerId?: string; facilityId?: string; riskLevel?: MchRiskLevel }) {
    const cacheKey = `mch:list:${filters.healthWorkerId || "ALL"}:${filters.facilityId || "ALL"}:${filters.riskLevel || "ALL"}`;
    const cached = await redisCache.get<any[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const where: any = {};
    if (filters.healthWorkerId) where.healthWorkerId = filters.healthWorkerId;
    if (filters.facilityId) where.facilityId = filters.facilityId;
    if (filters.riskLevel) where.riskLevel = filters.riskLevel;

    const records = await prisma.mchRecord.findMany({
      where,
      include: {
        facility: true,
        healthWorker: {
          include: {
            user: {
              select: {
                fullName: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Cache MCH list for 60 seconds (1 minute TTL)
    await redisCache.set(cacheKey, records, 60);

    return records;
  }

  static async create(data: CreateMchInput) {
    const record = await prisma.mchRecord.create({
      data: {
        patientId: data.patientId || null,
        healthWorkerId: data.healthWorkerId || null,
        facilityId: data.facilityId || null,
        motherName: data.motherName,
        age: data.age ? Number(data.age) : null,
        village: data.village || null,
        edd: data.edd ? new Date(data.edd) : null,
        trimester: data.trimester || "1st Trimester",
        riskLevel: data.riskLevel || "NORMAL",
        ancCount: Number(data.ancCount) || 0,
        hemoglobin: data.hemoglobin ? Number(data.hemoglobin) : null,
        ifaDelivered: data.ifaDelivered === true,
        notes: data.notes || null,
      },
      include: {
        facility: true,
      },
    });

    await invalidateMchCaches();
    return record;
  }

  static async update(id: string, data: Partial<CreateMchInput>) {
    const updateData: any = {};
    if (data.motherName) updateData.motherName = data.motherName;
    if (data.age !== undefined) updateData.age = Number(data.age);
    if (data.village !== undefined) updateData.village = data.village;
    if (data.edd !== undefined) updateData.edd = data.edd ? new Date(data.edd) : null;
    if (data.trimester !== undefined) updateData.trimester = data.trimester;
    if (data.riskLevel !== undefined) updateData.riskLevel = data.riskLevel;
    if (data.ancCount !== undefined) updateData.ancCount = Number(data.ancCount);
    if (data.hemoglobin !== undefined) updateData.hemoglobin = Number(data.hemoglobin);
    if (data.ifaDelivered !== undefined) updateData.ifaDelivered = data.ifaDelivered;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const updated = await prisma.mchRecord.update({
      where: { id },
      data: updateData,
    });

    await invalidateMchCaches();
    return updated;
  }

  static async delete(id: string) {
    const deleted = await prisma.mchRecord.delete({
      where: { id },
    });

    await invalidateMchCaches();
    return deleted;
  }
}
