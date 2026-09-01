import { Request, Response } from "express";
import { MchService } from "../services/mch.service";
import { prisma } from "../config/prisma";

export class MchController {
  static async list(req: Request, res: Response): Promise<void> {
    try {
      const healthWorkerId = req.query.healthWorkerId as string | undefined;
      const facilityId = req.query.facilityId as string | undefined;
      const riskLevel = req.query.riskLevel as any;
      const user = (req as any).user;

      let effectiveHealthWorkerId = healthWorkerId;
      if (user?.role === "HEALTH_WORKER") {
        const hw = await prisma.healthWorker.findUnique({ where: { userId: user.id } });
        if (hw) effectiveHealthWorkerId = hw.id;
      }

      const records = await MchService.list({
        healthWorkerId: effectiveHealthWorkerId,
        facilityId,
        riskLevel,
      });

      res.json({ success: true, data: records });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || "Failed to list MCH records." });
    }
  }

  static async create(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      let healthWorkerId = req.body.healthWorkerId;

      if (!healthWorkerId && user?.role === "HEALTH_WORKER") {
        const hw = await prisma.healthWorker.findUnique({ where: { userId: user.id } });
        if (hw) healthWorkerId = hw.id;
      }

      if (!req.body.motherName) {
        res.status(400).json({ success: false, message: "motherName is required." });
        return;
      }

      const mch = await MchService.create({
        patientId: req.body.patientId,
        healthWorkerId,
        facilityId: req.body.facilityId,
        motherName: req.body.motherName,
        age: req.body.age,
        village: req.body.village,
        edd: req.body.edd,
        trimester: req.body.trimester,
        riskLevel: req.body.riskLevel,
        ancCount: req.body.ancCount,
        hemoglobin: req.body.hemoglobin,
        ifaDelivered: req.body.ifaDelivered,
        notes: req.body.notes,
      });

      res.status(201).json({ success: true, data: mch, message: "Maternal record created successfully!" });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || "Failed to create MCH record." });
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const mch = await MchService.update(id, req.body);
      res.json({ success: true, data: mch, message: "Maternal record updated successfully." });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || "Failed to update MCH record." });
    }
  }

  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      await MchService.delete(id);
      res.json({ success: true, message: "Maternal record deleted." });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || "Failed to delete MCH record." });
    }
  }
}
