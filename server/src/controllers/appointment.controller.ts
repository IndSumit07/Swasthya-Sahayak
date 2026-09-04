import { Request, Response } from "express";
import { AppointmentService } from "../services/appointment.service";
import { prisma } from "../config/prisma";
import { UserRole } from "@prisma/client";

export class AppointmentController {
  static async list(req: Request, res: Response): Promise<void> {
    try {
      const patientId = req.query.patientId as string | undefined;
      const doctorId = req.query.doctorId as string | undefined;
      const facilityId = req.query.facilityId as string | undefined;
      const status = req.query.status as any;
      const date = req.query.date as string | undefined;
      const user = req.identity || (req as any).user;

      let effectivePatientId = patientId;
      let effectiveDoctorId = doctorId;

      if (user?.role === "PATIENT") {
        let p = await prisma.patient.findUnique({ where: { userId: user.userId || user.id } });
        if (!p) {
          p = await prisma.patient.create({
            data: {
              userId: user.userId || user.id,
              district: "Pune",
              state: "Maharashtra",
              village: "Pune",
              bloodGroup: "B+",
            },
          });
        }
        // STRICT USER ISOLATION: A patient can ONLY view their own appointments
        effectivePatientId = p.id;
      } else if (user?.role === "DOCTOR") {
        const d = await prisma.doctor.findUnique({ where: { userId: user.userId || user.id } });
        if (d && !patientId) effectiveDoctorId = d.id;
      }

      const appointments = await AppointmentService.list({
        patientId: effectivePatientId,
        doctorId: effectiveDoctorId,
        facilityId,
        status,
        date,
      });

      res.json({ success: true, data: appointments });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || "Failed to list appointments." });
    }
  }

  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const user = req.identity || (req as any).user;
      const appointment = await AppointmentService.getById(id);
      if (!appointment) {
        res.status(404).json({ success: false, message: "Appointment not found." });
        return;
      }

      if (user?.role === "PATIENT") {
        const p = await prisma.patient.findUnique({ where: { userId: user.userId || user.id } });
        if (!p || appointment.patientId !== p.id) {
          res.status(403).json({ success: false, message: "Access denied to this appointment." });
          return;
        }
      }

      res.json({ success: true, data: appointment });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || "Failed to get appointment." });
    }
  }

  /**
   * Book appointment with token generation (FR-14 & FR-15)
   */
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const user = req.identity || (req as any).user;
      let patientId = req.body.patientId;

      if (user?.role === "PATIENT") {
        let p = await prisma.patient.findUnique({ where: { userId: user.userId || user.id } });
        if (!p) {
          p = await prisma.patient.create({
            data: {
              userId: user.userId || user.id,
              district: "Pune",
              state: "Maharashtra",
              village: "Pune",
              bloodGroup: "B+",
            },
          });
        }
        // STRICT USER ISOLATION: A patient always books for themselves
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

      res.status(201).json({
        success: true,
        data: appointment,
        message: `Appointment Confirmed! Your Token is ${appointment.token}`,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || "Failed to create appointment." });
    }
  }

  /**
   * Patient Live Queue Status (FR-16)
   */
  static async getPatientQueue(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const queueStatus = await AppointmentService.getPatientQueueStatus(id);
      res.json({ success: true, data: queueStatus });
    } catch (err: any) {
      res.status(404).json({ success: false, message: err.message || "Failed to get queue status." });
    }
  }

  /**
   * Facility / Doctor OPD Queue Status (FR-16)
   */
  static async getFacilityQueue(req: Request, res: Response): Promise<void> {
    try {
      const facilityId = req.query.facilityId as string;
      const doctorId = req.query.doctorId as string | undefined;
      const date = req.query.date as string | undefined;

      if (!facilityId) {
        res.status(400).json({ success: false, message: "facilityId is required." });
        return;
      }

      const queue = await AppointmentService.getFacilityQueue(facilityId, doctorId, date);
      res.json({ success: true, data: queue });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || "Failed to get facility queue." });
    }
  }

  /**
   * Advance Queue — "Call Next Patient" (FR-16)
   */
  static async callNextPatient(req: Request, res: Response): Promise<void> {
    try {
      const { facilityId, doctorId } = req.body;
      const user = (req as any).user;

      if (!facilityId) {
        res.status(400).json({ success: false, message: "facilityId is required." });
        return;
      }

      let effectiveDoctorId = doctorId;
      if (user?.role === UserRole.DOCTOR && !doctorId) {
        const d = await prisma.doctor.findUnique({ where: { userId: user.id } });
        if (d) effectiveDoctorId = d.id;
      }

      const result = await AppointmentService.callNextPatient(facilityId, effectiveDoctorId);
      res.json({ success: true, data: result, message: result.message });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || "Failed to advance queue." });
    }
  }

  /**
   * Reschedule appointment (FR-17)
   */
  static async reschedule(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const { newDate, newSlot, newDoctorId } = req.body;
      const user = req.identity || (req as any).user;

      if (!newDate || !newSlot) {
        res.status(400).json({ success: false, message: "newDate and newSlot are required." });
        return;
      }

      if (user?.role === "PATIENT") {
        const p = await prisma.patient.findUnique({ where: { userId: user.userId || user.id } });
        const existing = await AppointmentService.getById(id);
        if (!existing || !p || existing.patientId !== p.id) {
          res.status(403).json({ success: false, message: "Access denied to this appointment." });
          return;
        }
      }

      const updated = await AppointmentService.reschedule(id, {
        newDate,
        newSlot,
        newDoctorId,
      });

      res.json({
        success: true,
        data: updated,
        message: `Appointment rescheduled successfully! Your new token is ${updated.token}.`,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message || "Failed to reschedule appointment." });
    }
  }

  /**
   * Cancel appointment (FR-17)
   */
  static async cancel(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const { reason } = req.body;
      const user = req.identity || (req as any).user;

      if (user?.role === "PATIENT") {
        const p = await prisma.patient.findUnique({ where: { userId: user.userId || user.id } });
        const existing = await AppointmentService.getById(id);
        if (!existing || !p || existing.patientId !== p.id) {
          res.status(403).json({ success: false, message: "Access denied to this appointment." });
          return;
        }
      }

      const cancelled = await AppointmentService.cancel(id, reason);
      res.json({ success: true, data: cancelled, message: "Appointment cancelled successfully." });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message || "Failed to cancel appointment." });
    }
  }

  /**
   * Rebook appointment (FR-17)
   */
  static async rebook(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const { newDate, newSlot, newDoctorId } = req.body;
      const user = req.identity || (req as any).user;

      if (!newDate || !newSlot) {
        res.status(400).json({ success: false, message: "newDate and newSlot are required." });
        return;
      }

      if (user?.role === "PATIENT") {
        const p = await prisma.patient.findUnique({ where: { userId: user.userId || user.id } });
        const existing = await AppointmentService.getById(id);
        if (!existing || !p || existing.patientId !== p.id) {
          res.status(403).json({ success: false, message: "Access denied to this appointment." });
          return;
        }
      }

      const newAppt = await AppointmentService.rebook(id, {
        newDate,
        newSlot,
        newDoctorId,
      });

      res.status(201).json({
        success: true,
        data: newAppt,
        message: `Appointment rebooked successfully! Token: ${newAppt.token}`,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message || "Failed to rebook appointment." });
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
      res.json({ success: true, message: "Appointment deleted." });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || "Failed to delete appointment." });
    }
  }
}
