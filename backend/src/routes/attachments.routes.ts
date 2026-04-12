import { Router } from 'express';
import path from 'path';
import { prisma } from '../config/database';
import { authenticate } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/upload.middleware';

const router = Router();
router.use(authenticate);

// ─── Upload attachment ────────────────────────────────────────────────────────
router.post('/task/:taskId', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Build URL relative to uploads dir
    const baseUrl = (process.env.BACKEND_URL || 'http://localhost:4000').replace(/\/$/, '');
    const relativePath = path.relative(process.cwd(), req.file.path).replace(/\\/g, '/');
    const url = `${baseUrl}/${relativePath}`;

    const attachment = await prisma.attachment.create({
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        url,
        size: req.file.size,
        mimeType: req.file.mimetype,
        taskId: req.params.taskId,
        uploaderId: req.user!.id,
      },
      include: { uploader: { select: { id: true, name: true } } },
    });

    await prisma.activity.create({
      data: {
        action: 'file_uploaded',
        taskId: req.params.taskId,
        userId: req.user!.id,
        details: { filename: req.file.originalname },
      },
    });

    res.status(201).json({ success: true, data: attachment });
  } catch (err) {
    next(err);
  }
});

// ─── Delete attachment ────────────────────────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
  try {
    const attachment = await prisma.attachment.findUnique({ where: { id: req.params.id } });
    if (!attachment) return res.status(404).json({ success: false, message: 'Attachment not found' });

    if (attachment.uploaderId !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Delete from disk
    const filePath = path.join(process.cwd(), 'uploads', path.basename(path.dirname(attachment.url)), attachment.filename);
    const fs = await import('fs/promises');
    try {
      await fs.unlink(filePath);
    } catch {
      // File may not exist — proceed anyway
    }

    await prisma.attachment.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
