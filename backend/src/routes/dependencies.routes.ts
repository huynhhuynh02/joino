import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticate } from '../middlewares/auth.middleware';
import { DependencyType } from '@prisma/client';

const router = Router();
router.use(authenticate);

// ─── Get dependencies for a task ──────────────────────────────────────────────
router.get('/task/:taskId', async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const [predecessors, successors] = await Promise.all([
      prisma.taskDependency.findMany({
        where: { successorId: taskId },
        include: {
          predecessor: {
            select: { id: true, title: true, status: true, dueDate: true },
          },
        },
      }),
      prisma.taskDependency.findMany({
        where: { predecessorId: taskId },
        include: {
          successor: {
            select: { id: true, title: true, status: true, dueDate: true },
          },
        },
      }),
    ]);
    res.json({ success: true, data: { predecessors, successors } });
  } catch (err) {
    next(err);
  }
});

// ─── Add dependency ───────────────────────────────────────────────────────────
router.post('/', async (req, res, next) => {
  try {
    const body = z.object({
      predecessorId: z.string(),
      successorId:   z.string(),
      type: z.nativeEnum(DependencyType).default('FINISH_TO_START'),
    }).parse(req.body);

    if (body.predecessorId === body.successorId) {
      return res.status(400).json({ success: false, message: 'A task cannot depend on itself' });
    }

    // ── Circular dependency check (DFS) ───────────────────────────────────────
    const wouldCreateCycle = await checkCycle(body.predecessorId, body.successorId);
    if (wouldCreateCycle) {
      return res.status(400).json({
        success: false,
        message: 'Adding this dependency would create a circular reference',
      });
    }

    const dep = await prisma.taskDependency.create({
      data: body,
      include: {
        predecessor: { select: { id: true, title: true, status: true, dueDate: true } },
        successor:   { select: { id: true, title: true, status: true, dueDate: true } },
      },
    });
    res.status(201).json({ success: true, data: dep });
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'This dependency already exists' });
    }
    next(err);
  }
});

// ─── Remove dependency ────────────────────────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.taskDependency.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// ─── Remove dependency by predecessor+successor ───────────────────────────────
router.delete('/between/:predecessorId/:successorId', async (req, res, next) => {
  try {
    await prisma.taskDependency.deleteMany({
      where: {
        predecessorId: req.params.predecessorId,
        successorId:   req.params.successorId,
      },
    });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// ─── Get all dependencies for a project (for Gantt rendering) ─────────────────
router.get('/project/:projectId', async (req, res, next) => {
  try {
    const deps = await prisma.taskDependency.findMany({
      where: {
        predecessor: { projectId: req.params.projectId },
      },
      include: {
        predecessor: { select: { id: true, title: true } },
        successor:   { select: { id: true, title: true } },
      },
    });
    res.json({ success: true, data: deps });
  } catch (err) {
    next(err);
  }
});

// ─── Circular dependency DFS helper ──────────────────────────────────────────
async function checkCycle(startId: string, targetId: string): Promise<boolean> {
  // BFS from startId following successor links — if we reach targetId, cycle detected
  const visited = new Set<string>();
  const queue = [startId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === targetId) return true;
    if (visited.has(current)) continue;
    visited.add(current);

    const successors = await prisma.taskDependency.findMany({
      where: { predecessorId: current },
      select: { successorId: true },
    });
    for (const s of successors) {
      queue.push(s.successorId);
    }
  }
  return false;
}

export default router;
