import { Request, Response, NextFunction } from 'express';
import { profileService } from '../services/profile.service';
import { Gender } from '@prisma/client';

export const profileController = {
  async patientStep1(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.identity?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
      }

      const {
        dateOfBirth,
        gender,
        village,
        district,
        pincode,
        abhaId,
        bloodGroup,
        emergencyContactName,
        emergencyContactPhone,
      } = req.body as {
        dateOfBirth?: string;
        gender?: Gender;
        village?: string;
        district?: string;
        pincode?: string;
        abhaId?: string;
        bloodGroup?: string;
        emergencyContactName?: string;
        emergencyContactPhone?: string;
      };

      const patient = await profileService.savePatientStep1({
        userId,
        dateOfBirth,
        gender,
        village,
        district,
        pincode,
        abhaId,
        bloodGroup,
        emergencyContactName,
        emergencyContactPhone,
      });

      res.json({ success: true, data: patient });
    } catch (err) {
      next(err);
    }
  },

  async patientStep2(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.identity?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
      }

      const { allergies, chronicConditions, currentMedications, notes } = req.body as {
        allergies?: string[];
        chronicConditions?: string[];
        currentMedications?: string[];
        notes?: string;
      };

      const history = await profileService.savePatientStep2({
        userId,
        allergies,
        chronicConditions,
        currentMedications,
        notes,
      });

      res.json({ success: true, data: history });
    } catch (err) {
      next(err);
    }
  },

  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.identity?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
      }

      const profile = await profileService.getProfile(userId);
      res.json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  },
};
