import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticate } from '../middlewares/auth.middleware';
import { askGemini } from '../services/ai.service';
import { requireProjectAccess } from '../middlewares/rbac.middleware';

const router = Router();
router.use(authenticate);

// 1. Task Generator (Magic Wand 🪄)
router.post('/generate-task', async (req, res, next) => {
  try {
    const { prompt } = z.object({ prompt: z.string().min(5) }).parse(req.body);

    const systemPrompt = `
      You are an expert Project Manager. You will be given a short request from a user to create a task.
      You must expand on this task and return ONLY a valid JSON object matching this schema exactly without markdown wrapping:
      {
        "title": "A professional and slightly expanded task title",
        "description": "A detailed multi-paragraph description with clear goals. You can use HTML formatting (<ul>, <b>, etc).",
        "priority": "LOW" | "NORMAL" | "HIGH" | "URGENT",
        "subtasks": ["Actionable subtask 1", "Actionable subtask 2"]
      }

      User Request: "${prompt}"
    `;

    const rawResponse = await askGemini(systemPrompt, true);
    
    // Parse the JSON (Gemini usually returns clean JSON when jsonMode is true)
    let aiData;
    try {
      const cleanJson = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      aiData = JSON.parse(cleanJson);
    } catch (e) {
      return res.status(500).json({ success: false, message: 'AI returned invalid data format' });
    }

    res.json({ success: true, data: aiData });
  } catch (err: any) {
    console.error('[AI ROUTE ERROR] GenerateTask:', err.message);
    if (err.message.includes('GEMINI_API_KEY')) {
      return res.status(400).json({ success: false, message: 'Gemini API Key is missing on the server.' });
    }
    next(err);
  }
});

// 2. Summarize Task Comments
router.post('/summarize-task/:taskId', async (req, res, next) => {
  try {
    const { taskId } = req.params;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        comments: {
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    if (task.comments.length === 0) return res.json({ success: true, data: "No comments to summarize." });

    const conversationDetails = task.comments.map(c => `[${c.user.name}]: ${c.content}`).join('\n');

    const prompt = `
      Please summarize the following conversation from a task ticket titled "${task.title}".
      Your summary should be extremely concise (maximum 3 bullet points). Focus on decisions made, pending blockers, and actionable next steps.
      Output ONLY the brief summary.
      
      Conversation:
      ${conversationDetails}
    `;

    const summary = await askGemini(prompt, false);
    res.json({ success: true, data: summary });
  } catch (err: any) {
    console.error('[AI ROUTE ERROR] Summarize:', err.message);
    if (err.message.includes('GEMINI_API_KEY')) {
      return res.status(400).json({ success: false, message: 'Gemini API Key is missing on the server.' });
    }
    if (err.message.includes('429')) {
      return res.status(429).json({ success: false, message: 'AI service is currently overloaded. Please try again later.' });
    }
    next(err);
  }
});

// 3. Daily Standup Report
router.get('/report/:projectId', requireProjectAccess(), async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const tasks = await prisma.task.findMany({
      where: { projectId },
      include: { assignee: { select: { name: true } } }
    });

    const tasksStr = tasks.map(t => 
      `- [${t.status}] ${t.title} ${t.assignee ? `(Assigned to: ${t.assignee.name})` : '(Unassigned)'}`
    ).join('\n');

    const prompt = `
      You are an Agile Scrum Master. Below is the current state of tasks in our project.
      Please write a "Daily Standup Report" for the team. 
      Format it beautifully with 3 sections: 
      1. completed work (Done)
      2. work in progress (In Progress / Review)
      3. Upcoming (To Do).
      Keep the tone professional and encouraging. 
      Output should be plain text or basic Markdown.
      
      Tasks context:
      ${tasksStr}
    `;

    const report = await askGemini(prompt, false);

    res.json({ success: true, data: report });
  } catch (err: any) {
     if (err.message.includes('GEMINI_API_KEY')) {
      return res.status(400).json({ success: false, message: 'Gemini API Key is missing on the server.' });
    }
    next(err);
  }
});

// 4. Red Flag Risk Analysis
router.get('/risks/:projectId', requireProjectAccess(), async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const tasks = await prisma.task.findMany({
      where: { projectId, status: { not: 'DONE' } },
      include: { assignee: { select: { name: true } } }
    });

    const tasksStr = tasks.map(t => 
      `- ${t.title} | Status: ${t.status} | Priority: ${t.priority} | Due: ${t.dueDate || 'None'}`
    ).join('\n');

    const prompt = `
      You are a Project Risk Analyst. Analyze the pending tasks provided below.
      Identify any "Red Flags" or risks (e.g. high priority tasks lacking a due date, tasks stuck in 'IN_PROGRESS' for long periods, 
      or too many urgent tasks compared to normal ones).
      
      Write a stark, warning-focused analysis in 2-3 brief paragraphs detailing exactly what is at risk of missing deadlines. 
      Do NOT invent data not in the list. Format as Markdown.
      
      Pending Tasks:
      ${tasksStr}
    `;

    const risks = await askGemini(prompt, false);

    res.json({ success: true, data: risks });
  } catch (err: any) {
     if (err.message.includes('GEMINI_API_KEY')) {
      return res.status(400).json({ success: false, message: 'Gemini API Key is missing on the server.' });
    }
    next(err);
  }
});

export default router;
