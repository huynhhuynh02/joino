# Skill: Backend API Pattern (Express + Prisma)

## Purpose
Hướng dẫn tạo một API endpoint hoàn chỉnh theo pattern chuẩn của ProjectFlow backend.

## Pattern: Route → Controller → Service → Prisma

### 1. Route (`src/routes/[resource].routes.ts`)
```typescript
import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';
import * as controller from '../controllers/[resource].controller';

const router = Router();

router.use(authenticate); // All routes require auth

router.get('/', controller.getAll);
router.post('/', controller.create);
router.get('/:id', controller.getOne);
router.put('/:id', controller.update);
router.delete('/:id', requireRole('ADMIN', 'MANAGER'), controller.remove);

export default router;
```

### 2. Controller (`src/controllers/[resource].controller.ts`)
```typescript
import { Request, Response, NextFunction } from 'express';
import { [Resource]Schema } from '../validators/[resource].validator';
import * as [resource]Service from '../services/[resource].service';

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const data = await [resource]Service.getAll(userId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = [Resource]Schema.parse(req.body);
    const userId = req.user!.id;
    const data = await [resource]Service.create(body, userId);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const getOne = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = await [resource]Service.getById(id);
    if (!data) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const body = [Resource]UpdateSchema.parse(req.body);
    const data = await [resource]Service.update(id, body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await [resource]Service.remove(id);
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (err) {
    next(err);
  }
};
```

### 3. Service (`src/services/[resource].service.ts`)
```typescript
import { prisma } from '../config/database';
import type { CreateResourceDto, UpdateResourceDto } from '../types';

export const getAll = async (userId: string) => {
  return prisma.[resource].findMany({
    where: { /* filter by user access */ },
    orderBy: { createdAt: 'desc' },
    include: {
      /* related entities */
    },
  });
};

export const getById = async (id: string) => {
  return prisma.[resource].findUnique({
    where: { id },
    include: { /* related entities */ },
  });
};

export const create = async (data: CreateResourceDto, creatorId: string) => {
  return prisma.[resource].create({
    data: { ...data, creatorId },
    include: { /* related entities */ },
  });
};

export const update = async (id: string, data: UpdateResourceDto) => {
  return prisma.[resource].update({
    where: { id },
    data,
  });
};

export const remove = async (id: string) => {
  return prisma.[resource].delete({ where: { id } });
};
```

### 4. Validator (`src/validators/[resource].validator.ts`)
```typescript
import { z } from 'zod';

export const [Resource]Schema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  // Add fields per resource
});

export const [Resource]UpdateSchema = [Resource]Schema.partial();
```

## Standard API Response Format
```json
// Success
{ "success": true, "data": { ... } }
{ "success": true, "data": [...] }

// Error
{ "success": false, "message": "Error description", "errors": [] }
```

## Error Handling (Global Error Middleware)
All errors are passed to `next(err)`. The global error handler in `src/index.ts` catches them:
```typescript
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof ZodError) {
    return res.status(400).json({ success: false, message: 'Validation error', errors: err.errors });
  }
  console.error(err);
  res.status(500).json({ success: false, message: err.message || 'Internal server error' });
});
```

## Auth Middleware
```typescript
// req.user is always available inside protected routes
interface AuthRequest extends Request {
  user?: { id: string; email: string; role: string; }
}
```
