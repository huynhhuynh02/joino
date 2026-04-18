import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticate, requireOrganization } from '../middlewares/auth.middleware';

const router = Router();
router.use(authenticate);

// ─── List my organizations ────────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const memberships = await prisma.organizationMember.findMany({
      where: { userId: req.user!.id },
      include: {
        organization: {
          select: { id: true, name: true, slug: true, logo: true }
        }
      }
    });
    
    const organizations = memberships.map(m => ({
      ...m.organization,
      role: m.role,
      joinedAt: m.joinedAt
    }));

    res.json({ success: true, data: organizations });
  } catch (err) {
    next(err);
  }
});

// ─── Create a new organization ────────────────────────────────────────────────
router.post('/', async (req, res, next) => {
  try {
    const body = z.object({
      name: z.string().min(2).max(100),
    }).parse(req.body);

    // Generate slug from name
    const baseSlug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    let slug = baseSlug;
    let counter = 1;
    
    // Ensure slug uniqueness
    while (await prisma.organization.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    const org = await prisma.organization.create({
      data: {
        name: body.name,
        slug,
        members: {
          create: {
            userId: req.user!.id,
            role: 'OWNER'
          }
        }
      }
    });

    res.status(201).json({ success: true, data: org });
  } catch (err) {
    next(err);
  }
});

// ─── Get current organization details ─────────────────────────────────────────
router.get('/current', requireOrganization, async (req, res, next) => {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: req.organizationId },
      include: {
        _count: {
          select: { members: true, projects: true }
        }
      }
    });

    res.json({ success: true, data: org });
  } catch (err) {
    next(err);
  }
});

// ─── List organization members ────────────────────────────────────────────────
router.get('/members', requireOrganization, async (req, res, next) => {
  try {
    const members = await prisma.organizationMember.findMany({
      where: { organizationId: req.organizationId },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } }
      }
    });
    res.json({ success: true, data: members });
  } catch (err) {
    next(err);
  }
});

// ─── Update current organization ──────────────────────────────────────────────
router.put('/current', requireOrganization, async (req, res, next) => {
  try {
    // Check permission
    if (req.orgRole !== 'OWNER' && req.orgRole !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Only Organization Admins can update settings' });
    }

    const { name } = z.object({
      name: z.string().min(2).max(100),
    }).parse(req.body);

    const org = await prisma.organization.update({
      where: { id: req.organizationId },
      data: { name }
    });

    res.json({ success: true, data: org });
  } catch (err) {
    next(err);
  }
});

export default router;
