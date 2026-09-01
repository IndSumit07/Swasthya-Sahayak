import { prisma } from "../config/prisma";
import { ReferralPriority, ReferralStatus } from "@prisma/client";

export class ReferralService {
  static async list(filters: { patientId?: string; fromFacilityId?: string; toFacilityId?: string; status?: ReferralStatus; priority?: ReferralPriority; district?: string }) {
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

    return prisma.referral.findMany({
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
  }

  static async getById(id: string) {
    return prisma.referral.findUnique({
      where: { id },
      include: {
        fromFacility: true,
        toFacility: true,
        createdBy: true,
        patient: { include: { user: true } },
      },
    });
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
    return prisma.referral.create({
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
  }

  static async updateStatus(id: string, status: ReferralStatus) {
    return prisma.referral.update({
      where: { id },
      data: { status },
      include: {
        fromFacility: true,
        toFacility: true,
        patient: { include: { user: true } },
      },
    });
  }

  static async delete(id: string) {
    return prisma.referral.delete({
      where: { id },
    });
  }
}
