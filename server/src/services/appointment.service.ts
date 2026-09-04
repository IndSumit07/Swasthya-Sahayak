import { prisma } from "../config/prisma";
import { redisCache } from "../config/redis";
import { AppointmentType, AppointmentStatus } from "@prisma/client";

/**
 * Generate human-friendly clinical token format matching FR-15 / FR-16 specification:
 * e.g. "A-42" (Morning OPD), "B-15" (Afternoon OPD), "C-08" (Evening OPD).
 */
export function generateToken(slotName: string = "", sequenceNum: number): string {
  const s = slotName.toLowerCase();
  let prefix = "A"; // Morning slot default
  if (
    s.includes("afternoon") ||
    s.includes("12:") ||
    s.includes("13:") ||
    s.includes("14:") ||
    s.includes("15:") ||
    s.includes("16:")
  ) {
    prefix = "B";
  } else if (
    s.includes("evening") ||
    s.includes("night") ||
    s.includes("17:") ||
    s.includes("18:") ||
    s.includes("19:") ||
    s.includes("20:")
  ) {
    prefix = "C";
  }
  return `${prefix}-${sequenceNum}`;
}

/**
 * Invalidate Redis caches for appointments and live queues on any update/creation
 */
export async function invalidateAppointmentCaches(id?: string, facilityId?: string): Promise<void> {
  try {
    const keysToDelete: string[] = [];
    if (id) {
      keysToDelete.push(`appointments:id:${id}`);
      keysToDelete.push(`appointments:queue:patient:${id}`);
    }
    if (facilityId) {
      keysToDelete.push(`appointments:queue:facility:${facilityId}`);
    }
    if (keysToDelete.length > 0) {
      await Promise.all(keysToDelete.map((k) => redisCache.del(k)));
    }
    await Promise.all([
      redisCache.delPattern("appointments:list:*"),
      redisCache.delPattern("appointments:queue:*"),
    ]);
  } catch {
    // Non-blocking
  }
}

export class AppointmentService {
  /**
   * Search & list appointments with role scoping and filters
   */
  static async list(filters: {
    patientId?: string;
    doctorId?: string;
    facilityId?: string;
    status?: AppointmentStatus;
    date?: string;
  }) {
    const cacheKey = `appointments:list:${filters.patientId || "ALL"}:${filters.doctorId || "ALL"}:${filters.facilityId || "ALL"}:${filters.status || "ALL"}:${filters.date || "ALL"}`;
    const cached = await redisCache.get<any[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const where: any = {};
    if (filters.patientId) where.patientId = filters.patientId;
    if (filters.doctorId) where.doctorId = filters.doctorId;
    if (filters.facilityId) where.facilityId = filters.facilityId;
    if (filters.status) where.status = filters.status;
    if (filters.date) {
      where.appointmentDate = new Date(filters.date);
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        facility: {
          select: {
            id: true,
            name: true,
            type: true,
            district: true,
            village: true,
            contactPhone: true,
          },
        },
        doctor: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        patient: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: [{ appointmentDate: "desc" }, { createdAt: "asc" }],
    });

    // Cache appointment list for 60 seconds
    await redisCache.set(cacheKey, appointments, 60);

    return appointments;
  }

  static async getById(id: string) {
    const cacheKey = `appointments:id:${id}`;
    const cached = await redisCache.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        facility: true,
        doctor: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        patient: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (appointment) {
      await redisCache.set(cacheKey, appointment, 120); // 120 seconds TTL
    }

    return appointment;
  }

