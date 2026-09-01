import { Request, Response } from "express";
import { DiagnosticReportService } from "../services/diagnosticReport.service";
import { prisma } from "../config/prisma";

export class DiagnosticReportController {
  static async list(req: Request, res: Response): Promise<void> {
    try {
      const patientId = req.query.patientId as string | undefined;
      const facilityId = req.query.facilityId as string | undefined;
      const doctorId = req.query.doctorId as string | undefined;
      const status = req.query.status as any;
      const user = (req as any).user;

      let effectivePatientId = patientId;
      if (user?.role === "PATIENT") {
        const p = await prisma.patient.findUnique({ where: { userId: user.id } });
        if (p) effectivePatientId = p.id;
      }

      const reports = await DiagnosticReportService.list({
        patientId: effectivePatientId,
        facilityId,
        doctorId,
        status,
      });

      res.json({ success: true, data: reports });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || "Failed to list lab reports." });
    }
  }

  static async create(req: Request, res: Response): Promise<void> {
    try {
      if (!req.body.patientId || !req.body.facilityId || !req.body.testName || !req.body.keyResult) {
        res.status(400).json({ success: false, message: "patientId, facilityId, testName, and keyResult are required." });
        return;
      }

      const report = await DiagnosticReportService.create(req.body);
      res.status(201).json({ success: true, data: report, message: "Diagnostic report saved successfully!" });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || "Failed to create lab report." });
    }
  }

  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      await DiagnosticReportService.delete(id);
      res.json({ success: true, message: "Lab report deleted." });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || "Failed to delete lab report." });
    }
  }
}
