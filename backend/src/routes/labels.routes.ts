import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticate } from '../middlewares/auth.middleware';
import { requireProjectAccess } from '../middlewares/rbac.middleware';

const router = Router();
router.use(authenticate);

const LabelSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#6B7280'),
});

// ─── List labels for a project ────────────────────────────────────────────────
router.get('/project/:projectId', requireProjectAccess(), async (req, res, next) => {
  try {
    const labels = await prisma.label.findMany({
      where: { projectId: req.params.projectId },
      include: { _count: { select: { tasks: true } } },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ success: true, data: labels });
  } catch (err) { next(err); }
});

// ─── Create label ─────────────────────────────────────────────────────────────
router.post('/project/:projectId', requireProjectAccess('MANAGER'), async (req, res, next) => {
  try {
    const body = LabelSchema.parse(req.body);
    const label = await prisma.label.create({
      data: { ...body, projectId: req.params.projectId },
    });
    res.status(201).json({ success: true, data: label });
  } catch (err) { next(err); }
});

// ─── Update label ─────────────────────────────────────────────────────────────
router.put('/:id', async (req, res, next) => {
  try {
    const body = LabelSchema.partial().parse(req.body);
    const label = await prisma.label.update({
      where: { id: req.params.id },
      data: body,
    });
    res.json({ success: true, data: label });
  } catch (err) { next(err); }
});

// ─── Delete label ─────────────────────────────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.label.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) { next(err); }
});

// ─── Assign label to task ─────────────────────────────────────────────────────
router.post('/task/:taskId/assign/:labelId', async (req, res, next) => {
  try {
    const taskLabel = await prisma.taskLabel.upsert({
      where: { taskId_labelId: { taskId: req.params.taskId, labelId: req.params.labelId } },
      create: { taskId: req.params.taskId, labelId: req.params.labelId },
      update: {},
    });
    res.status(201).json({ success: true, data: taskLabel });
  } catch (err) { next(err); }
});

// ─── Remove label from task ───────────────────────────────────────────────────
router.delete('/task/:taskId/assign/:labelId', async (req, res, next) => {
  try {
    await prisma.taskLabel.delete({
      where: { taskId_labelId: { taskId: req.params.taskId, labelId: req.params.labelId } },
    });
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