  /**
   * Book appointment with slot selection, automatic token generation (A-XX),
   * and Redis distributed concurrency locking (FR-14 & FR-15).
   */
  static async create(data: {
    patientId: string;
    facilityId: string;
    doctorId?: string;
    type?: AppointmentType;
    appointmentDate: string | Date;
    slot?: string;
    notes?: string;
  }) {
    const appDate = new Date(data.appointmentDate);
    const dateStr = appDate.toISOString().split("T")[0];
    const slotName = data.slot || "Morning Slot (10:00 AM - 11:00 AM)";

    // Acquire distributed lock to prevent token collisions during concurrent bookings
    const lockKey = `booking:${data.facilityId}:${data.doctorId || "GEN"}:${dateStr}`;
    const lockAcquired = await redisCache.acquireLock(lockKey, 4000);

    try {
      // Calculate daily token sequence for this facility and doctor on this date
      const count = await prisma.appointment.count({
        where: {
          facilityId: data.facilityId,
          appointmentDate: appDate,
          ...(data.doctorId ? { doctorId: data.doctorId } : {}),
        },
      });

      const sequence = count + 1;
      const token = generateToken(slotName, sequence);

      const appointment = await prisma.appointment.create({
        data: {
          patientId: data.patientId,
          facilityId: data.facilityId,
          doctorId: data.doctorId || null,
          type: data.type || "IN_PERSON",
          appointmentDate: appDate,
          slot: slotName,
          status: "BOOKED",
          token,
          notes: data.notes || null,
        },
        include: {
          facility: true,
          doctor: {
            include: {
              user: { select: { fullName: true, email: true, phone: true } },
            },
          },
          patient: {
            include: {
              user: { select: { fullName: true, email: true, phone: true } },
            },
          },
        },
      });

      await invalidateAppointmentCaches(appointment.id, data.facilityId);
      return appointment;
    } finally {
      if (lockAcquired) {
        await redisCache.releaseLock(lockKey);
      }
    }
  }

