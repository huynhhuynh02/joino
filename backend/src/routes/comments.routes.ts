import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticate } from '../middlewares/auth.middleware';
import { sendCommentNotificationEmail } from '../config/email';

const router = Router();
router.use(authenticate);

// ─── List comments for a task ─────────────────────────────────────────────────
router.get('/task/:taskId', async (req, res, next) => {
  try {
    const comments = await prisma.comment.findMany({
      where: { taskId: req.params.taskId },
      include: { user: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ success: true, data: comments });
  } catch (err) {
    next(err);
  }
});

// ─── Add comment ──────────────────────────────────────────────────────────────
router.post('/task/:taskId', async (req, res, next) => {
  try {
    const { content } = z.object({ content: z.string().min(1).max(5000) }).parse(req.body);
    const userId = req.user!.id;

    const comment = await prisma.comment.create({
      data: { content, taskId: req.params.taskId, userId },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });

    // Log activity
    await prisma.activity.create({
      data: { action: 'comment_added', taskId: req.params.taskId, userId },
    });

    // Notify task assignee, creator, and mentioned users
    const task = await prisma.task.findUnique({
      where: { id: req.params.taskId },
      include: {
        assignee: { select: { id: true, email: true, name: true, mentionsNotifications: true } },
        creator: { select: { id: true, email: true, name: true, mentionsNotifications: true } },
        project: { select: { id: true } },
      },
    });

    if (task) {
      // 1. Detect mentions
      const allUsers = await prisma.user.findMany({ select: { id: true, name: true, email: true, mentionsNotifications: true } });
      const mentionedUsers = allUsers.filter(u => content.includes(`@${u.name}`) && u.id !== userId);

      const notifiedSet = new Set<string>();

      // Send mention notifications
      for (const mUser of mentionedUsers) {
        notifiedSet.add(mUser.id);
        await prisma.notification.create({
          data: {
            type: 'mention',
            title: 'You were mentioned',
            message: `${comment.user.name} mentioned you in a comment on "${task.title}"`,
            userId: mUser.id,
            taskId: task.id,
            projectId: task.projectId,
          },
        });
        
        if (mUser.mentionsNotifications) {
          await sendCommentNotificationEmail({
            to: mUser.email,
            recipientName: mUser.name,
            commenterName: comment.user.name,
            taskTitle: task.title,
            commentContent: content,
            taskUrl: `${process.env.FRONTEND_URL}/projects/${task.projectId}?taskId=${task.id}`,
          });
        }
      }

      // 2. Regular notifications to assignee & creator
      const notifyOthers = new Set<string>();
      if (task.assigneeId && task.assigneeId !== userId && !notifiedSet.has(task.assigneeId)) {
        notifyOthers.add(task.assigneeId);
      }
      if (task.creatorId !== userId && !notifiedSet.has(task.creatorId)) {
        notifyOthers.add(task.creatorId);
      }

      for (const recipientId of notifyOthers) {
        const recipient = recipientId === task.assigneeId ? task.assignee : task.creator;
        if (!recipient) continue;

        await prisma.notification.create({
          data: {
            type: 'comment_added',
            title: 'New comment',
            message: `${comment.user.name} commented on "${task.title}"`,
            userId: recipientId,
            taskId: task.id,
            projectId: task.projectId,
          },
        });

        if (recipient.mentionsNotifications) {
          await sendCommentNotificationEmail({
            to: recipient.email,
            recipientName: recipient.name,
            commenterName: comment.user.name,
            taskTitle: task.title,
            commentContent: content,
            taskUrl: `${process.env.FRONTEND_URL}/projects/${task.projectId}?taskId=${task.id}`,
          });
        }
      }
    }

    res.status(201).json({ success: true, data: comment });
  } catch (err) {
    next(err);
  }
});

// ─── Update comment ───────────────────────────────────────────────────────────
router.put('/:id', async (req, res, next) => {
  try {
    const { content } = z.object({ content: z.string().min(1).max(5000) }).parse(req.body);
    const comment = await prisma.comment.findUnique({ where: { id: req.params.id } });

    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });
    if (comment.userId !== req.user!.id) {
      return res.status(403).json({ success: false, message: 'Can only edit your own comments' });
    }

    const updated = await prisma.comment.update({
      where: { id: req.params.id },
      data: { content },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// ─── Delete comment ───────────────────────────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
  try {
    const comment = await prisma.comment.findUnique({ where: { id: req.params.id } });
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });
    if (comment.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await prisma.comment.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
