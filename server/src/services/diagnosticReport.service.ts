import { prisma } from "../config/prisma";
import { DiagnosticStatus } from "@prisma/client";

export class DiagnosticReportService {
  static async list(filters: { patientId?: string; facilityId?: string; doctorId?: string; status?: DiagnosticStatus }) {
    const where: any = {};
    if (filters.patientId) where.patientId = filters.patientId;
    if (filters.facilityId) where.facilityId = filters.facilityId;
    if (filters.doctorId) where.doctorId = filters.doctorId;
    if (filters.status) where.status = filters.status;

    return prisma.diagnosticReport.findMany({
      where,
      include: {
        facility: {
          select: {
            id: true,
            name: true,
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
                phone: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async create(data: {
    patientId: string;
    facilityId: string;
    doctorId?: string;
    testName: string;
    category?: string;
    status?: DiagnosticStatus;
    sampleCollectedAt?: string | Date;
    keyResult: string;
    findings?: string;
    normalRange?: string;
    verifiedBy?: string;
  }) {
    return prisma.diagnosticReport.create({
      data: {
        patientId: data.patientId,
        facilityId: data.facilityId,
        doctorId: data.doctorId || null,
        testName: data.testName,
        category: data.category || null,
        status: data.status || "COMPLETED",
        sampleCollectedAt: data.sampleCollectedAt ? new Date(data.sampleCollectedAt) : new Date(),
        keyResult: data.keyResult,
        findings: data.findings || null,
        normalRange: data.normalRange || null,
        verifiedBy: data.verifiedBy || "Govt Pathology Specialist",
      },
      include: {
        facility: true,
        patient: { include: { user: true } },
      },
    });
  }

  static async delete(id: string) {
    return prisma.diagnosticReport.delete({
      where: { id },
    });
  }
}
