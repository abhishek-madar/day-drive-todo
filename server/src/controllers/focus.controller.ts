import { Request, Response } from 'express';
import prisma from '../prisma';

export const saveFocusSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, duration, taskId } = req.body;
    const userId = (req as any).user.userId;

    const session = await prisma.focusSession.create({
      data: {
        type,
        duration,
        userId,
        taskId: taskId || null
      }
    });

    let entityName = type.replace('_', ' ');
    if (taskId) {
      const task = await prisma.task.findUnique({ where: { id: taskId } });
      if (task) entityName = `Focus on: ${task.title}`;
    }

    await prisma.activity.create({
      data: {
        action: 'completed',
        entityType: 'FocusSession',
        entityName,
        userId
      }
    });

    res.status(201).json(session);
  } catch (error) {
    console.error('Save focus session error:', error);
    res.status(500).json({ error: 'Failed to save focus session' });
  }
};

export const getFocusAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const sessions = await prisma.focusSession.findMany({
      where: { userId },
      include: { task: true },
      orderBy: { createdAt: 'desc' }
    });

    const todaySessions = sessions.filter(s => s.createdAt >= startOfToday && s.createdAt <= endOfToday);
    
    const todayFocusTimeMinutes = Math.floor(todaySessions.reduce((acc, curr) => acc + curr.duration, 0) / 60);
    const totalFocusTimeMinutes = Math.floor(sessions.reduce((acc, curr) => acc + curr.duration, 0) / 60);

    res.json({
      todaySessions: todaySessions.length,
      todayFocusTimeMinutes,
      totalSessions: sessions.length,
      totalFocusTimeMinutes,
      recentSessions: sessions.slice(0, 10)
    });
  } catch (error) {
    console.error('Focus analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch focus analytics' });
  }
};
