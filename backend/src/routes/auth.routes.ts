import { Router } from 'express';
import { OAuth2Client } from 'google-auth-library';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticate } from '../middlewares/auth.middleware';
import { sendWelcomeEmail, sendResetPasswordEmail } from '../config/email';

const router = Router();

const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function signToken(userId: string) {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// ─── Register ────────────────────────────────────────────────────────────────
router.post('/register', async (req, res, next) => {
  try {
    const body = RegisterSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(body.password, 12);
    const user = await prisma.user.create({
      data: { email: body.email, name: body.name, passwordHash },
      select: { 
        id: true, email: true, name: true, role: true, 
        avatar: true, createdAt: true,
        dailySummary: true, mentionsNotifications: true, assignmentsNotifications: true 
      },
    });

    await sendWelcomeEmail({ to: user.email, name: user.name });

    const token = signToken(user.id);
    res.status(201).json({ success: true, data: { user, token } });
  } catch (err) {
    next(err);
  }
});

// ─── Login ───────────────────────────────────────────────────────────────────
router.post('/login', async (req, res, next) => {
  try {
    const body = LoginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(body.password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated' });
    }

    const token = signToken(user.id);
    res.json({
      success: true,
      data: {
        user: {
          id: user.id, email: user.email, name: user.name,
          role: user.role, avatar: user.avatar,
          dailySummary: user.dailySummary,
          mentionsNotifications: user.mentionsNotifications,
          assignmentsNotifications: user.assignmentsNotifications,
        },
        token,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── Get Current User ─────────────────────────────────────────────────────────
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true, email: true, name: true, role: true,
        avatar: true, provider: true, createdAt: true,
        dailySummary: true, mentionsNotifications: true, assignmentsNotifications: true,
      },
    });
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

// ─── Update Profile ───────────────────────────────────────────────────────────
router.put('/profile', authenticate, async (req, res, next) => {
  try {
    const UpdateSchema = z.object({
      name: z.string().min(2).max(100).optional(),
      avatar: z.string().url().optional().nullable(),
    });
    const body = UpdateSchema.parse(req.body);

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: body,
      select: { id: true, email: true, name: true, role: true, avatar: true },
    });
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

// ─── Google OAuth ─────────────────────────────────────────────────────────────
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post('/google', async (req, res, next) => {
  try {
    const { idToken } = z.object({ idToken: z.string() }).parse(req.body);

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({ success: false, message: 'Invalid Google token' });
    }

    let user = await prisma.user.findFirst({
      where: { OR: [{ googleId: payload.sub }, { email: payload.email }] },
    });

    if (!user) {
      // Create new user from Google
      user = await prisma.user.create({
        data: {
          email: payload.email,
          name: payload.name || payload.email,
          avatar: payload.picture,
          googleId: payload.sub,
          provider: 'GOOGLE',
        },
      });
      await sendWelcomeEmail({ to: user.email, name: user.name });
    } else if (!user.googleId) {
      // Link Google to existing account
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId: payload.sub, provider: 'GOOGLE' },
      });
    }

    const token = signToken(user.id);
    res.json({
      success: true,
      data: {
        user: {
          id: user.id, email: user.email, name: user.name,
          role: user.role, avatar: user.avatar,
          dailySummary: user.dailySummary,
          mentionsNotifications: user.mentionsNotifications,
          assignmentsNotifications: user.assignmentsNotifications,
        },
        token,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── Change Password ──────────────────────────────────────────────────────────
router.put('/change-password', authenticate, async (req, res, next) => {
  try {
    const Schema = z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(8),
    });
    const { currentPassword, newPassword } = Schema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user?.passwordHash) {
      return res.status(400).json({ success: false, message: 'No password set (OAuth account)' });
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.user!.id }, data: { passwordHash } });

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
});

// ─── Forgot Password ────────────────────────────────────────────────────────
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal if email doesn't exist for security
      return res.json({ success: true, message: 'If an account exists with that email, a reset link has been sent.' });
    }

    const token = jwt.sign(
      { userId: user.id, type: 'password-reset' },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1h' }
    );

    await sendResetPasswordEmail({ to: user.email, name: user.name, token });

    res.json({ success: true, message: 'Password reset link sent' });
  } catch (err) {
    next(err);
  }
});

// ─── Reset Password ─────────────────────────────────────────────────────────
router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, password } = z.object({
      token: z.string(),
      password: z.string().min(8),
    }).parse(req.body);

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    if (decoded.type !== 'password-reset' || !decoded.userId) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    res.json({ success: true, message: 'Password has been reset successfully' });
  } catch (err: any) {
    if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid or expired reset token' });
    }
    next(err);
  }
});

export default router;
