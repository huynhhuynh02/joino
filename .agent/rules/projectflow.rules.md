# ProjectFlow — Agent Rules

---

## 🐳 Docker-First Execution Rules

> **CRITICAL**: This project runs entirely inside Docker. NEVER run `npm install`, `npx`, `node`, or `prisma` directly on the host machine. ALL commands must go through `docker-compose exec` or `docker-compose run`.

### Command Patterns

```bash
# ✅ CORRECT — Run inside Docker containers
docker-compose exec backend npm install
docker-compose exec backend npx prisma migrate dev --name <name>
docker-compose exec backend npx prisma db seed
docker-compose exec backend npx prisma studio
docker-compose exec frontend npm install
docker-compose exec frontend npm run build

# ✅ Container shell access
docker-compose exec backend sh
docker-compose exec frontend sh
docker-compose exec db psql -U admin -d projectflow

# ✅ View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# ✅ Start all services
docker-compose up -d
docker-compose up -d --build   # rebuild image first

# ✅ Restart single service
docker-compose restart backend

# ❌ WRONG — Never run directly on host
npm install          # ❌
npx prisma migrate   # ❌
node src/index.ts    # ❌
```

### Verification Checklist (after changes)
1. `docker-compose ps` — all services are Up/healthy
2. `docker-compose logs -f backend` — no crash errors
3. `docker-compose exec backend npx prisma migrate status` — migrations are applied
4. Hit `http://localhost:4000/health` — returns `{ status: "ok" }`
5. Open `http://localhost:3000` — frontend loads
6. Open `http://localhost:8025` — MailHog UI accessible

### When Adding npm Packages
```bash
# Backend
docker-compose exec backend npm install <package>
docker-compose restart backend   # hot reload usually handles it, but restart to be safe

# Frontend
docker-compose exec frontend npm install <package>
```

### When Editing Schema (Prisma)
```bash
# After changing prisma/schema.prisma:
docker-compose exec backend npx prisma migrate dev --name describe_change
docker-compose exec backend npx prisma generate
docker-compose restart backend
```

---


## Project Context
**ProjectFlow** là ứng dụng quản lý dự án nội bộ (Wrike clone).
- **Monorepo**: `/backend/` và `/frontend/` trong cùng root
- **Backend**: Node.js + Express + Prisma + PostgreSQL
- **Frontend**: Next.js 15 + shadcn/ui + Tailwind CSS
- **Infrastructure**: Docker Compose
- **Primary Color**: `#00A86B` (Emerald Green)

---

## 📏 Code Style Rules

### TypeScript (Both FE & BE)
- **ALWAYS** use TypeScript strict mode
- **NEVER** use `any` type — use `unknown` or proper types
- **ALWAYS** define interfaces/types for API request/response bodies
- Use `const` by default, `let` only when reassignment needed
- Use descriptive variable names (no `x`, `tmp`, `data2`)
- Import types with `import type { ... }` when only used for typing
- Maintain a `types/index.ts` for shared types

### Naming Conventions
```
Files:       kebab-case        (task-service.ts, user-card.tsx)
Variables:   camelCase         (taskList, projectId)
Functions:   camelCase         (createTask, getUserById)
Classes:     PascalCase        (TaskService, UserController)
Constants:   SCREAMING_SNAKE   (MAX_FILE_SIZE, JWT_EXPIRES_IN)
DB Tables:   snake_case        (project_members, task_comments)
DB Columns:  snake_case        (created_at, project_id)
Prisma:      camelCase         (createdAt, projectId) — Prisma maps automatically
React Comp:  PascalCase        (TaskCard, ProjectHeader)
CSS Classes: kebab-case        (task-card, project-header)
```

---

## 🔌 API Design Rules

### URL Structure
```
GET    /api/[resource]           → list all
POST   /api/[resource]           → create one
GET    /api/[resource]/:id       → get one
PUT    /api/[resource]/:id       → update one (full or partial)
DELETE /api/[resource]/:id       → delete one

# Nested resources (when resource belongs to parent):
GET    /api/projects/:id/tasks   → list tasks of project
POST   /api/projects/:id/tasks   → create task in project
```

### Response Format — ALWAYS follow this:
```typescript
// Success (single resource)
{ "success": true, "data": { ...resource } }

// Success (list)
{ "success": true, "data": [...], "meta": { "total": 100, "page": 1 } }

// Created (201)
{ "success": true, "data": { ...newResource }, "message": "Created successfully" }

// Error (4xx/5xx)
{ "success": false, "message": "Human-readable error", "errors": [] }

// Validation Error (400)
{
  "success": false,
  "message": "Validation error",
  "errors": [{ "field": "email", "message": "Invalid email" }]
}
```

### HTTP Status Codes
- `200 OK` — Successful GET, PUT
- `201 Created` — Successful POST
- `204 No Content` — Successful DELETE
- `400 Bad Request` — Validation error
- `401 Unauthorized` — Not authenticated
- `403 Forbidden` — Not authorized (wrong role)
- `404 Not Found` — Resource not found
- `409 Conflict` — Duplicate resource
- `500 Internal Server Error` — Unexpected error

