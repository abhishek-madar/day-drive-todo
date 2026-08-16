import { Request, Response } from 'express';
import prisma from '../prisma';

export const getActivities = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;

    const activities = await prisma.activity.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50 
    });

    res.json(activities);
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
};
