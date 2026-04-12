import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';

const router = Router();

// ─── Get all settings ────────────────────────────────────────────────────────
router.get('/', authenticate, async (_req, res, next) => {
  try {
    const settings = await prisma.setting.findMany();
    // Convert to object for easier use in frontend
    const config = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);
    
    res.json({ success: true, data: config });
  } catch (err) {
    next(err);
  }
});

// ─── Update/Create setting (Admin only) ──────────────────────────────────────
router.put('/', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const data = z.record(z.string()).parse(req.body);

    const updates = Object.entries(data).map(([key, value]) => {
      return prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    });

    await Promise.all(updates);

    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