---

## 🗄️ Database Rules

### Prisma Schema Conventions
- All models have `id String @id @default(cuid())`
- All models have `createdAt DateTime @default(now())`
- Mutable models have `updatedAt DateTime @updatedAt`
- Foreign keys are named `[model]Id` (e.g., `projectId`, `userId`)
- Relations must be explicitly defined on both sides
- Composite unique constraints use `@@unique([field1, field2])`

### Migration Rules
- **NEVER** edit existing migrations — create new ones
- Migration names should be descriptive: `add_task_priority_field`
- Run migrations in CI/Docker entrypoint, not manually
- Always create seed data for development (`prisma/seed.ts`)

### Query Performance Rules
- Always use `select` or `include` — avoid fetching entire models
- Use `take` and `skip` for pagination (default `take: 50`)
- Add database indexes for frequently queried fields:
  ```prisma
  @@index([projectId, status])
  @@index([assigneeId, dueDate])
  ```

---

## 🔐 Security Rules

### Authentication
- All API routes MUST be protected with `authenticate` middleware
- JWT tokens expire in `7d` — store only in memory or httpOnly cookie (not localStorage for production)
- For dev, localStorage is acceptable
- Passwords MUST be hashed with bcrypt (saltRounds: 12)
- NEVER store plain text passwords

### Authorization (RBAC)
```
ADMIN    → Full access to everything
MANAGER  → Create/edit/delete in their projects
MEMBER   → Create/edit their own tasks, view all
VIEWER   → Read-only access
```
- Check project membership before allowing task access
- Use `requireRole('ADMIN', 'MANAGER')` middleware for destructive operations

### Input Validation
- ALL incoming request bodies MUST be validated with Zod
- Sanitize all string inputs (strip HTML, limit lengths)
- Use parameterized queries (Prisma handles this automatically)
- Rate limit all auth endpoints: `15 requests per 15 minutes`

### File Upload Rules
- Allowed types: images, PDFs, Word, Excel, txt, zip (whitelist approach)
- Max file size: 10MB per file
- Store files in `/uploads/[projectId]/[year]/[month]/[filename]`
- Generate unique filenames: `[timestamp]-[uuid].[ext]`
- NEVER execute uploaded files

---

## 🎨 Frontend Rules

### State Management
- **TanStack Query** for ALL server state (API data)
- **Zustand** for UI state only (modal open/close, selected IDs, sidebar)
- **NEVER** use useState for data that comes from the API
- **NEVER** use Context for data that TanStack Query can handle

### Component Rules
- Keep components under 200 lines — split if larger
- Props must be typed with TypeScript interfaces
- Always add `aria-label` to icon-only buttons
- Use `loading` state for async operations (show Skeleton components)
- Handle error states explicitly (show error message, not blank screen)

### Styling Rules
- Use **Tailwind classes only** — no inline styles, no custom CSS files unless absolutely necessary
- Use **shadcn/ui primitives** as base — don't reinvent buttons, inputs, dialogs
- Follow **green theme**: primary actions use `bg-primary` (`#00A86B`)
- Hover states: `hover:bg-primary-dark`
- Focus visible: `focus-visible:ring-primary`
- Responsive: mobile-first (`md:`, `lg:` breakpoints)

### Performance Rules
- Import shadcn components individually (tree-shaking)
- Use `'use client'` directive only when necessary
- Prefer Server Components for data-fetch-only components
- Use `next/image` for all images
- Lazy load heavy views (Gantt) with `dynamic(() => import(...))`

---

## 📧 Email Rules

### When to Send Emails
- Task assigned → Notify assignee
- Comment added → Notify task assignee + creator
- Task overdue → Daily digest (future)
- Welcome email → On user registration

### Email Service Pattern
```typescript
// Always use the email service, never nodemailer directly
import { emailService } from '@/utils/email';

await emailService.sendTaskAssignment({
  to: assignee.email,
  assigneeName: assignee.name,
  taskTitle: task.title,
  projectName: project.name,
  taskUrl: `http://localhost:3000/projects/${project.id}`,
});
```

### Dev Email Testing
- All emails go to **MailHog** in development
- MailHog dashboard: `http://localhost:8025`
- NEVER send real emails in development

---

## 🚫 Prohibited Patterns

1. **No raw SQL** — always use Prisma ORM
2. **No `console.log` in production code** — use a logger
3. **No hardcoded URLs** — use environment variables
4. **No hardcoded credentials** — use `.env` files
5. **No direct DOM manipulation** in React components
6. **No `!important` in CSS** — fix specificity properly
7. **No skipping TypeScript errors** with `@ts-ignore` — fix them
8. **No storing sensitive data in localStorage** in production

---

## ✅ Definition of Done (DoD)

A feature is "done" when:
- [ ] Backend API works and returns correct response format
- [ ] Frontend component renders correctly
- [ ] Loading states are handled (Skeleton/Spinner)
- [ ] Error states are handled (toast notification or error message)
- [ ] TypeScript has no errors (`tsc --noEmit` passes)
- [ ] Responsive on mobile (375px) and desktop (1440px)
- [ ] Docker containers still start successfully
