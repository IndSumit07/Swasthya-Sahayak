import { prisma } from "../config/prisma";

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

export class PrescriptionService {
  static async list(filters: { patientId?: string; doctorId?: string; facilityId?: string }) {
    const where: any = {};
    if (filters.patientId) where.patientId = filters.patientId;
    if (filters.doctorId) where.doctorId = filters.doctorId;
    if (filters.facilityId) where.facilityId = filters.facilityId;

    return prisma.prescription.findMany({
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
  }

  static async getById(id: string) {
    return prisma.prescription.findUnique({
      where: { id },
      include: {
        items: true,
        facility: true,
        doctor: { include: { user: true } },
        patient: { include: { user: true } },
      },
    });
  }

  static async create(data: CreatePrescriptionInput) {
    return prisma.prescription.create({
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
  }

  static async delete(id: string) {
    return prisma.prescription.delete({
      where: { id },
    });
  }
}
