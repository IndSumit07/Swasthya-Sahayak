import { Request, Response } from "express";
import { doctorService } from "../services/doctor.service";

export const doctorController = {
  async search(req: Request, res: Response): Promise<void> {
    try {
      const { specialty, facilityId, district, isAvailable, search, limit, offset } = req.query;

      const result = await doctorService.searchDoctors({
        specialty: specialty as string,
        facilityId: facilityId as string,
        district: district as string,
        isAvailable: isAvailable !== undefined ? isAvailable === "true" : undefined,
        search: search as string,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
      });

      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to search doctors" });
    }
  },

  async getSpecialties(_req: Request, res: Response): Promise<void> {
    try {
      const specialties = await doctorService.getSpecialties();
      res.json({ success: true, data: specialties });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to fetch specialties" });
    }
  },
};
