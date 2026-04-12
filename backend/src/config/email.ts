import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: Number(process.env.SMTP_PORT) || 1025,
  secure: false, // MailHog doesn't use TLS
  ignoreTLS: true,
});

export const FROM_EMAIL = process.env.SMTP_FROM || 'noreply@joino.local';
export const APP_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  try {
    const info = await transporter.sendMail({
      from: `"Joino" <${FROM_EMAIL}>`,
      to,
      subject,
      html,
    });
    console.log(`✅ [MAIL LOG] Email sent successfully to: ${to} (Subject: ${subject})`);
    if (info.messageId) {
      console.log(`   Message ID: ${info.messageId}`);
    }
    console.log(`💡 You can view intercepted emails at: http://localhost:8025`);
  } catch (error) {
    console.error('❌ [MAIL LOG] Failed to send email:', error);
    // Don't throw — email failure should not break main flow
  }
}

// ─── Email Templates ──────────────────────────────────────────────────────────

export async function sendTaskAssignedEmail({
  to,
  assigneeName,
  taskTitle,
  projectName,
  taskUrl,
}: {
  to: string;
  assigneeName: string;
  taskTitle: string;
  projectName: string;
  taskUrl: string;
}) {
  await sendEmail({
    to,
    subject: `[Joino] New task assigned: ${taskTitle}`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #00A86B; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Joino</h1>
        </div>
        <div style="padding: 32px; background: #fff; border: 1px solid #e2e8f0;">
          <p style="font-size: 16px; color: #1a202c;">Hi <strong>${assigneeName}</strong>,</p>
          <p style="color: #64748b;">A new task has been assigned to you:</p>
          <div style="background: #f8fafb; border-left: 4px solid #00A86B; padding: 16px; margin: 16px 0; border-radius: 0 8px 8px 0;">
            <p style="margin: 0; font-weight: 600; color: #1a202c;">${taskTitle}</p>
            <p style="margin: 4px 0 0; color: #64748b; font-size: 14px;">Project: ${projectName}</p>
          </div>
          <a href="${taskUrl}" style="display: inline-block; background: #00A86B; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">
            View Task
          </a>
        </div>
        <p style="text-align: center; color: #94a3b8; font-size: 12px; padding: 16px;">
          &copy; 2026 Joino. All rights reserved.
        </p>
      </div>
    `,
  });
}

export async function sendCommentNotificationEmail({
  to,
  recipientName,
  commenterName,
  taskTitle,
  commentContent,
  taskUrl,
}: {
  to: string;
  recipientName: string;
  commenterName: string;
  taskTitle: string;
  commentContent: string;
  taskUrl: string;
}) {
  await sendEmail({
    to,
    subject: `[Joino] New comment on: ${taskTitle}`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #00A86B; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Joino</h1>
        </div>
        <div style="padding: 32px; background: #fff; border: 1px solid #e2e8f0;">
          <p style="font-size: 16px; color: #1a202c;">Hi <strong>${recipientName}</strong>,</p>
          <p style="color: #64748b;"><strong>${commenterName}</strong> commented on <strong>${taskTitle}</strong>:</p>
          <div style="background: #f8fafb; border: 1px solid #e2e8f0; padding: 16px; margin: 16px 0; border-radius: 8px;">
            <p style="margin: 0; color: #1a202c;">${commentContent}</p>
          </div>
          <a href="${taskUrl}" style="display: inline-block; background: #00A86B; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">
            View Task
          </a>
        </div>
        <p style="text-align: center; color: #94a3b8; font-size: 12px; padding: 16px;">
          &copy; 2026 Joino. All rights reserved.
        </p>
      </div>
    `,
  });
}

export async function sendWelcomeEmail({
  to,
  name,
}: {
  to: string;
  name: string;
}) {
  await sendEmail({
    to,
    subject: `Welcome to Joino, ${name}!`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #00A86B; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Joino</h1>
        </div>
        <div style="padding: 32px; background: #fff; border: 1px solid #e2e8f0; text-align: center;">
          <h2 style="color: #1a202c;">Welcome to Joino! 🎉</h2>
          <p style="color: #64748b;">Hi <strong>${name}</strong>, your account has been created successfully.</p>
          <p style="color: #64748b;">Start managing your projects, tasks, and team collaboration all in one place.</p>
          <a href="${APP_URL}" style="display: inline-block; background: #00A86B; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">
            Go to Dashboard
          </a>
        </div>
      </div>
    `,
  });
}

export async function sendInviteEmail({
  to,
  inviterName,
  role,
  token,
}: {
  to: string;
  inviterName: string;
  role: string;
  token: string;
}) {
  const acceptUrl = `${APP_URL}/accept-invite?token=${token}`;

  try {
    const info = await transporter.sendMail({
      from: `"Joino" <${FROM_EMAIL}>`,
      to,
      subject: `[Joino] ${inviterName} invited you to join the workspace`,
      html: `
        <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #00A86B; padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Joino</h1>
          </div>
          <div style="padding: 32px; background: #fff; border: 1px solid #e2e8f0; text-align: center;">
            <h2 style="color: #1a202c;">You've been invited! 🎉</h2>
            <p style="color: #64748b;"><strong>${inviterName}</strong> has invited you to join their Joino workspace as a <strong>${role}</strong>.</p>
            <p style="color: #64748b; margin-top: 16px;">Click the button below to set up your account and get started.</p>
            <a href="${acceptUrl}" style="display: inline-block; background: #00A86B; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 24px;">
              Accept Invitation
            </a>
          </div>
        </div>
      `,
    });
    console.log(`✅ [MAIL LOG] Email sent successfully to: ${to} (Subject: Invite)`);
    if (info.messageId) {
      console.log(`   Message ID: ${info.messageId}`);
    }
  } catch (error) {
    console.error('❌ [MAIL LOG] Failed to send email:', error);
  }
}

export async function sendResetPasswordEmail({
  to,
  name,
  token,
}: {
  to: string;
  name: string;
  token: string;
}) {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;

  await sendEmail({
    to,
    subject: '[Joino] Reset your password',
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #00A86B; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Joino</h1>
        </div>
        <div style="padding: 32px; background: #fff; border: 1px solid #e2e8f0; text-align: center;">
          <h2 style="color: #1a202c;">Reset your password</h2>
          <p style="color: #64748b;">Hi <strong>${name}</strong>, we received a request to reset your password.</p>
          <p style="color: #64748b; margin-top: 16px;">Click the button below to choose a new password. This link will expire in 1 hour.</p>
          <a href="${resetUrl}" style="display: inline-block; background: #00A86B; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 24px;">
            Reset Password
          </a>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">If you didn't request a password reset, you can safely ignore this email.</p>
        </div>
      </div>
    `,
  });
}
