import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticate } from '../middlewares/auth.middleware';
import { requireProjectAccess } from '../middlewares/rbac.middleware';
import { sendTaskAssignedEmail } from '../config/email';
import { TaskStatus, Priority } from '@prisma/client';

const router = Router();
router.use(authenticate);

const TaskSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().optional().nullable(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(Priority).optional(),
  startDate: z.string().datetime().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  parentId: z.string().optional().nullable(),
  position: z.number().int().optional(),
});

// ─── Get my tasks ─────────────────────────────────────────────────────────────
router.get('/my-tasks', async (req, res, next) => {
  try {
    const tasks = await prisma.task.findMany({
      where: {
        assigneeId: req.user!.id,
        status: { not: 'DONE' },
        parentId: null,
      },
      include: {
        project: { select: { id: true, name: true, color: true } },
        assignee: { select: { id: true, name: true, avatar: true } },
        labels: { include: { label: true } },
        customFieldValues: { include: { field: true } },
      },
      orderBy: [
        { dueDate: 'asc' },
        { priority: 'desc' },
      ],
    });
    res.json({ success: true, data: tasks });
  } catch (err) {
    next(err);
  }
});

// ─── List tasks by project ────────────────────────────────────────────────────
router.get('/project/:projectId', requireProjectAccess(), async (req, res, next) => {
  try {
    const { status, assigneeId, priority } = req.query;

    const tasks = await prisma.task.findMany({
      where: {
        projectId: req.params.projectId,
        parentId: null, // Top-level tasks only
        ...(status ? { status: status as TaskStatus } : {}),
        ...(assigneeId ? { assigneeId: assigneeId as string } : {}),
        ...(priority ? { priority: priority as Priority } : {}),
      },
      include: {
        assignee: { select: { id: true, name: true, avatar: true } },
        creator: { select: { id: true, name: true } },
        labels: { include: { label: true } },
        subtasks: {
          include: {
            assignee: { select: { id: true, name: true, avatar: true } },
            labels: { include: { label: true } },
          },
          orderBy: { position: 'asc' },
        },
        _count: { select: { comments: true, attachments: true } },
        customFieldValues: { include: { field: true } },
      },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    });
    res.json({ success: true, data: tasks });
  } catch (err) {
    next(err);
  }
});

// ─── Get task by ID ───────────────────────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: {
        project: { select: { id: true, name: true, color: true } },
        assignee: { select: { id: true, name: true, avatar: true, email: true } },
        creator: { select: { id: true, name: true, avatar: true } },
        subtasks: {
          include: { assignee: { select: { id: true, name: true, avatar: true } } },
          orderBy: { position: 'asc' },
        },
        attachments: {
          include: { uploader: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
        comments: {
          include: { user: { select: { id: true, name: true, avatar: true } } },
          orderBy: { createdAt: 'asc' },
        },
        activities: {
          include: { user: { select: { id: true, name: true, avatar: true } } },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        labels: { include: { label: true } },
        timeLogs: {
          include: { user: { select: { id: true, name: true, avatar: true } } },
          orderBy: { loggedAt: 'desc' },
        },
        customFieldValues: { include: { field: true } },
        _count: { select: { comments: true, attachments: true } },
      },
    });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
});

// ─── Create task ──────────────────────────────────────────────────────────────
router.post('/project/:projectId', requireProjectAccess(), async (req, res, next) => {
  try {
    const body = TaskSchema.parse(req.body);
    const projectId = req.params.projectId;
    const creatorId = req.user!.id;

    // Get max position
    const maxPos = await prisma.task.aggregate({
      where: { projectId, status: body.status || 'TODO', parentId: null },
      _max: { position: true },
    });

    const task = await prisma.task.create({
      data: {
        ...body,
        projectId,
        creatorId,
        startDate: body.startDate ? new Date(body.startDate) : null,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        position: (maxPos._max.position ?? 0) + 1,
      },
      include: {
        assignee: { select: { id: true, name: true, avatar: true, email: true, assignmentsNotifications: true } },
        creator: { select: { id: true, name: true } },
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        action: 'task_created',
        taskId: task.id,
        userId: creatorId,
        details: { title: task.title },
      },
    });

    // Notify assignee if different from creator
    if (task.assigneeId && task.assigneeId !== creatorId && task.assignee) {
      const project = await prisma.project.findUnique({ where: { id: projectId }, select: { name: true } });
      await prisma.notification.create({
        data: {
          type: 'task_assigned',
          title: 'New task assigned',
          message: `You've been assigned to "${task.title}"`,
          userId: task.assigneeId,
          taskId: task.id,
          projectId,
        },
      });
      if (task.assignee.assignmentsNotifications) {
        await sendTaskAssignedEmail({
          to: task.assignee.email,
          assigneeName: task.assignee.name,
          taskTitle: task.title,
          projectName: project?.name || '',
          taskUrl: `${process.env.FRONTEND_URL}/projects/${projectId}?taskId=${task.id}`,
        });
      }
    }

    res.status(201).json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
});

// ─── Update task ──────────────────────────────────────────────────────────────
router.put('/:id', async (req, res, next) => {
  try {
    const body = TaskSchema.partial().parse(req.body);
    const userId = req.user!.id;

    const existing = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Task not found' });

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        ...body,
        startDate: body.startDate !== undefined ? (body.startDate ? new Date(body.startDate) : null) : undefined,
        dueDate: body.dueDate !== undefined ? (body.dueDate ? new Date(body.dueDate) : null) : undefined,
      },
      include: {
        assignee: { select: { id: true, name: true, avatar: true, email: true, assignmentsNotifications: true } },
        creator: { select: { id: true, name: true } },
      },
    });

    // Log status change
    if (body.status && body.status !== existing.status) {
      await prisma.activity.create({
        data: {
          action: 'status_changed',
          taskId: task.id,
          userId,
          details: { from: existing.status, to: body.status },
        },
      });
    }

    // Notify new assignee
    if (body.assigneeId && body.assigneeId !== existing.assigneeId && body.assigneeId !== userId && task.assignee) {
      const project = await prisma.project.findUnique({ where: { id: task.projectId }, select: { name: true } });
      await prisma.notification.create({
        data: {
          type: 'task_assigned',
          title: 'New task assigned',
          message: `You've been assigned to "${task.title}"`,
          userId: body.assigneeId,
          taskId: task.id,
          projectId: task.projectId,
        },
      });
      if (task.assignee.assignmentsNotifications) {
        await sendTaskAssignedEmail({
          to: task.assignee.email,
          assigneeName: task.assignee.name,
          taskTitle: task.title,
          projectName: project?.name || '',
          taskUrl: `${process.env.FRONTEND_URL}/projects/${task.projectId}?taskId=${task.id}`,
        });
      }
    }

    res.json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
});

// ─── Reorder tasks (drag & drop) ──────────────────────────────────────────────
router.put('/:id/reorder', async (req, res, next) => {
  try {
    const { newStatus, newPosition } = z.object({
      newStatus: z.nativeEnum(TaskStatus).optional(),
      newPosition: z.number().int().min(0),
    }).parse(req.body);

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        ...(newStatus ? { status: newStatus } : {}),
        position: newPosition,
      },
    });
    res.json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
});

// ─── Delete task ──────────────────────────────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.task.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
