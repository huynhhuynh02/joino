import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticate } from '../middlewares/auth.middleware';
import { requireProjectAccess } from '../middlewares/rbac.middleware';
import { MemberRole } from '@prisma/client';

const router = Router();
router.use(authenticate);

const FolderSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  parentId: z.string().optional().nullable(),
  position: z.number().int().optional(),
});

// ─── List folders for a project (nested tree) ─────────────────────────────────
router.get('/project/:projectId', requireProjectAccess(), async (req, res, next) => {
  try {
    const folders = await prisma.folder.findMany({
      where: { projectId: req.params.projectId, parentId: null }, // top-level only
      include: {
        children: {
          include: {
            children: true,
            _count: { select: { tasks: true } },
          },
          orderBy: [{ position: 'asc' }, { name: 'asc' }],
        },
        _count: { select: { tasks: true } },
      },
      orderBy: [{ position: 'asc' }, { name: 'asc' }],
    });
    res.json({ success: true, data: folders });
  } catch (err) {
    next(err);
  }
});

// ─── Get all folders flat (for pickers) ───────────────────────────────────────
router.get('/project/:projectId/flat', requireProjectAccess(), async (req, res, next) => {
  try {
    const folders = await prisma.folder.findMany({
      where: { projectId: req.params.projectId },
      include: { _count: { select: { tasks: true } } },
      orderBy: [{ position: 'asc' }, { name: 'asc' }],
    });
    res.json({ success: true, data: folders });
  } catch (err) {
    next(err);
  }
});

// ─── Get tasks in a folder ────────────────────────────────────────────────────
router.get('/:id/tasks', async (req, res, next) => {
  try {
    const folder = await prisma.folder.findUnique({
      where: { id: req.params.id },
      select: { projectId: true },
    });
    if (!folder) return res.status(404).json({ success: false, message: 'Folder not found' });

    const tasks = await prisma.task.findMany({
      where: { folderId: req.params.id, parentId: null },
      include: {
        assignee: { select: { id: true, name: true, avatar: true } },
        creator:  { select: { id: true, name: true } },
        labels:   { include: { label: true } },
        subtasks: {
          include: { assignee: { select: { id: true, name: true, avatar: true } } },
          orderBy: { position: 'asc' },
        },
        _count: { select: { comments: true, attachments: true } },
      },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    });
    res.json({ success: true, data: tasks });
  } catch (err) {
    next(err);
  }
});

// ─── Create folder ────────────────────────────────────────────────────────────
router.post('/project/:projectId', requireProjectAccess([MemberRole.OWNER, MemberRole.MANAGER, MemberRole.MEMBER]), async (req, res, next) => {
  try {
    const body = FolderSchema.parse(req.body);
    const projectId = req.params.projectId;

    // Get max position at same level
    const maxPos = await prisma.folder.aggregate({
      where: { projectId, parentId: body.parentId || null },
      _max: { position: true },
    });

    const folder = await prisma.folder.create({
      data: {
        ...body,
        projectId,
        position: body.position ?? (maxPos._max.position ?? 0) + 1,
      },
      include: {
        children: true,
        _count: { select: { tasks: true } },
      },
    });
    res.status(201).json({ success: true, data: folder });
  } catch (err) {
    next(err);
  }
});

// ─── Update folder ────────────────────────────────────────────────────────────
router.put('/:id', async (req, res, next) => {
  try {
    const body = FolderSchema.partial().parse(req.body);

    // Prevent circular parent reference
    if (body.parentId) {
      if (body.parentId === req.params.id) {
        return res.status(400).json({ success: false, message: 'A folder cannot be its own parent' });
      }
    }

    const folder = await prisma.folder.update({
      where: { id: req.params.id },
      data: body,
      include: {
        children: true,
        _count: { select: { tasks: true } },
      },
    });
    res.json({ success: true, data: folder });
  } catch (err) {
    next(err);
  }
});

// ─── Delete folder (cascade deletes children via DB) ─────────────────────────
router.delete('/:id', async (req, res, next) => {
  try {
    const { moveTasks } = z.object({
      moveTasks: z.boolean().optional(), // if true, unassign tasks from folder instead of cascade
    }).parse(req.query);

    if (moveTasks) {
      // Unassign tasks from folder before deleting
      await prisma.task.updateMany({
        where: { folderId: req.params.id },
        data: { folderId: null },
      });
    }

    await prisma.folder.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// ─── Move (reorder) folder ────────────────────────────────────────────────────
router.put('/:id/move', async (req, res, next) => {
  try {
    const { parentId, position } = z.object({
      parentId: z.string().nullable(),
      position: z.number().int().min(0),
    }).parse(req.body);

    const folder = await prisma.folder.update({
      where: { id: req.params.id },
      data: { parentId, position },
    });
    res.json({ success: true, data: folder });
  } catch (err) {
    next(err);
  }
});

export default router;