  /**
   * Digital Queue Status for a specific patient appointment (FR-16).
   * Calculates:
   * - Current Token being called
   * - Your Token
   * - Patients Ahead in Queue
   * - Estimated Wait Time (5 mins per patient ahead)
   */
  static async getPatientQueueStatus(appointmentId: string) {
    const cacheKey = `appointments:queue:patient:${appointmentId}`;
    const cached = await redisCache.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        facility: { select: { name: true, district: true } },
        doctor: { include: { user: { select: { fullName: true } } } },
        patient: { include: { user: { select: { fullName: true } } } },
      },
    });

    if (!appointment) throw new Error("Appointment not found");

    // If already finished or cancelled
    if (appointment.status === "COMPLETED") {
      return {
        appointmentId,
        yourToken: appointment.token || "N/A",
        currentToken: appointment.token || "N/A",
        patientsAhead: 0,
        estimatedWaitMinutes: 0,
        status: "COMPLETED",
        doctorName: appointment.doctor?.user?.fullName || "Medical Officer",
        facilityName: appointment.facility.name,
      };
    }

    if (appointment.status === "CANCELLED") {
      return {
        appointmentId,
        yourToken: appointment.token || "N/A",
        currentToken: "N/A",
        patientsAhead: 0,
        estimatedWaitMinutes: 0,
        status: "CANCELLED",
        doctorName: appointment.doctor?.user?.fullName || "Medical Officer",
        facilityName: appointment.facility.name,
      };
    }

    // Query all today's active appointments for this doctor / facility
    const allToday = await prisma.appointment.findMany({
      where: {
        facilityId: appointment.facilityId,
        appointmentDate: appointment.appointmentDate,
        ...(appointment.doctorId ? { doctorId: appointment.doctorId } : {}),
        status: { in: ["BOOKED", "CONFIRMED", "IN_PROGRESS", "COMPLETED"] },
      },
      orderBy: [{ createdAt: "asc" }],
      select: {
        id: true,
        token: true,
        status: true,
        createdAt: true,
      },
    });

    // Find currently active consultation
    const inProgress = allToday.find((a) => a.status === "IN_PROGRESS");
    const completedList = allToday.filter((a) => a.status === "COMPLETED");
    const currentToken =
      inProgress?.token ||
      (completedList.length > 0 ? completedList[completedList.length - 1].token : allToday[0]?.token) ||
      "Queue Starting";

    // If user's own token is currently in consultation
    if (appointment.status === "IN_PROGRESS") {
      return {
        appointmentId,
        yourToken: appointment.token || "N/A",
        currentToken: appointment.token || "N/A",
        patientsAhead: 0,
        estimatedWaitMinutes: 0,
        status: "IN_PROGRESS",
        doctorName: appointment.doctor?.user?.fullName || "Medical Officer",
        facilityName: appointment.facility.name,
      };
    }

    // Count how many waiting patients were booked before this patient
    const apptCreatedAt = new Date(appointment.createdAt).getTime();
    const waitingAhead = allToday.filter((a) => {
      const isEarlier = new Date(a.createdAt).getTime() < apptCreatedAt;
      const isWaitingOrCurrent = a.status === "BOOKED" || a.status === "CONFIRMED" || a.status === "IN_PROGRESS";
      return isEarlier && isWaitingOrCurrent;
    });

    const patientsAhead = waitingAhead.length;
    // Standard public OPD tempo: ~5 minutes per consultation
    const estimatedWaitMinutes = patientsAhead > 0 ? patientsAhead * 5 : 5;

    const result = {
      appointmentId,
      yourToken: appointment.token || "N/A",
      currentToken,
      patientsAhead,
      estimatedWaitMinutes,
      status: appointment.status,
      doctorName: appointment.doctor?.user?.fullName || "Medical Officer",
      facilityName: appointment.facility.name,
      slot: appointment.slot,
      appointmentDate: appointment.appointmentDate,
    };

    // Cache patient queue tracker for 15 seconds to give live real-time feel
    await redisCache.set(cacheKey, result, 15);

    return result;
  }

  /**
   * Facility & Doctor OPD Digital Queue Switchboard (FR-16).
   * Displays the full queue status for today.
   */
  static async getFacilityQueue(facilityId: string, doctorId?: string, date?: string) {
    const targetDate = date ? new Date(date) : new Date();
    // Normalize to date boundary
    const dateStr = targetDate.toISOString().split("T")[0];

    const cacheKey = `appointments:queue:facility:${facilityId}:${doctorId || "ALL"}:${dateStr}`;
    const cached = await redisCache.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        facilityId,
        appointmentDate: new Date(dateStr),
        ...(doctorId ? { doctorId } : {}),
      },
      include: {
        patient: {
          include: {
            user: { select: { fullName: true, phone: true } },
          },
        },
        doctor: {
          include: {
            user: { select: { fullName: true } },
          },
        },
      },
      orderBy: [{ createdAt: "asc" }],
    });

    const total = appointments.length;
    const completed = appointments.filter((a) => a.status === "COMPLETED").length;
    const inProgress = appointments.find((a) => a.status === "IN_PROGRESS");
    const waiting = appointments.filter((a) => a.status === "BOOKED" || a.status === "CONFIRMED").length;
    const currentToken = inProgress?.token || (completed > 0 ? `Completed (${completed})` : "Ready to Start");

    const result = {
      facilityId,
      doctorId,
      date: dateStr,
      currentToken,
      inProgressAppointment: inProgress || null,
      metrics: {
        total,
        waiting,
        completed,
        cancelled: appointments.filter((a) => a.status === "CANCELLED").length,
      },
      queueList: appointments.map((a) => ({
        id: a.id,
        token: a.token,
        slot: a.slot,
        status: a.status,
        patientName: a.patient?.user?.fullName || "Patient",
        patientPhone: a.patient?.user?.phone || "N/A",
        doctorName: a.doctor?.user?.fullName || "Medical Officer",
        type: a.type,
      })),
    };

    // Cache facility queue for 15 seconds
    await redisCache.set(cacheKey, result, 15);

    return result;
  }

  /**
   * Advance Queue — "Call Next Patient" (FR-16).
   * Marks currently in-progress appointment as COMPLETED, and the next waiting appointment as IN_PROGRESS.
   */
  static async callNextPatient(facilityId: string, doctorId?: string) {
    const todayStr = new Date().toISOString().split("T")[0];
    const today = new Date(todayStr);

    // 1. If someone is currently IN_PROGRESS, mark them COMPLETED
    await prisma.appointment.updateMany({
      where: {
        facilityId,
        appointmentDate: today,
        ...(doctorId ? { doctorId } : {}),
        status: "IN_PROGRESS",
      },
      data: { status: "COMPLETED" },
    });

    // 2. Find next waiting appointment (BOOKED or CONFIRMED)
    const nextPatient = await prisma.appointment.findFirst({
      where: {
        facilityId,
        appointmentDate: today,
        ...(doctorId ? { doctorId } : {}),
        status: { in: ["BOOKED", "CONFIRMED"] },
      },
      orderBy: [{ createdAt: "asc" }],
      include: {
        patient: {
          include: {
            user: { select: { fullName: true } },
          },
        },
      },
    });

    if (!nextPatient) {
      await invalidateAppointmentCaches(undefined, facilityId);
      return {
        hasMore: false,
        message: "No more waiting patients in queue for today. Queue completed!",
      };
    }

    // 3. Mark next patient as IN_PROGRESS
    const updated = await prisma.appointment.update({
      where: { id: nextPatient.id },
      data: { status: "IN_PROGRESS" },
      include: {
        patient: {
          include: {
            user: { select: { fullName: true } },
          },
        },
      },
    });

    await invalidateAppointmentCaches(updated.id, facilityId);

    return {
      hasMore: true,
      currentToken: updated.token,
      activeAppointment: updated,
      message: `Now calling Token ${updated.token} (${updated.patient?.user?.fullName})`,
    };
  }

  /**
   * Reschedule appointment to a new date/slot with automatic token recalculation (FR-17).
   */
  static async reschedule(
    id: string,
    data: {
      newDate: string | Date;
      newSlot: string;
      newDoctorId?: string;
    }
  ) {
    const appointment = await prisma.appointment.findUnique({ where: { id } });
    if (!appointment) throw new Error("Appointment not found");

    if (appointment.status === "COMPLETED") {
      throw new Error("Cannot reschedule an already completed appointment. Please use Rebook instead.");
    }

    const appDate = new Date(data.newDate);
    const targetDoctorId = data.newDoctorId || appointment.doctorId;

    // Recalculate token on the new date
    const count = await prisma.appointment.count({
      where: {
        facilityId: appointment.facilityId,
        appointmentDate: appDate,
        ...(targetDoctorId ? { doctorId: targetDoctorId } : {}),
      },
    });

    const sequence = count + 1;
    const newToken = generateToken(data.newSlot, sequence);

    const oldDateStr = new Date(appointment.appointmentDate).toISOString().split("T")[0];
    const notesLog = `[Rescheduled from ${oldDateStr} (${appointment.slot}) to ${appDate.toISOString().split("T")[0]} (${data.newSlot})]`;

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        appointmentDate: appDate,
        slot: data.newSlot,
        doctorId: targetDoctorId,
        token: newToken,
        status: "BOOKED",
        notes: appointment.notes ? `${appointment.notes} | ${notesLog}` : notesLog,
      },
      include: {
        facility: true,
        doctor: {
          include: {
            user: { select: { fullName: true } },
          },
        },
        patient: {
          include: {
            user: { select: { fullName: true } },
          },
        },
      },
    });

    await invalidateAppointmentCaches(id, appointment.facilityId);
    return updated;
  }

  /**
   * Cancel appointment with reason (FR-17).
   */
  static async cancel(id: string, reason?: string) {
    const appointment = await prisma.appointment.findUnique({ where: { id } });
    if (!appointment) throw new Error("Appointment not found");

    const cancelNote = `[Cancelled: ${reason || "Patient requested cancellation"}]`;

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        status: "CANCELLED",
        notes: appointment.notes ? `${appointment.notes} | ${cancelNote}` : cancelNote,
      },
    });

    await invalidateAppointmentCaches(id, appointment.facilityId);
    return updated;
  }

  /**
   * Rebook a missed or cancelled appointment for a new upcoming slot (FR-17).
   */
  static async rebook(
    id: string,
    data: {
      newDate: string | Date;
      newSlot: string;
      newDoctorId?: string;
    }
  ) {
    const prev = await prisma.appointment.findUnique({ where: { id } });
    if (!prev) throw new Error("Reference appointment not found");

    return this.create({
      patientId: prev.patientId,
      facilityId: prev.facilityId,
      doctorId: data.newDoctorId || prev.doctorId || undefined,
      type: prev.type,
      appointmentDate: data.newDate,
      slot: data.newSlot,
      notes: `Rebooked from previous consultation ${prev.token || id}`,
    });
  }

  static async updateStatus(id: string, status: AppointmentStatus) {
    const appointment = await prisma.appointment.findUnique({ where: { id } });
    const updated = await prisma.appointment.update({
      where: { id },
      data: { status },
    });

    await invalidateAppointmentCaches(id, appointment?.facilityId);
    return updated;
  }

  static async delete(id: string) {
    const appointment = await prisma.appointment.findUnique({ where: { id } });
    const deleted = await prisma.appointment.delete({
      where: { id },
    });

    await invalidateAppointmentCaches(id, appointment?.facilityId);
    return deleted;
  }
}
