import { Request, Response } from 'express';
import { facilityService } from '../services/facility.service';
import { FacilityType, UserRole } from '@prisma/client';

export const facilityController = {
  async list(req: Request, res: Response): Promise<void> {
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
  },

  async nearby(req: Request, res: Response): Promise<void> {
    const { lat, lng, radius, district, type, service, hasBeds, hasMedicine, test } = req.query;

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
      hasMedicine: hasMedicine as string,
      testName: test as string,
    });

    res.json({ success: true, data: facilities });
  },

  async getById(req: Request, res: Response): Promise<void> {
    const id = req.params.id as string;
    const facility = await facilityService.getFacilityById(id);
    res.json({ success: true, data: facility });
  },

  async create(req: Request, res: Response): Promise<void> {
    const actorRole = req.identity?.role;
    if (actorRole !== UserRole.SUPER_ADMIN && actorRole !== UserRole.DISTRICT_ADMIN) {
      res.status(403).json({ success: false, error: 'Permission denied. Super or District Admin required.' });
      return;
    }

    const facility = await facilityService.createFacility(req.body);
    res.status(201).json({ success: true, data: facility });
  },

  async updateBeds(req: Request, res: Response): Promise<void> {
    const id = req.params.id as string;
    const bedStatus = await facilityService.updateBedAvailability(id, req.body);
    res.json({ success: true, data: bedStatus, message: 'Bed availability updated' });
  },

  async upsertMedicine(req: Request, res: Response): Promise<void> {
    const id = req.params.id as string;
    const medicine = await facilityService.upsertMedicine(id, req.body);
    res.json({ success: true, data: medicine, message: 'Medicine stock updated' });
  },

  async upsertDiagnostic(req: Request, res: Response): Promise<void> {
    const id = req.params.id as string;
    const diagnostic = await facilityService.upsertDiagnostic(id, req.body);
    res.json({ success: true, data: diagnostic, message: 'Diagnostic test updated' });
  },
};
