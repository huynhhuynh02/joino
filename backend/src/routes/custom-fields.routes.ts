import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();
router.use(authenticate);

// ─── Custom Field Schema ───
const customFieldSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['TEXT', 'NUMBER', 'DATE', 'DROPDOWN', 'CHECKBOX', 'URL']),
  options: z.any().optional(), // For dropdowns
});

// ─── PROJECT LEVEL: Manage Custom Fields ───

// Get all custom fields for a project
router.get('/project/:projectId', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const fields = await prisma.customField.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ success: true, data: fields });
  } catch (err) {
    next(err);
  }
});

// Create a new custom field for a project
router.post('/project/:projectId', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { name, type, options } = customFieldSchema.parse(req.body);

    const field = await prisma.customField.create({
      data: {
        projectId,
        name,
        type,
        options: options || null,
      },
    });

    res.json({ success: true, data: field });
  } catch (err) {
    next(err);
  }
});

// Update a custom field definition
router.put('/:fieldId', async (req, res, next) => {
  try {
    const { fieldId } = req.params;
    const { name, type, options } = customFieldSchema.partial().parse(req.body);

    const field = await prisma.customField.update({
      where: { id: fieldId },
      data: {
        name,
        type,
        options: options || undefined,
      },
    });

    res.json({ success: true, data: field });
  } catch (err) {
    next(err);
  }
});

// Delete a custom field definition
router.delete('/:fieldId', async (req, res, next) => {
  try {
    const { fieldId } = req.params;
    await prisma.customField.delete({ where: { id: fieldId } });
    res.json({ success: true, message: 'Custom field deleted' });
  } catch (err) {
    next(err);
  }
});

// ─── TASK LEVEL: Set Values ───

// Set a custom field value for a task
router.post('/task/:taskId/value', async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { fieldId, value } = z.object({
      fieldId: z.string(),
      value: z.any(),
    }).parse(req.body);

    // Upsert the value
    const fieldValue = await prisma.customFieldValue.upsert({
      where: {
        fieldId_taskId: {
          fieldId,
          taskId,
        },
      },
      update: {
        value: String(value),
      },
      create: {
        fieldId,
        taskId,
        value: String(value),
      },
    });

    res.json({ success: true, data: fieldValue });
  } catch (err) {
    next(err);
  }
});

// Get all custom field values for a task
router.get('/task/:taskId', async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const values = await prisma.customFieldValue.findMany({
      where: { taskId },
      include: {
        field: true,
      },
    });
    res.json({ success: true, data: values });
  } catch (err) {
    next(err);
  }
});

export default router;
