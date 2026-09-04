import { prisma } from "../config/prisma";
import { redisCache } from "../config/redis";
import { DiagnosticStatus } from "@prisma/client";

/**
 * Invalidate Redis caches for diagnostic reports
 */
export async function invalidateDiagnosticCaches(): Promise<void> {
  try {
    await redisCache.delPattern("diagnostics:list:*");
  } catch {
    // Non-blocking
  }
}

export class DiagnosticReportService {
  static async list(filters: { patientId?: string; facilityId?: string; doctorId?: string; status?: DiagnosticStatus }) {
    const cacheKey = `diagnostics:list:${filters.patientId || "ALL"}:${filters.facilityId || "ALL"}:${filters.doctorId || "ALL"}:${filters.status || "ALL"}`;
    const cached = await redisCache.get<any[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const where: any = {};
    if (filters.patientId) where.patientId = filters.patientId;
    if (filters.facilityId) where.facilityId = filters.facilityId;
    if (filters.doctorId) where.doctorId = filters.doctorId;
    if (filters.status) where.status = filters.status;

    const reports = await prisma.diagnosticReport.findMany({
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

    // Cache diagnostic reports list for 60 seconds (1 minute TTL)
    await redisCache.set(cacheKey, reports, 60);

    return reports;
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
    const report = await prisma.diagnosticReport.create({
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

    await invalidateDiagnosticCaches();
    return report;
  }

  static async delete(id: string) {
    const deleted = await prisma.diagnosticReport.delete({
      where: { id },
    });

    await invalidateDiagnosticCaches();
    return deleted;
  }
}
