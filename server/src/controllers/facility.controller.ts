import { Request, Response } from 'express';
import { facilityService } from '../services/facility.service';
import { FacilityType, UserRole } from '@prisma/client';

export const facilityController = {
  async list(req: Request, res: Response): Promise<void> {
    try {
      const { district, type, search, hasAvailableBeds, service, limit, offset } = req.query;

      const result = await facilityService.listFacilities({
        district: district as string,
        type: type as FacilityType,
        search: search as string,
        hasAvailableBeds: hasAvailableBeds === 'true',
        service: service as string,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
      });

      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Failed to list facilities' });
    }
  },

  async nearby(req: Request, res: Response): Promise<void> {
    try {
      const { lat, lng, radius, district, type, service, hasBeds, hasDoctor, hasMedicine, test } = req.query;

      if (!lat || !lng) {
        res.status(400).json({ success: false, error: 'Latitude and longitude are required' });
        return;
      }

      const facilities = await facilityService.getNearbyFacilities({
        latitude: parseFloat(lat as string),
        longitude: parseFloat(lng as string),
        radiusKm: radius ? parseFloat(radius as string) : 50,
        district: district as string,
        type: type as FacilityType,
        serviceName: service as string,
        hasBeds: hasBeds === 'true',
        hasDoctor: hasDoctor === 'true',
        hasMedicine: hasMedicine as string,
        testName: test as string,
      });

      res.json({ success: true, data: facilities });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Failed to search nearby facilities' });
    }
  },

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const facility = await facilityService.getFacilityById(id);
      res.json({ success: true, data: facility });
    } catch (err: any) {
      res.status(404).json({ success: false, error: err.message || 'Facility not found' });
    }
  },

  async getAvailabilityMatrix(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const matrix = await facilityService.getFacilityAvailabilityMatrix(id);
      res.json({ success: true, data: matrix });
    } catch (err: any) {
      res.status(404).json({ success: false, error: err.message || 'Facility not found' });
    }
  },

  async getServicesCatalog(_req: Request, res: Response): Promise<void> {
    try {
      const catalog = await facilityService.getServicesCatalog();
      res.json({ success: true, data: catalog });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Failed to fetch services catalog' });
    }
  },

  async create(req: Request, res: Response): Promise<void> {
    try {
      const actorRole = req.identity?.role;
      if (actorRole !== UserRole.SUPER_ADMIN && actorRole !== UserRole.DISTRICT_ADMIN) {
        res.status(403).json({ success: false, error: 'Permission denied. Super or District Admin required.' });
        return;
      }

      const facility = await facilityService.createFacility(req.body);
      res.status(201).json({ success: true, data: facility, message: 'Facility registered successfully' });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'Failed to create facility' });
    }
  },

  async updateBeds(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const bedStatus = await facilityService.updateBedAvailability(id, req.body);
      res.json({ success: true, data: bedStatus, message: 'Bed availability updated successfully' });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'Failed to update beds' });
    }
  },

  async upsertMedicine(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const medicine = await facilityService.upsertMedicine(id, req.body);
      res.json({ success: true, data: medicine, message: 'Medicine stock updated successfully' });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'Failed to update medicine' });
    }
  },

  async toggleMedicine(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const medicineId = req.params.medicineId as string;
      const { isAvailable } = req.body;
      const medicine = await facilityService.toggleMedicineAvailability(id, medicineId, isAvailable);
      res.json({ success: true, data: medicine, message: 'Medicine availability updated' });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'Failed to toggle medicine' });
    }
  },

  async upsertDiagnostic(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const diagnostic = await facilityService.upsertDiagnostic(id, req.body);
      res.json({ success: true, data: diagnostic, message: 'Diagnostic test updated successfully' });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'Failed to update diagnostic' });
    }
  },

  async toggleDiagnostic(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const diagnosticId = req.params.diagnosticId as string;
      const { isAvailable } = req.body;
      const diagnostic = await facilityService.toggleDiagnosticAvailability(id, diagnosticId, isAvailable);
      res.json({ success: true, data: diagnostic, message: 'Diagnostic availability updated' });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'Failed to toggle diagnostic' });
    }
  },

  async updateDoctorAvailability(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const doctorId = req.params.doctorId as string;
      const { isAvailable } = req.body;
      const doctor = await facilityService.updateDoctorAvailability(id, doctorId, Boolean(isAvailable));
      res.json({ success: true, data: doctor, message: 'Doctor availability updated successfully' });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'Failed to update doctor availability' });
    }
  },

  async upsertSlot(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const slot = await facilityService.upsertSlot(id, req.body);
      res.json({ success: true, data: slot, message: 'Appointment slot updated successfully' });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'Failed to update slot' });
    }
  },

  async toggleSlot(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const slotId = req.params.slotId as string;
      const { isAvailable } = req.body;
      const slot = await facilityService.toggleSlot(id, slotId, isAvailable);
      res.json({ success: true, data: slot, message: 'Appointment slot availability updated' });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'Failed to toggle slot' });
    }
  },

  async deleteSlot(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const slotId = req.params.slotId as string;
      await facilityService.deleteSlot(id, slotId);
      res.json({ success: true, message: 'Appointment slot removed successfully' });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'Failed to delete slot' });
    }
  },

  async addService(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const { name, category } = req.body;
      if (!name) {
        res.status(400).json({ success: false, error: 'Service name is required' });
        return;
      }
      const service = await facilityService.addService(id, name, category);
      res.status(201).json({ success: true, data: service, message: 'Clinical service added' });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'Failed to add service' });
    }
  },

  async removeService(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const serviceId = req.params.serviceId as string;
      await facilityService.removeService(id, serviceId);
      res.json({ success: true, message: 'Clinical service removed' });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'Failed to remove service' });
    }
  },
};
