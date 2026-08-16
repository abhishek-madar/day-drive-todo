import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import prisma from '../prisma';

export const getTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tasks = await prisma.task.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      include: { project: true }
    });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const createTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, priority, dueDate, projectId } = req.body;

    let reminderAt: Date | null = null;
    if (dueDate) {
      const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
      if (user?.enableDeadlineReminders) {
        reminderAt = new Date(new Date(dueDate).getTime() - user.reminderBeforeDeadlineMin * 60000);
      }
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        reminderAt,
        projectId,
        userId: req.user!.id
      }
    });

    await prisma.activity.create({
      data: {
        action: 'created',
        entityType: 'Task',
        entityName: title,
        userId: req.user!.id
      }
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const data = req.body;
    
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task || task.userId !== req.user!.id) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    if (data.status === 'COMPLETED' && task.status !== 'COMPLETED') {
      data.completedAt = new Date();
    } else if (data.status && data.status !== 'COMPLETED' && task.status === 'COMPLETED') {
      data.completedAt = null;
      
    }

    const updated = await prisma.task.update({
      where: { id },
      data
    });

    if (data.status === 'COMPLETED' && task.status !== 'COMPLETED') {
      await prisma.activity.create({
        data: {
          action: 'completed',
          entityType: 'Task',
          entityName: task.title,
          userId: req.user!.id
        }
      });
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const deleteTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task || task.userId !== req.user!.id) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    await prisma.task.delete({ where: { id } });
    
    await prisma.activity.create({
      data: {
        action: 'deleted',
        entityType: 'Task',
        entityName: task.title,
        userId: req.user!.id
      }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
