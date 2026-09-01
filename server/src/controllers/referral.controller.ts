import { Request, Response } from "express";
import { ReferralService } from "../services/referral.service";
import { prisma } from "../config/prisma";

export class ReferralController {
  static async list(req: Request, res: Response): Promise<void> {
    try {
      const patientId = req.query.patientId as string | undefined;
      const fromFacilityId = req.query.fromFacilityId as string | undefined;
      const toFacilityId = req.query.toFacilityId as string | undefined;
      const status = req.query.status as any;
      const priority = req.query.priority as any;
      const district = req.query.district as string | undefined;
      const user = (req as any).user;

      let effectivePatientId = patientId;

      if (user?.role === "PATIENT") {
        const p = await prisma.patient.findUnique({ where: { userId: user.id } });
        if (p) effectivePatientId = p.id;
      }

      let effectiveDistrict = district;
      if (user?.role === "DISTRICT_ADMIN") {
        const da = await prisma.districtAdmin.findUnique({ where: { userId: user.id } });
        if (da && da.district !== "ALL") {
          effectiveDistrict = da.district;
        }
      }

      const referrals = await ReferralService.list({
        patientId: effectivePatientId,
        fromFacilityId,
        toFacilityId,
        status,
        priority,
        district: effectiveDistrict,
      });

      res.json({ success: true, data: referrals });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || "Failed to list referrals." });
    }
  }

  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const referral = await ReferralService.getById(id);
      if (!referral) {
        res.status(404).json({ success: false, message: "Referral record not found." });
        return;
      }
      res.json({ success: true, data: referral });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || "Failed to get referral." });
    }
  }

  static async create(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;

      if (!req.body.patientId || !req.body.fromFacilityId || !req.body.toFacilityId || !req.body.reason) {
        res.status(400).json({ success: false, message: "patientId, fromFacilityId, toFacilityId, and reason are required." });
        return;
      }

      const referral = await ReferralService.create({
        patientId: req.body.patientId,
        fromFacilityId: req.body.fromFacilityId,
        toFacilityId: req.body.toFacilityId,
        createdById: user.id,
        reason: req.body.reason,
        requiredSpecialty: req.body.requiredSpecialty,
        priority: req.body.priority,
        notes: req.body.notes,
      });

      res.status(201).json({ success: true, data: referral, message: "Inter-facility referral created successfully!" });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || "Failed to create referral." });
    }
  }

  static async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const { status } = req.body;
      const referral = await ReferralService.updateStatus(id, status);
      res.json({ success: true, data: referral, message: "Referral status updated successfully." });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || "Failed to update referral status." });
    }
  }

  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      await ReferralService.delete(id);
      res.json({ success: true, message: "Referral cancelled successfully." });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || "Failed to delete referral." });
    }
  }
}
