import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticate, requireOrganization } from '../middlewares/auth.middleware';
import { requireProjectAccess } from '../middlewares/rbac.middleware';
import { MemberRole } from '@prisma/client';

const router = Router();
router.use(authenticate);
router.use(requireOrganization);

const ProjectSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
});

// ─── List projects for current user ──────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const projects = await prisma.project.findMany({
      where: {
        organizationId: req.organizationId,
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
        },
        _count: { select: { tasks: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: projects });
  } catch (err) {
    next(err);
  }
});

// ─── Create project ───────────────────────────────────────────────────────────
router.post('/', async (req, res, next) => {
  try {
    const body = ProjectSchema.parse(req.body);
    const userId = req.user!.id;

    const project = await prisma.project.create({
      data: {
        ...body,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        ownerId: userId,
        organizationId: req.organizationId!,
        members: {
          create: [{ userId, role: MemberRole.OWNER }],
        },
      },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, avatar: true } } },
        },
        _count: { select: { tasks: true } },
      },
    });
    res.status(201).json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
});

// ─── Get project by ID ────────────────────────────────────────────────────────
router.get('/:id', requireProjectAccess(), async (req, res, next) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, avatar: true, email: true } } },
        },
        _count: { select: { tasks: true } },
      },
    });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    res.json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
});

// ─── Update project ───────────────────────────────────────────────────────────
router.put('/:id', requireProjectAccess([MemberRole.OWNER, MemberRole.MANAGER]), async (req, res, next) => {
  try {
    const body = ProjectSchema.partial().parse(req.body);
    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        ...body,
        startDate: body.startDate !== undefined ? (body.startDate ? new Date(body.startDate) : null) : undefined,
        endDate: body.endDate !== undefined ? (body.endDate ? new Date(body.endDate) : null) : undefined,
      },
    });
    res.json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
});

// ─── Delete project ───────────────────────────────────────────────────────────
router.delete('/:id', requireProjectAccess([MemberRole.OWNER]), async (req, res, next) => {
  try {
    await prisma.project.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// ─── Get members ──────────────────────────────────────────────────────────────
router.get('/:id/members', requireProjectAccess(), async (req, res, next) => {
  try {
    const members = await prisma.projectMember.findMany({
      where: { projectId: req.params.id },
      include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
      orderBy: { joinedAt: 'asc' },
    });
    // Transform data to send users array directly for easy frontend consumption (optional, but convenient)
    const users = members.map(m => ({ ...m.user, memberRole: m.role }));
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
});

// ─── Add member ───────────────────────────────────────────────────────────────
router.post('/:id/members', requireProjectAccess([MemberRole.OWNER, MemberRole.MANAGER]), async (req, res, next) => {
  try {
    const { userId, role } = z.object({
      userId: z.string(),
      role: z.nativeEnum(MemberRole).default(MemberRole.MEMBER),
    }).parse(req.body);

    const member = await prisma.projectMember.upsert({
      where: { userId_projectId: { userId, projectId: req.params.id } },
      update: { role },
      create: { userId, projectId: req.params.id, role },
      include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
    });
    res.status(201).json({ success: true, data: member });
  } catch (err) {
    next(err);
  }
});

// ─── Remove member ────────────────────────────────────────────────────────────
router.delete('/:id/members/:userId', requireProjectAccess([MemberRole.OWNER, MemberRole.MANAGER]), async (req, res, next) => {
  try {
    if (req.params.userId === req.user!.id) {
      return res.status(400).json({ success: false, message: 'Cannot remove yourself from project' });
    }
    await prisma.projectMember.delete({
      where: {
        userId_projectId: { userId: req.params.userId, projectId: req.params.id },
      },
    });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// ─── Dashboard stats ──────────────────────────────────────────────────────────
router.get('/stats/dashboard', async (req, res, next) => {
  try {
    const userId = req.user!.id;

    const [totalTasks, myTasks, overdueTasks, completedThisWeek, recentActivity] = await Promise.all([
      // Total tasks across user's projects
      prisma.task.count({
        where: {
          project: { organizationId: req.organizationId, members: { some: { userId } } },
          parentId: null,
        },
      }),
      // My assigned tasks
      prisma.task.count({
        where: { assigneeId: userId, status: { not: 'DONE' }, project: { organizationId: req.organizationId } },
      }),
      // Overdue tasks
      prisma.task.count({
        where: {
          assigneeId: userId,
          status: { not: 'DONE' },
          dueDate: { lt: new Date() },
          project: { organizationId: req.organizationId },
        },
      }),
      // Completed this week
      prisma.task.count({
        where: {
          project: { organizationId: req.organizationId, members: { some: { userId } } },
          status: 'DONE',
          updatedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      // Recent activity
      prisma.activity.findMany({
        where: {
          task: { project: { organizationId: req.organizationId, members: { some: { userId } } } },
        },
        include: {
          user: { select: { id: true, name: true, avatar: true } },
          task: { select: { id: true, title: true, projectId: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    res.json({
      success: true,
      data: { totalTasks, myTasks, overdueTasks, completedThisWeek, recentActivity },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
