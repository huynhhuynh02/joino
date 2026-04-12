import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();
router.use(authenticate);

// ─── Global full-text search ──────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const { q, limit = '20' } = z.object({
      q: z.string().min(1).max(200),
      limit: z.string().optional(),
    }).parse(req.query);

    const userId = req.user!.id;
    const lim = Math.min(parseInt(limit as string, 10), 50);
    const query = q.toLowerCase().trim();

    // Search tasks (only in projects user is a member of)
    const [tasks, projects] = await Promise.all([
      prisma.task.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
          project: {
            members: { some: { userId } },
          },
        },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
          project: { select: { id: true, name: true, color: true } },
          assignee: { select: { id: true, name: true, avatar: true } },
        },
        take: lim,
        orderBy: { updatedAt: 'desc' },
      }),

      prisma.project.findMany({
        where: {
          name: { contains: query, mode: 'insensitive' },
          members: { some: { userId } },
        },
        select: {
          id: true,
          name: true,
          color: true,
          status: true,
          _count: { select: { tasks: true } },
        },
        take: 6,
      }),
    ]);

    res.json({
      success: true,
      data: {
        tasks,
        projects,
        query,
        total: tasks.length + projects.length,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── Time log endpoints ────────────────────────────────────────────────────────
router.get('/timelogs/my', async (req, res, next) => {
  try {
    const logs = await prisma.timeLog.findMany({
      where: { userId: req.user!.id },
      include: {
        task: { select: { id: true, title: true, project: { select: { id: true, name: true } } } },
      },
      orderBy: { loggedAt: 'desc' },
      take: 50,
    });
    res.json({ success: true, data: logs });
  } catch (err) { next(err); }
});

router.post('/timelogs/task/:taskId', async (req, res, next) => {
  try {
    const body = z.object({
      hours: z.number().min(0.25).max(24),
      note: z.string().max(500).optional(),
      loggedAt: z.string().datetime().optional(),
    }).parse(req.body);

    const log = await prisma.timeLog.create({
      data: {
        taskId: req.params.taskId,
        userId: req.user!.id,
        hours: body.hours,
        note: body.note,
        loggedAt: body.loggedAt ? new Date(body.loggedAt) : new Date(),
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        action: 'time_logged',
        taskId: req.params.taskId,
        userId: req.user!.id,
        details: { hours: body.hours, note: body.note },
      },
    });

    res.status(201).json({ success: true, data: log });
  } catch (err) { next(err); }
});

router.delete('/timelogs/:id', async (req, res, next) => {
  try {
    const log = await prisma.timeLog.findUnique({ where: { id: req.params.id } });
    if (!log) return res.status(404).json({ success: false, message: 'Not found' });
    if (log.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await prisma.timeLog.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
