import { Request, Response } from 'express';
import { adminService } from '../services/admin.service';
import { UserRole } from '@prisma/client';

export const adminController = {
  async provisionUser(req: Request, res: Response): Promise<void> {
    const actor = req.identity;
    if (!actor || (actor.role !== UserRole.SUPER_ADMIN && actor.role !== UserRole.DISTRICT_ADMIN)) {
      res.status(403).json({ success: false, error: 'Permission denied. Super or District Admin required.' });
      return;
    }

    const user = await adminService.provisionUser(req.body, actor);
    res.status(201).json({
      success: true,
      data: user,
      message: `Successfully provisioned ${user.role} account for ${user.fullName}`,
    });
  },

  async listStaff(req: Request, res: Response): Promise<void> {
    const actor = req.identity;
    if (!actor || (actor.role !== UserRole.SUPER_ADMIN && actor.role !== UserRole.DISTRICT_ADMIN)) {
      res.status(403).json({ success: false, error: 'Permission denied' });
      return;
    }

    const { role, district } = req.query;
    const staff = await adminService.listStaff(actor, {
      role: role as UserRole,
      district: district as string,
    });

    res.json({ success: true, data: staff });
  },

  async getDistrictSummary(req: Request, res: Response): Promise<void> {
    const { district } = req.query;
    const summary = await adminService.getDistrictSummary(district as string);
    res.json({ success: true, data: summary });
  },
};
