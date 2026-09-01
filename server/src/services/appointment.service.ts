import { prisma } from "../config/prisma";
import { AppointmentType, AppointmentStatus } from "@prisma/client";

export class AppointmentService {
  static async list(filters: { patientId?: string; doctorId?: string; facilityId?: string; status?: AppointmentStatus }) {
    const where: any = {};
    if (filters.patientId) where.patientId = filters.patientId;
    if (filters.doctorId) where.doctorId = filters.doctorId;
    if (filters.facilityId) where.facilityId = filters.facilityId;
    if (filters.status) where.status = filters.status;

    return prisma.appointment.findMany({
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
  }

  static async getById(id: string) {
    return prisma.appointment.findUnique({
      where: { id },
      include: {
        facility: true,
        doctor: { include: { user: true } },
        patient: { include: { user: true } },
      },
    });
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

    return prisma.appointment.create({
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
  }

  static async updateStatus(id: string, status: AppointmentStatus) {
    return prisma.appointment.update({
      where: { id },
      data: { status },
    });
  }

  static async delete(id: string) {
    return prisma.appointment.delete({
      where: { id },
    });
  }
}
