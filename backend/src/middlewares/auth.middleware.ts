import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      organizationId?: string;
      orgRole?: string;
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET || 'secret';
    const payload = jwt.verify(token, secret) as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found or inactive' });
    }

    req.user = user;

    const orgId = req.headers['x-organization-id'] as string;
    if (orgId) {
      const member = await prisma.organizationMember.findUnique({
        where: { userId_organizationId: { userId: user.id, organizationId: orgId } }
      });
      if (member) {
        req.organizationId = orgId;
        req.orgRole = member.role;
      }
    }

    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

export function requireOrganization(req: Request, res: Response, next: NextFunction) {
  if (!req.organizationId) {
    return res.status(400).json({ success: false, message: 'Organization context required. Missing or invalid x-organization-id header.' });
  }
  next();
}
