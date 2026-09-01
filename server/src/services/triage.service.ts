import { prisma } from "../config/prisma";
import { Gender, TriagePriority } from "@prisma/client";

export interface CreateTriageInput {
  patientId?: string;
  patientName: string;
  patientAge?: number;
  patientGender?: Gender;
  village?: string;
  assessedById: string;
  facilityId?: string;
  bpSystolic?: number;
  bpDiastolic?: number;
  spo2?: number;
  temperature?: number;
  pulse?: number;
  symptoms?: string[];
  isPregnant?: boolean;
  notes?: string;
}

export class TriageService {
  static async list(filters: { patientId?: string; assessedById?: string; facilityId?: string; priority?: TriagePriority }) {
    const where: any = {};
    if (filters.patientId) where.patientId = filters.patientId;
    if (filters.assessedById) where.assessedById = filters.assessedById;
    if (filters.facilityId) where.facilityId = filters.facilityId;
    if (filters.priority) where.priority = filters.priority;

    return prisma.triageAssessment.findMany({
      where,
      include: {
        facility: true,
        assessedBy: {
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
                phone: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async create(data: CreateTriageInput) {
    const sys = Number(data.bpSystolic) || 0;
    const sp = Number(data.spo2) || 100;
    const tp = Number(data.temperature) || 98.6;

    let priority: TriagePriority = "ROUTINE";
    let actionTaken = "Vitals stable. Routine village checkup recorded.";

    if (sp < 92 || sys >= 160) {
      priority = "CRITICAL";
      actionTaken = "Emergency escalation initiated. 108 ambulance dispatch recommended.";
    } else if (tp >= 102 || sys >= 140 || sp < 95 || data.isPregnant) {
      priority = "MODERATE";
      actionTaken = "Assisted Tele-OPD consult recommended within 24 hours.";
    }

    return prisma.triageAssessment.create({
      data: {
        patientId: data.patientId || null,
        patientName: data.patientName,
        patientAge: data.patientAge ? Number(data.patientAge) : null,
        patientGender: data.patientGender || null,
        village: data.village || null,
        assessedById: data.assessedById,
        facilityId: data.facilityId || null,
        bpSystolic: data.bpSystolic ? Number(data.bpSystolic) : null,
        bpDiastolic: data.bpDiastolic ? Number(data.bpDiastolic) : null,
        spo2: data.spo2 ? Number(data.spo2) : null,
        temperature: data.temperature ? Number(data.temperature) : null,
        pulse: data.pulse ? Number(data.pulse) : null,
        symptoms: data.symptoms || [],
        isPregnant: data.isPregnant === true,
        priority,
        actionTaken,
        notes: data.notes || null,
      },
      include: {
        facility: true,
        assessedBy: true,
      },
    });
  }

  static async delete(id: string) {
    return prisma.triageAssessment.delete({
      where: { id },
    });
  }
}
