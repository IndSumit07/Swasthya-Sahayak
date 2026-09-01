import { Request, Response } from "express";
import { AppointmentService } from "../services/appointment.service";
import { prisma } from "../config/prisma";

export class AppointmentController {
  static async list(req: Request, res: Response): Promise<void> {
    try {
      const patientId = req.query.patientId as string | undefined;
      const doctorId = req.query.doctorId as string | undefined;
      const facilityId = req.query.facilityId as string | undefined;
      const status = req.query.status as any;
      const user = (req as any).user;

      let effectivePatientId = patientId;
      let effectiveDoctorId = doctorId;

      if (user?.role === "PATIENT") {
        const p = await prisma.patient.findUnique({ where: { userId: user.id } });
        if (p) effectivePatientId = p.id;
      } else if (user?.role === "DOCTOR") {
        const d = await prisma.doctor.findUnique({ where: { userId: user.id } });
        if (d && !patientId) effectiveDoctorId = d.id;
      }

      const appointments = await AppointmentService.list({
        patientId: effectivePatientId,
        doctorId: effectiveDoctorId,
        facilityId,
        status,
      });

      res.json({ success: true, data: appointments });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || "Failed to list appointments." });
    }
  }

  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const appointment = await AppointmentService.getById(id);
      if (!appointment) {
        res.status(404).json({ success: false, message: "Appointment not found." });
        return;
      }
      res.json({ success: true, data: appointment });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || "Failed to get appointment." });
    }
  }

  static async create(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      let patientId = req.body.patientId;

      if (!patientId && user?.role === "PATIENT") {
        const p = await prisma.patient.findUnique({ where: { userId: user.id } });
        if (!p) {
          res.status(400).json({ success: false, message: "Patient profile not found. Please complete profile first." });
          return;
        }
        patientId = p.id;
      }

      if (!patientId || !req.body.facilityId || !req.body.appointmentDate) {
        res.status(400).json({ success: false, message: "patientId, facilityId, and appointmentDate are required." });
        return;
      }

      const appointment = await AppointmentService.create({
        patientId,
        facilityId: req.body.facilityId,
        doctorId: req.body.doctorId,
        type: req.body.type,
        appointmentDate: req.body.appointmentDate,
        slot: req.body.slot,
        notes: req.body.notes,
      });

      res.status(201).json({ success: true, data: appointment, message: "Appointment booked successfully!" });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || "Failed to create appointment." });
    }
  }

  static async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const { status } = req.body;
      const appointment = await AppointmentService.updateStatus(id, status);
      res.json({ success: true, data: appointment, message: "Status updated successfully." });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || "Failed to update appointment status." });
    }
  }

  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      await AppointmentService.delete(id);
      res.json({ success: true, message: "Appointment cancelled successfully." });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || "Failed to cancel appointment." });
    }
  }
}
