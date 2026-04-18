import { Router } from 'express';
import path from 'path';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticate, requireOrganization } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';
import { sendInviteEmail } from '../config/email';
import { upload } from '../middlewares/upload.middleware';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();

// ─── Accept Invite (Public) ──────────────────────────────────────────────────
router.post('/accept-invite', async (req, res, next) => {
  try {
    const { token, name, password } = z.object({
      token: z.string(),
      name: z.string().min(2),
      password: z.string().min(6),
    }).parse(req.body);

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: { organization: true },
    });

    if (!invitation || invitation.status !== 'PENDING' || invitation.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired invite token' });
    }

    let user = await prisma.user.findUnique({ where: { email: invitation.email } });
    const hashedPassword = await bcrypt.hash(password, 10);

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: invitation.email,
          name,
          passwordHash: hashedPassword,
          isActive: true,
        },
      });
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: hashedPassword, isActive: true },
      });
    }

    // Add user to organization
    await prisma.organizationMember.create({
      data: {
        userId: user.id,
        organizationId: invitation.organizationId,
        role: invitation.role,
      },
    });

    // Complete invitation
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: 'ACCEPTED' },
    });

    res.json({ success: true, message: 'Invite accepted successfully' });
  } catch (err: any) {
    if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid or expired invite token' });
    }
    next(err);
  }
});

router.use(authenticate);

// ─── Search users (MUST BE BEFORE /:id) ──────────────────────────────────────
router.get('/search', async (req, res, next) => {
  try {
    const { q } = z.object({ q: z.string().min(1) }).parse(req.query);
    console.log(`[UserSearch] Searching for: ${q}`);
    
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
        isActive: true,
      },
      select: { id: true, email: true, name: true, avatar: true },
      take: 10,
    });
    
    console.log(`[UserSearch] Found ${users.length} users`);
    res.json({ success: true, data: users });
  } catch (err) {
    console.error('[UserSearch] Error:', err);
    next(err);
  }
});

// ─── List all users ─────────────────────────────────────────────
router.get('/', async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true, email: true, name: true, role: true,
        avatar: true, isActive: true, createdAt: true,
        _count: {
          select: {
            assignedTasks: { where: { status: { not: 'DONE' } } },
          }
        }
      },
      orderBy: { name: 'asc' },
    });
    const data = users.map(u => ({
      ...u,
      _count: {
        tasks: u._count.assignedTasks
      }
    }));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// ─── Get user by ID ───────────────────────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, email: true, name: true, role: true,
        avatar: true, createdAt: true,
      },
    });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

// ─── Update Profile ───────────────────────────────────────────────────────────
router.put('/profile/update', authenticate, async (req, res, next) => {
  try {
    const { 
      name, 
      dailySummary, 
      mentionsNotifications, 
      assignmentsNotifications 
    } = z.object({ 
      name: z.string().min(2).optional(),
      dailySummary: z.boolean().optional(),
      mentionsNotifications: z.boolean().optional(),
      assignmentsNotifications: z.boolean().optional(),
    }).parse(req.body);

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { 
        ...(name !== undefined ? { name } : {}),
        ...(dailySummary !== undefined ? { dailySummary } : {}),
        ...(mentionsNotifications !== undefined ? { mentionsNotifications } : {}),
        ...(assignmentsNotifications !== undefined ? { assignmentsNotifications } : {}),
      },
      select: { 
        id: true, 
        email: true, 
        name: true, 
        role: true, 
        avatar: true,
        dailySummary: true,
        mentionsNotifications: true,
        assignmentsNotifications: true,
      },
    });
    res.json({ success: true, data: user });
  } catch(err) {
    next(err);
  }
});

// ─── Update Avatar ───────────────────────────────────────────────────────────
router.post('/profile/avatar', authenticate, upload.single('avatar'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Convert path to URL (assuming local storage served at /uploads)
    const baseUrl = (process.env.BACKEND_URL || 'http://localhost:4000').replace(/\/$/, '');
    const relativePath = path.relative(process.cwd(), req.file.path).replace(/\\/g, '/');
    const avatarUrl = `${baseUrl}/${relativePath}`;

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { avatar: avatarUrl },
      select: { id: true, email: true, name: true, role: true, avatar: true },
    });

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

// ─── Change Password ──────────────────────────────────────────────────────────
router.put('/profile/password', async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = z.object({
      currentPassword: z.string(),
      newPassword: z.string().min(6),
    }).parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });

    if (!user || !user.passwordHash) {
      return res.status(404).json({ success: false, message: 'User not found or no password set' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect current password' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { passwordHash: hashedPassword },
    });

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
});


// ─── Deactivate user (Admin) ──────────────────────────────────────────────────
router.put('/:id/deactivate', requireRole('ADMIN'), async (req, res, next) => {
  try {
    if (req.params.id === req.user!.id) {
      return res.status(400).json({ success: false, message: 'Cannot deactivate yourself' });
    }
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: false },
      select: { id: true, email: true, name: true, isActive: true },
    });
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

// ─── Reactivate user (Admin) ──────────────────────────────────────────────────
router.put('/:id/reactivate', requireRole('ADMIN'), async (req, res, next) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: true },
      select: { id: true, email: true, name: true, isActive: true },
    });
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

// ─── Change Role (Admin) ──────────────────────────────────────────────────────
router.put('/:id/role', requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { role } = z.object({
      role: z.enum(['ADMIN', 'MANAGER', 'MEMBER']),
    }).parse(req.body);

    if (req.params.id === req.user!.id && role !== 'ADMIN') {
      return res.status(400).json({ success: false, message: 'Cannot demote yourself' });
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
      select: { id: true, email: true, name: true, role: true },
    });
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

// ─── Invite user (Admin) ─────────────────────────────────────────────────────
router.post('/invite', requireOrganization, async (req, res, next) => {
  try {
    // Only ALLOW OWNER or ADMIN of the current organization to invite.
    if (req.orgRole !== 'OWNER' && req.orgRole !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Must be an Organization Admin' });
    }

    const { email, role } = z.object({
      email: z.string().email(),
      role: z.enum(['ADMIN', 'MANAGER', 'MEMBER']).default('MEMBER'),
    }).parse(req.body);

    const existingMember = await prisma.organizationMember.findFirst({
      where: {
        organizationId: req.organizationId,
        user: { email }
      }
    });

    if (existingMember) {
      return res.status(400).json({ success: false, message: 'User is already a member of this workspace' });
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = await prisma.invitation.create({
      data: {
        email,
        role: role as any,
        organizationId: req.organizationId!,
        invitedById: req.user!.id,
        expiresAt,
      },
    });

    await sendInviteEmail({
      to: email,
      inviterName: req.user!.name,
      role,
      token: invitation.token,
    });

    res.json({ success: true, data: { id: invitation.id, email: invitation.email } });
  } catch (err) {
    next(err);
  }
});

export default router;
