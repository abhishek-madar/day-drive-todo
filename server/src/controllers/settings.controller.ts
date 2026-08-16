import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import prisma from '../prisma';

export const getSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        enableBrowserNotifications: true,
        enableDeadlineReminders: true,
        enableOverdueNotifications: true,
        reminderBeforeDeadlineMin: true,
        repeatedOverdueIntervalHr: true
      }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = req.body;
    const updated = await prisma.user.update({
      where: { id: req.user!.id },
      data,
      select: {
        enableBrowserNotifications: true,
        enableDeadlineReminders: true,
        enableOverdueNotifications: true,
        reminderBeforeDeadlineMin: true,
        repeatedOverdueIntervalHr: true
      }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
