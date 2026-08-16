import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import prisma from '../prisma';

export const getProjects = async (req: AuthRequest, res: Response) => {
  try {
    const projects = await prisma.project.findMany({
      where: { userId: req.user!.id },
      include: {
        _count: {
          select: { tasks: { where: { status: { not: 'COMPLETED' } } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
};

export const getProjectById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const project = await prisma.project.findUnique({
      where: { id, userId: req.user!.id },
      include: {
        tasks: {
          orderBy: [
            { status: 'asc' },
            { dueDate: 'asc' }
          ]
        }
      }
    });
    
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    
    res.json(project);
  } catch (error) {
    console.error('Error fetching project details:', error);
    res.status(500).json({ error: 'Failed to fetch project details' });
  }
};

export const createProject = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, color, deadline } = req.body;
    const project = await prisma.project.create({
      data: {
        name,
        description,
        color: color || '#000000',
        deadline: deadline ? new Date(deadline) : null,
        userId: req.user!.id
      }
    });

    await prisma.activity.create({
      data: {
        action: 'created',
        entityType: 'Project',
        entityName: name,
        userId: req.user!.id
      }
    });

    res.status(201).json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
};

export const updateProject = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const project = await prisma.project.update({
      where: { id, userId: req.user!.id },
      data: req.body
    });
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update project' });
  }
};

export const deleteProject = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const project = await prisma.project.findUnique({ where: { id, userId: req.user!.id } });
    if (!project) return;

    await prisma.project.delete({
      where: { id, userId: req.user!.id }
    });

    await prisma.activity.create({
      data: {
        action: 'deleted',
        entityType: 'Project',
        entityName: project.name,
        userId: req.user!.id
      }
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete project' });
  }
};
