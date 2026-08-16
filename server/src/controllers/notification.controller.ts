import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import prisma from '../prisma';

export const subscribe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { subscription } = req.body;

    const existing = await prisma.pushSubscription.findUnique({
      where: { endpoint: subscription.endpoint }
    });

    if (!existing) {
      await prisma.pushSubscription.create({
        data: {
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          userId: req.user!.id
        }
      });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const unsubscribe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { endpoint } = req.body;
    await prisma.pushSubscription.deleteMany({
      where: { endpoint, userId: req.user!.id }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    await prisma.notification.updateMany({
      where: { id, userId: req.user!.id },
      data: { isRead: true }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const markAllAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, isRead: false },
      data: { isRead: true }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
