import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { MemberRole } from '@prisma/client';

// Require system-level roles
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    }
    next();
  };
}

// Check if the user is a member of a project (and optionally require specific project role)
export function requireProjectAccess(allowedRoles?: MemberRole[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const projectId = req.params.projectId || req.params.id || req.body.projectId;

    if (!projectId) {
      return next(); // No project context — skip check
    }

    // Admins bypass project membership check
    if (req.user.role === 'ADMIN') {
      return next();
    }

    const membership = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: req.user.id,
          projectId,
        },
      },
    });

    if (!membership) {
      return res.status(403).json({ success: false, message: 'You are not a member of this project' });
    }

    if (allowedRoles && !allowedRoles.includes(membership.role)) {
      return res.status(403).json({ success: false, message: 'Insufficient project permissions' });
    }

    next();
  };
}
