import { prisma } from "../config/prisma";
import { redisCache } from "../config/redis";
import { AppointmentType, AppointmentStatus } from "@prisma/client";

/**
 * Invalidate Redis caches for appointments on updates/creations
 */
export async function invalidateAppointmentCaches(id?: string): Promise<void> {
  try {
    if (id) {
      await redisCache.del(`appointments:id:${id}`);
    }
    await redisCache.delPattern("appointments:list:*");
  } catch {
    // Non-blocking
  }
}

export class AppointmentService {
  static async list(filters: { patientId?: string; doctorId?: string; facilityId?: string; status?: AppointmentStatus }) {
    const cacheKey = `appointments:list:${filters.patientId || "ALL"}:${filters.doctorId || "ALL"}:${filters.facilityId || "ALL"}:${filters.status || "ALL"}`;
    const cached = await redisCache.get<any[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const where: any = {};
    if (filters.patientId) where.patientId = filters.patientId;
    if (filters.doctorId) where.doctorId = filters.doctorId;
    if (filters.facilityId) where.facilityId = filters.facilityId;
    if (filters.status) where.status = filters.status;

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
      orderBy: { appointmentDate: "desc" },
    });

    // Cache appointment list for 60 seconds (1 minute TTL)
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
        doctor: { include: { user: true } },
        patient: { include: { user: true } },
      },
    });

    if (appointment) {
      // Cache appointment detail for 2 minutes (120 seconds TTL)
      await redisCache.set(cacheKey, appointment, 120);
    }

    return appointment;
  }

  static async create(data: {
    patientId: string;
    facilityId: string;
    doctorId?: string;
    type?: AppointmentType;
    appointmentDate: string | Date;
    slot?: string;
    notes?: string;
  }) {
    const count = await prisma.appointment.count({
      where: {
        facilityId: data.facilityId,
        appointmentDate: new Date(data.appointmentDate),
      },
    });
    const token = `Token #${count + 1}`;

    const appointment = await prisma.appointment.create({
      data: {
        patientId: data.patientId,
        facilityId: data.facilityId,
        doctorId: data.doctorId || null,
        type: data.type || "IN_PERSON",
        appointmentDate: new Date(data.appointmentDate),
        slot: data.slot || "10:00 AM - 11:00 AM",
        status: "BOOKED",
        token,
        notes: data.notes || null,
      },
      include: {
        facility: true,
        doctor: { include: { user: true } },
        patient: { include: { user: true } },
      },
    });

    await invalidateAppointmentCaches();
    return appointment;
  }

  static async updateStatus(id: string, status: AppointmentStatus) {
    const updated = await prisma.appointment.update({
      where: { id },
      data: { status },
    });

    await invalidateAppointmentCaches(id);
    return updated;
  }

  static async delete(id: string) {
    const deleted = await prisma.appointment.delete({
      where: { id },
    });

    await invalidateAppointmentCaches(id);
    return deleted;
  }
}
