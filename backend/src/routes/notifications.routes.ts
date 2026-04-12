import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();
router.use(authenticate);

// ─── List notifications ────────────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    
    const projectIds = [...new Set(notifications.map(n => n.projectId).filter(Boolean))] as string[];
    const projects = await prisma.project.findMany({
      where: { id: { in: projectIds } },
      select: { id: true, name: true, color: true }
    });

    const data = notifications.map(n => ({
      ...n,
      project: n.projectId ? projects.find(p => p.id === n.projectId) : null
    }));

    const unreadCount = await prisma.notification.count({
      where: { userId: req.user!.id, read: false },
    });
    res.json({ success: true, data, meta: { unreadCount } });
  } catch (err) {
    next(err);
  }
});

// ─── Mark one as read ─────────────────────────────────────────────────────────
router.put('/:id/read', async (req, res, next) => {
  try {
    const notification = await prisma.notification.update({
      where: { id: req.params.id },
      data: { read: true },
    });
    res.json({ success: true, data: notification });
  } catch (err) {
    next(err);
  }
});

// ─── Mark all as read ─────────────────────────────────────────────────────────
router.put('/read-all', async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, read: false },
      data: { read: true },
    });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
});

// ─── Delete notification ──────────────────────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.notification.deleteMany({
      where: { id: req.params.id, userId: req.user!.id },
    });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
