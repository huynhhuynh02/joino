import { prisma } from '../config/database';
import { sendEmail, APP_URL } from '../config/email';

let lastRunDate: string | null = null;

export class DigestService {
  static startScheduler() {
    console.log('📬 [DIGEST] Email digest scheduler started.');
    
    // Check every 30 minutes
    setInterval(async () => {
      try {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const hour = now.getHours();

        // Run at 8:00 AM (8:00 or 8:30 depending on when it hits)
        if (hour === 8 && lastRunDate !== todayStr) {
          lastRunDate = todayStr;
          await this.sendDailyDigests();
        }
      } catch (error) {
        console.error('❌ [DIGEST ERROR]', error);
      }
    }, 30 * 60 * 1000);
    
    // Optional: Allow manual trigger via internal call
  }

  static async sendDailyDigests() {
    console.log('📬 [DIGEST] Starting daily digest generation...');
    
    // Find users who have tasks that are overdue or due today
    const users = await prisma.user.findMany({
      where: { 
        isActive: true,
        dailySummary: true 
      },
      include: {
        assignedTasks: {
          where: {
            status: { not: 'DONE' },
            OR: [
              { dueDate: { not: null, lte: new Date() } }, // Overdue or Due Today
              { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } // Newly assigned in last 24h
            ]
          },
          include: { project: true },
          orderBy: { dueDate: 'asc' }
        }
      }
    });

    for (const user of users) {
      if (user.assignedTasks.length > 0) {
        console.log(`📬 [DIGEST] Sending to ${user.email} (${user.assignedTasks.length} tasks)`);
        await this.sendUserDigest(user);
      }
    }
    
    console.log('✅ [DIGEST] All digests sent.');
  }

  private static async sendUserDigest(user: any) {
    const overdue = user.assignedTasks.filter((t: any) => t.dueDate && new Date(t.dueDate) < new Date());
    const dueSoon = user.assignedTasks.filter((t: any) => t.dueDate && new Date(t.dueDate) >= new Date() && new Date(t.dueDate) <= new Date(Date.now() + 24 * 60 * 60 * 1000));
    const newlyAssigned = user.assignedTasks.filter((t: any) => t.createdAt >= new Date(Date.now() - 24 * 60 * 60 * 1000));

    const html = `
      <div style="font-family: Inter, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; color: #1a202c; line-height: 1.5;">
        <div style="background: #00A86B; padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px; letter-spacing: -0.5px;">Joino</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">Your Daily Summary — ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div style="padding: 32px; background: #ffffff; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
          <h2 style="font-size: 20px; margin: 0 0 24px;">Hi ${user.name},</h2>
          
          <p style="color: #64748b; margin-bottom: 24px;">Here is an overview of your active tasks that need attention:</p>

          ${overdue.length > 0 ? `
            <div style="margin-bottom: 32px;">
              <h3 style="font-size: 14px; text-transform: uppercase; color: #ef4444; letter-spacing: 0.05em; margin-bottom: 12px;">🔴 Overdue</h3>
              ${overdue.map((t: any) => this.renderTaskRow(t)).join('')}
            </div>
          ` : ''}

          ${dueSoon.length > 0 ? `
            <div style="margin-bottom: 32px;">
              <h3 style="font-size: 14px; text-transform: uppercase; color: #f59e0b; letter-spacing: 0.05em; margin-bottom: 12px;">🟡 Due Today / Soon</h3>
              ${dueSoon.map((t: any) => this.renderTaskRow(t)).join('')}
            </div>
          ` : ''}

          ${newlyAssigned.length > 0 ? `
            <div style="margin-bottom: 32px;">
              <h3 style="font-size: 14px; text-transform: uppercase; color: #3b82f6; letter-spacing: 0.05em; margin-bottom: 12px;">🔵 Newly Assigned</h3>
              ${newlyAssigned.map((t: any) => this.renderTaskRow(t)).join('')}
            </div>
          ` : ''}

          <div style="text-align: center; margin-top: 40px; padding-top: 24px; border-top: 1px solid #f1f5f9;">
            <a href="${APP_URL}/dashboard" style="display: inline-block; background: #00A86B; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(0, 168, 107, 0.2);">
              Open My Dashboard
            </a>
          </div>
        </div>

        <div style="text-align: center; padding: 24px; color: #94a3b8; font-size: 12px;">
          <p>© 2026 Joino — Modern Project Management</p>
          <p style="margin-top: 8px;">You are receiving this because you are an active member of your workspace.</p>
        </div>
      </div>
    `;

    await sendEmail({
      to: user.email,
      subject: `[Joino] Daily Summary: ${user.assignedTasks.length} tasks remain`,
      html
    });
  }

  private static renderTaskRow(task: any) {
    const taskUrl = `${APP_URL}/projects/${task.projectId}?task=${task.id}`;
    return `
      <div style="background: #f8fafc; border-radius: 8px; padding: 12px 16px; margin-bottom: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div style="flex: 1;">
            <a href="${taskUrl}" style="text-decoration: none; font-weight: 600; color: #1a202c; font-size: 15px;">${task.title}</a>
            <div style="font-size: 12px; color: #64748b; margin-top: 2px;">
              Project: ${task.project.name}
              ${task.dueDate ? ` — Due: ${new Date(task.dueDate).toLocaleDateString()}` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
