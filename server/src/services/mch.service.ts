import { prisma } from "../config/prisma";
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

export class MchService {
  static async list(filters: { healthWorkerId?: string; facilityId?: string; riskLevel?: MchRiskLevel }) {
    const where: any = {};
    if (filters.healthWorkerId) where.healthWorkerId = filters.healthWorkerId;
    if (filters.facilityId) where.facilityId = filters.facilityId;
    if (filters.riskLevel) where.riskLevel = filters.riskLevel;

    return prisma.mchRecord.findMany({
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
  }

  static async create(data: CreateMchInput) {
    return prisma.mchRecord.create({
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

    return prisma.mchRecord.update({
      where: { id },
      data: updateData,
    });
  }

  static async delete(id: string) {
    return prisma.mchRecord.delete({
      where: { id },
    });
  }
}
