import { Request, Response } from "express";
import { TriageService } from "../services/triage.service";

export class TriageController {
  static async list(req: Request, res: Response): Promise<void> {
    try {
      const patientId = req.query.patientId as string | undefined;
      const assessedById = req.query.assessedById as string | undefined;
      const facilityId = req.query.facilityId as string | undefined;
      const priority = req.query.priority as any;
      const user = (req as any).user;

      let effectiveAssessedById = assessedById;
      if (user?.role === "HEALTH_WORKER") {
        effectiveAssessedById = user.id;
      }

      const records = await TriageService.list({
        patientId,
        assessedById: effectiveAssessedById,
        facilityId,
        priority,
      });

      res.json({ success: true, data: records });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || "Failed to list triage records." });
    }
  }

  static async create(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;

      if (!req.body.patientName) {
        res.status(400).json({ success: false, message: "patientName is required." });
        return;
      }

      const triage = await TriageService.create({
        patientId: req.body.patientId,
        patientName: req.body.patientName,
        patientAge: req.body.patientAge,
        patientGender: req.body.patientGender,
        village: req.body.village,
        assessedById: user.id,
        facilityId: req.body.facilityId,
        bpSystolic: req.body.bpSystolic,
        bpDiastolic: req.body.bpDiastolic,
        spo2: req.body.spo2,
        temperature: req.body.temperature,
        pulse: req.body.pulse,
        symptoms: req.body.symptoms,
        isPregnant: req.body.isPregnant,
        notes: req.body.notes,
      });

      res.status(201).json({ success: true, data: triage, message: "Triage assessment completed successfully!" });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || "Failed to create triage assessment." });
    }
  }

  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      await TriageService.delete(id);
      res.json({ success: true, message: "Triage record deleted." });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || "Failed to delete triage record." });
    }
  }
}
