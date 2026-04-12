import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { rateLimit } from 'express-rate-limit';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/users.routes';
import projectRoutes from './routes/projects.routes';
import taskRoutes from './routes/tasks.routes';
import commentRoutes from './routes/comments.routes';
import attachmentRoutes from './routes/attachments.routes';
import notificationRoutes from './routes/notifications.routes';
import labelRoutes from './routes/labels.routes';
import searchRoutes from './routes/search.routes';
import reportsRoutes from './routes/reports.routes';
import customFieldRoutes from './routes/custom-fields.routes';
import settingsRoutes from './routes/settings.routes';
import { errorHandler } from './middlewares/error.middleware';
import { DigestService } from './services/digest.service';

const app = express();
const PORT = process.env.PORT || 4000;

// ─── Security Middleware ─────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false, // Disable in dev to avoid blocking local resources
}));
app.use(cors({
  origin: true,
  credentials: true,
}));

// ─── Body Parsing ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Static Files (uploads) ──────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ─── Rate Limiting ───────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Increased for dev
  message: { success: false, message: 'Too many requests, please try again later.' },
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000, // Increased for dev
  message: { success: false, message: 'Too many requests, please try again later.' },
});

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', apiLimiter, userRoutes);
app.use('/api/projects', apiLimiter, projectRoutes);
app.use('/api/tasks', apiLimiter, taskRoutes);
app.use('/api/comments', apiLimiter, commentRoutes);
app.use('/api/attachments', apiLimiter, attachmentRoutes);
app.use('/api/notifications', apiLimiter, notificationRoutes);
app.use('/api/labels', apiLimiter, labelRoutes);
app.use('/api/search', apiLimiter, searchRoutes);
app.use('/api/reports', apiLimiter, reportsRoutes);
app.use('/api/custom-fields', apiLimiter, customFieldRoutes);
app.use('/api/settings', apiLimiter, settingsRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Manual trigger for testing (DEV ONLY)
app.get('/debug/send-digests', async (_req, res) => {
  await DigestService.sendDailyDigests();
  res.json({ message: 'Digests triggered' });
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Joino API running on http://localhost:${PORT}`);
  console.log(`📚 Health check: http://localhost:${PORT}/health`);
  
  // Start the background scheduler
  DigestService.startScheduler();
});

export default app;
