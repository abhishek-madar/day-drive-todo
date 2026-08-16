import { Request, Response } from 'express';
import prisma from '../prisma';
import bcrypt from 'bcryptjs';

import { AuthRequest } from '../middleware/authMiddleware';

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        createdAt: true
      }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const tasks = await prisma.task.findMany({ where: { userId } });
    const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
    const activeTasks = tasks.filter(t => t.status !== 'COMPLETED').length;

    const focusSessions = await prisma.focusSession.findMany({ where: { userId } });
    const totalFocusTimeSeconds = focusSessions.reduce((acc, curr) => acc + curr.duration, 0);
    const totalFocusTimeMinutes = Math.round(totalFocusTimeSeconds / 60);

    let streak = 0;
    const completedTaskDates = tasks
      .filter(t => t.status === 'COMPLETED' && t.completedAt)
      .map(t => new Date(t.completedAt!).toDateString());
    
    const uniqueDates = [...new Set(completedTaskDates)].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    if (uniqueDates.includes(today)) {
      streak = 1;
      let checkDate = new Date(Date.now() - 86400000);
      for (let i = 1; i < uniqueDates.length; i++) {
        if (uniqueDates.includes(checkDate.toDateString())) {
          streak++;
          checkDate = new Date(checkDate.getTime() - 86400000);
        } else {
          break;
        }
      }
    } else if (uniqueDates.includes(yesterday)) {
      let checkDate = new Date(Date.now() - 86400000);
      for (let i = 0; i < uniqueDates.length; i++) {
        if (uniqueDates.includes(checkDate.toDateString())) {
          streak++;
          checkDate = new Date(checkDate.getTime() - 86400000);
        } else {
          break;
        }
      }
    }

    res.json({
      user,
      stats: {
        completedTasks,
        activeTasks,
        focusTimeMinutes: totalFocusTimeMinutes,
        streak
      }
    });

  } catch (error) {
    console.error('getProfile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { name, email } = req.body;

    if (email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing && existing.id !== userId) {
        res.status(400).json({ error: 'Email is already in use' });
        return;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { name, email },
      select: { id: true, email: true, name: true, avatarUrl: true, createdAt: true }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('updateProfile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const updatePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { currentPassword, newPassword } = req.body;
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      res.status(400).json({ error: 'Incorrect current password' });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash }
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('updatePassword error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateAvatar = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { avatarUrl } = req.body; 

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      select: { id: true, email: true, name: true, avatarUrl: true, createdAt: true }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('updateAvatar error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const deleteAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    await prisma.user.delete({
      where: { id: userId }
    });

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('deleteAccount error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
