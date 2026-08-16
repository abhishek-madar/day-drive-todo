import { Request, Response } from 'express';
import prisma from '../prisma';

export const globalSearch = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const query = req.query.q as string;

    if (!query) {
      res.json({ tasks: [], projects: [] });
      return;
    }

    const [tasks, projects] = await Promise.all([
      prisma.task.findMany({
        where: {
          userId,
          title: { contains: query, mode: 'insensitive' }
        },
        include: { project: true },
        take: 10
      }),
      prisma.project.findMany({
        where: {
          userId,
          name: { contains: query, mode: 'insensitive' }
        },
        take: 10
      })
    ]);

    res.json({ tasks, projects });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to perform search' });
  }
};
