import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();
router.use(authenticate);

function checkOverdue(dueDate: string | Date | null, status: string): boolean {
  if (!dueDate || status === 'DONE') return false;
  return new Date(dueDate).getTime() < new Date().setHours(0,0,0,0);
}

// ─── Workload ─────────────────────────────────────────────────────────────
router.get('/workload', async (req, res, next) => {
  try {
    const userId = req.user!.id;

    // Lấy các project mà user là thành viên
    const projects = await prisma.project.findMany({
      where: { members: { some: { userId } } },
      select: { id: true }
    });
    
    const projectIds = projects.map(p => p.id);

    // Group task count by assignee and status
    const tasks = await prisma.task.findMany({
      where: { projectId: { in: projectIds }, assigneeId: { not: null } },
      select: {
        status: true,
        assignee: { select: { id: true, name: true, avatar: true } }
      }
    });

    const workloadMap: Record<string, { user: any; todo: number; inProgress: number; review: number; done: number; total: number }> = {};

    for (const t of tasks) {
      if (!t.assignee) continue;
      if (!workloadMap[t.assignee.id]) {
        workloadMap[t.assignee.id] = { user: t.assignee, todo: 0, inProgress: 0, review: 0, done: 0, total: 0 };
      }
      
      workloadMap[t.assignee.id].total++;
      if (t.status === 'TODO') workloadMap[t.assignee.id].todo++;
      else if (t.status === 'IN_PROGRESS') workloadMap[t.assignee.id].inProgress++;
      else if (t.status === 'REVIEW') workloadMap[t.assignee.id].review++;
      else if (t.status === 'DONE') workloadMap[t.assignee.id].done++;
    }

    res.json({ success: true, data: Object.values(workloadMap) });
  } catch (err) { next(err); }
});

// ─── Completion over time ──────────────────────────────────────────────────
router.get('/progress', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const { days = '30' } = req.query;
    const numDays = parseInt(days as string, 10);

    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - numDays);

    const projects = await prisma.project.findMany({
      where: { members: { some: { userId } } },
      select: { id: true }
    });
    const projectIds = projects.map(p => p.id);

    // Giả lập activity log 'status_changed' to DONE, OR task updatedAt
    const logs = await prisma.activity.findMany({
      where: {
        task: { projectId: { in: projectIds } },
        action: 'status_changed',
        createdAt: { gte: fromDate }
      },
      select: { createdAt: true, details: true }
    });

    const completedByDate: Record<string, number> = {};
    for (let i = numDays; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      completedByDate[d.toISOString().split('T')[0]] = 0;
    }

    logs.forEach(log => {
      const details = log.details as { to?: string };
      if (details.to === 'DONE') {
        const dateStr = new Date(log.createdAt).toISOString().split('T')[0];
        if (completedByDate[dateStr] !== undefined) {
          completedByDate[dateStr]++;
        }
      }
    });

    const data = Object.keys(completedByDate).sort().map(date => ({
      date,
      count: completedByDate[date]
    }));

    res.json({ success: true, data });
  } catch(err) { next(err); }
});

// ─── Status Distribution ───────────────────────────────────────────────────
router.get('/status', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const projects = await prisma.project.findMany({
      where: { members: { some: { userId } } },
      select: { id: true }
    });
    
    const projectIds = projects.map(p => p.id);
    
    const tasks = await prisma.task.groupBy({
      by: ['status'],
      where: { projectId: { in: projectIds } },
      _count: true
    });

    let total = 0;
    const distribution = tasks.map(t => {
      total += t._count;
      return { status: t.status, count: t._count };
    });

    res.json({ success: true, data: { total, distribution } });
  } catch(err) { next(err); }
});

// ─── Overdue Tasks ─────────────────────────────────────────────────────────
router.get('/overdue', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const projects = await prisma.project.findMany({
      where: { members: { some: { userId } } },
      select: { id: true }
    });
    const projectIds = projects.map(p => p.id);

    const now = new Date();
    // Overdue: due date in past AND NOT DONE
    const tasks = await prisma.task.findMany({
      where: {
        projectId: { in: projectIds },
        status: { not: 'DONE' },
        dueDate: { lt: now, not: null }
      },
      select: {
        id: true, title: true, status: true, priority: true, dueDate: true,
        assignee: { select: { id: true, name: true, avatar: true } },
        project: { select: { id: true, name: true, color: true } }
      },
      orderBy: { dueDate: 'asc' },
      take: 50
    });

    res.json({ success: true, data: tasks });
  } catch(err) { next(err); }
});

// ─── Time Summary ─────────────────────────────────────────────────────────────
router.get('/time-summary', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const projects = await prisma.project.findMany({
      where: { members: { some: { userId } } },
      select: { id: true, name: true, color: true }
    });
    const projectIds = projects.map(p => p.id);

    const timeLogs = await prisma.timeLog.findMany({
      where: { task: { projectId: { in: projectIds } } },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        task: { select: { projectId: true } }
      }
    });

    // By project
    const byProject: Record<string, { project: any; hours: number }> = {};
    projects.forEach(p => { byProject[p.id] = { project: p, hours: 0 }; });
    timeLogs.forEach(l => {
      if (byProject[l.task.projectId]) {
        byProject[l.task.projectId].hours += l.hours;
      }
    });

    // By member
    const byMember: Record<string, { user: any; hours: number }> = {};
    timeLogs.forEach(l => {
      if (!byMember[l.userId]) {
        byMember[l.userId] = { user: l.user, hours: 0 };
      }
      byMember[l.userId].hours += l.hours;
    });

    res.json({
      success: true,
      data: {
        totalHours: timeLogs.reduce((sum, l) => sum + l.hours, 0),
        byProject: Object.values(byProject).filter(p => p.hours > 0).sort((a, b) => b.hours - a.hours),
        byMember: Object.values(byMember).sort((a, b) => b.hours - a.hours),
      }
    });
  } catch(err) { next(err); }
});

export default router;
