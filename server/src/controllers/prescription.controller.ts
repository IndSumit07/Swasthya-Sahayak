import { Request, Response } from "express";
import { PrescriptionService } from "../services/prescription.service";
import { prisma } from "../config/prisma";

export class PrescriptionController {
  static async list(req: Request, res: Response): Promise<void> {
    try {
      const patientId = req.query.patientId as string | undefined;
      const doctorId = req.query.doctorId as string | undefined;
      const facilityId = req.query.facilityId as string | undefined;
      const user = req.identity || (req as any).user;

      let effectivePatientId = patientId;
      let effectiveDoctorId = doctorId;

      if (user?.role === "PATIENT") {
        const p = await prisma.patient.findUnique({ where: { userId: user.userId || user.id } });
        effectivePatientId = p ? p.id : "NO_PATIENT";
      } else if (user?.role === "DOCTOR") {
        const d = await prisma.doctor.findUnique({ where: { userId: user.userId || user.id } });
        if (d && !patientId) effectiveDoctorId = d.id;
      }

      if (effectivePatientId === "NO_PATIENT") {
        res.json({ success: true, data: [] });
        return;
      }

      const prescriptions = await PrescriptionService.list({
        patientId: effectivePatientId,
        doctorId: effectiveDoctorId,
        facilityId,
      });

      res.json({ success: true, data: prescriptions });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || "Failed to list prescriptions." });
    }
  }

  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const prescription = await PrescriptionService.getById(id);
      if (!prescription) {
        res.status(404).json({ success: false, message: "Prescription not found." });
        return;
      }
      res.json({ success: true, data: prescription });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || "Failed to get prescription." });
    }
  }

  static async create(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      let doctorId = req.body.doctorId;

      if (!doctorId && user?.role === "DOCTOR") {
        const d = await prisma.doctor.findUnique({ where: { userId: user.id } });
        if (d) doctorId = d.id;
      }

      if (!req.body.patientId || !doctorId || !req.body.facilityId || !req.body.diagnosis || !req.body.items) {
        res.status(400).json({ success: false, message: "patientId, doctorId, facilityId, diagnosis, and items array are required." });
        return;
      }

      const prescription = await PrescriptionService.create({
        patientId: req.body.patientId,
        doctorId,
        facilityId: req.body.facilityId,
        diagnosis: req.body.diagnosis,
        advice: req.body.advice,
        followUpDate: req.body.followUpDate,
        items: req.body.items,
      });

      res.status(201).json({ success: true, data: prescription, message: "Prescription issued successfully!" });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || "Failed to create prescription." });
    }
  }

  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      await PrescriptionService.delete(id);
      res.json({ success: true, message: "Prescription removed successfully." });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || "Failed to delete prescription." });
    }
  }
}
