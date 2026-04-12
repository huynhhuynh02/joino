# 🚀 Joino — Wrike Clone Implementation Plan

> **Phiên bản v1.0** | Stack: Next.js 15 · Node.js Express · PostgreSQL · Docker  
> **Màu chủ đạo:** Xanh lá cây (`#00A86B`) & Trắng  
> **UI Library:** shadcn/ui  
> **Cập nhật:** 2026-04-11 — Bổ sung đầy đủ chức năng Wrike

---

## 📋 Tổng quan dự án

**Joino** là một ứng dụng web quản lý dự án nội bộ, lấy cảm hứng từ Wrike.com. Dành riêng cho team nhỏ quản lý dự án.

### Phạm vi phiên bản v1.0:
- ✅ Quản lý Projects, Tasks, Subtasks
- ✅ 4 chế độ xem: List, Board (Kanban), Gantt, Table
- ✅ Quản lý thành viên & phân quyền  
- ✅ Dashboard tổng quan  
- ✅ Thông báo & Email notification
- ✅ Comment & Activity log trên tasks
- ✅ File attachment (upload)
- ✅ Google OAuth login
- ❌ SaaS/Multi-tenant (chưa cần)
- ❌ AI features (v2)
- ❌ Integrations bên ngoài (v2)

---

## 🏗️ Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────────┐
│                     Docker Network                       │
│                                                         │
│  ┌──────────────┐    ┌──────────────┐   ┌────────────┐ │
│  │   Frontend   │    │   Backend    │   │  MailHog   │ │
│  │  Next.js 15  │◄──►│  Express.js  │   │  (SMTP)    │ │
│  │  Port: 3000  │    │  Port: 4000  │   │ Port: 8025 │ │
│  └──────────────┘    └──────┬───────┘   └────────────┘ │
│                             │                           │
│                      ┌──────▼───────┐                   │
│                       │ PostgreSQL   │                  │
│                       │  Port: 5432  │                  │
│                       └─────────────┘                   │
└─────────────────────────────────────────────────────────┘
```

### Services:
| Service | Technology | Port | Purpose |
|---------|-----------|------|---------|
| `frontend` | Next.js 15 + shadcn/ui | 3000 | UI/UX |
| `backend` | Node.js + Express + Prisma | 4000 | REST API |
| `db` | PostgreSQL 16 | 5432 | Database |
| `mail` | MailHog | 1025 / 8025 | Dev SMTP + Web UI |

---

## 📁 Cấu trúc thư mục (Monorepo)

```
joino/
├── docker-compose.yml
├── .env.example
├── .gitignore
├── README.md
│
├── backend/                        # Node.js + Express API
│   ├── Dockerfile
│   ├── package.json
│   ├── src/
│   │   ├── index.ts                # Entrypoint
│   │   ├── config/
│   │   │   ├── database.ts         # Prisma client
│   │   │   └── email.ts            # Nodemailer config
│   │   ├── routes/
│   │   │   ├── auth.routes.ts      ✅
│   │   │   ├── users.routes.ts     ✅
│   │   │   ├── workspaces.routes.ts ❌ MISSING
│   │   │   ├── projects.routes.ts  ✅
│   │   │   ├── tasks.routes.ts     ✅
│   │   │   ├── comments.routes.ts  ✅
│   │   │   ├── attachments.routes.ts ✅
│   │   │   ├── notifications.routes.ts ✅
│   │   │   ├── labels.routes.ts    ❌ MISSING
│   │   │   ├── folders.routes.ts   ❌ MISSING
│   │   │   ├── timelog.routes.ts   ❌ MISSING
│   │   │   ├── dashboard.routes.ts ❌ MISSING
│   │   │   └── search.routes.ts    ❌ MISSING
│   │   ├── controllers/            # Route handlers
│   │   ├── services/               # Business logic
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.ts  ✅ JWT verify
│   │   │   ├── rbac.middleware.ts  ✅ Role-based access
│   │   │   └── upload.middleware.ts ✅
│   │   ├── utils/
│   │   │   ├── jwt.ts
│   │   │   └── email.ts
│   │   └── types/
│   └── prisma/
│       ├── schema.prisma           ✅ (cần mở rộng)
│       └── seed.ts                 ✅
│
├── frontend/                       # Next.js 15
│   ├── Dockerfile
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── components.json             # shadcn config
│   └── src/
│       ├── app/
│       │   ├── layout.tsx          ✅
│       │   ├── page.tsx            ✅ Landing/Redirect
│       │   ├── (auth)/
│       │   │   ├── login/page.tsx  ✅
│       │   │   ├── register/page.tsx ✅
│       │   │   ├── forgot-password/page.tsx ✅
│       │   │   ├── reset-password/page.tsx ✅
│       │   │   └── accept-invite/page.tsx ✅
│       │   ├── (app)/
│       │   │   ├── layout.tsx      ✅ App shell (sidebar)
│       │   │   ├── dashboard/page.tsx ✅
│       │   │   ├── my-tasks/page.tsx  ✅ (cần nâng cấp)
│       │   │   ├── inbox/page.tsx     ✅ (cần nâng cấp)
│       │   │   ├── search/page.tsx    ❌ MISSING
│       │   │   ├── favorites/page.tsx ❌ MISSING
│       │   │   ├── projects/
│       │   │   │   ├── page.tsx       ✅
│       │   │   │   └── [id]/
│       │   │   │       ├── page.tsx        ✅ List+Board+Gantt
│       │   │   │       └── table/page.tsx  ❌ MISSING (Table view)
│       │   │   ├── folders/           ❌ MISSING
│       │   │   ├── reports/           ❌ MISSING
│       │   │   ├── team/page.tsx      ✅ (cần nâng cấp)
│       │   │   ├── settings/
│       │   │   │   ├── profile/page.tsx   ❌ MISSING
│       │   │   │   ├── workspace/page.tsx ❌ MISSING
│       │   │   │   └── notifications/page.tsx ❌ MISSING
│       ├── components/
│       │   ├── ui/                 ✅ shadcn components
│       │   ├── layout/
│       │   │   ├── Sidebar.tsx     ✅ (cần nâng cấp)
│       │   │   ├── TopBar.tsx      ✅ (cần nâng cấp)
│       │   │   └── AppShell.tsx    ✅
│       │   ├── projects/
│       │   │   ├── ProjectCard.tsx    ❌ MISSING
│       │   │   ├── ProjectHeader.tsx  ❌ MISSING
│       │   │   └── CreateProjectModal.tsx ✅
│       │   ├── tasks/
│       │   │   ├── TaskListView.tsx    ❌ MISSING (hiện ở [id]/components/)
│       │   │   ├── TaskBoardView.tsx   ❌ MISSING (hiện ở [id]/components/)
│       │   │   ├── TaskGanttView.tsx   ❌ MISSING (hiện ở [id]/components/)
│       │   │   ├── TaskTableView.tsx   ❌ MISSING
│       │   │   ├── TaskCard.tsx        ❌ MISSING
│       │   │   ├── TaskDetailPanel.tsx ✅
│       │   │   ├── CreateTaskModal.tsx ✅
│       │   │   ├── TaskFilters.tsx     ❌ MISSING
│       │   │   └── SubtaskList.tsx     ❌ MISSING (inline)
│       │   ├── dashboard/
│       │   │   ├── StatCard.tsx        ❌ MISSING
│       │   │   ├── RecentActivity.tsx  ❌ MISSING
│       │   │   └── MyTasksWidget.tsx   ❌ MISSING
│       │   ├── comments/
│       │   │   └── CommentThread.tsx   ❌ MISSING (standalone)
│       │   └── common/
│       │       ├── Avatar.tsx          ❌ MISSING
│       │       ├── UserPicker.tsx      ❌ MISSING
│       │       ├── DatePicker.tsx      ❌ MISSING
│       │       ├── PriorityBadge.tsx   ❌ MISSING
│       │       ├── StatusBadge.tsx     ❌ MISSING
│       │       ├── LabelBadge.tsx      ❌ MISSING
│       │       └── SearchBar.tsx       ❌ MISSING
│       ├── lib/
│       │   ├── api.ts              ✅ API client (axios)
│       │   ├── auth.ts             ❌ MISSING
│       │   └── utils.ts            ✅
│       ├── hooks/
│       │   ├── useUser.ts          ❌ MISSING
│       │   ├── useTasks.ts         ❌ MISSING
│       │   ├── useProjects.ts      ❌ MISSING
│       │   └── useNotifications.ts ❌ MISSING
│       ├── stores/                 # Zustand stores
│       │   ├── authStore.ts        ✅
│       │   ├── taskStore.ts        ❌ MISSING
│       │   └── uiStore.ts          ✅
│       └── types/
│           └── index.ts            ❌ MISSING
```

---

## 🗄️ Database Schema (PostgreSQL + Prisma)

### Current Schema (✅ Implemented):
- `User` — auth, profile, relations
- `Project` — name, color, status, dates
- `ProjectMember` — userId + projectId + role
- `Task` — title, status, priority, dates, subtasks via parentId
- `Comment` — task comments
- `Attachment` — file uploads
- `Activity` — task activity log
- `Notification` — in-app notifications

### ❌ MISSING Schema Extensions:

```prisma
// ─── Labels / Tags ────────────────────────────────────────
model Label {
  id        String   @id @default(cuid())
  name      String
  color     String
  projectId String
  createdAt DateTime @default(now())

  project   Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  tasks     TaskLabel[]

  @@map("labels")
}

model TaskLabel {
  taskId  String
  labelId String

  task    Task  @relation(fields: [taskId], references: [id], onDelete: Cascade)
  label   Label @relation(fields: [labelId], references: [id], onDelete: Cascade)

  @@id([taskId, labelId])
  @@map("task_labels")
}

// ─── Folders (Wrike Space/Folder hierarchy) ──────────────
model Folder {
  id          String   @id @default(cuid())
  name        String
  description String?
  color       String   @default("#6B7280")
  projectId   String
  parentId    String?   // Self-relation for nested folders
  position    Int       @default(0)
  createdAt   DateTime @default(now())

  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  parent      Folder?  @relation("FolderParent", fields: [parentId], references: [id])
  children    Folder[] @relation("FolderParent")
  tasks       Task[]   @relation("FolderTasks")

  @@map("folders")
}

// ─── Time Tracking ────────────────────────────────────────
model TimeLog {
  id        String   @id @default(cuid())
  taskId    String
  userId    String
  hours     Float
  note      String?
  loggedAt  DateTime @default(now())

  task      Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id])

  @@index([taskId])
  @@index([userId])
  @@map("time_logs")
}

// ─── Task Dependencies ────────────────────────────────────
model TaskDependency {
  id             String         @id @default(cuid())
  predecessorId  String
  successorId    String
  type           DependencyType @default(FINISH_TO_START)

  predecessor    Task @relation("Predecessors", fields: [predecessorId], references: [id], onDelete: Cascade)
  successor      Task @relation("Successors", fields: [successorId], references: [id], onDelete: Cascade)

  @@unique([predecessorId, successorId])
  @@map("task_dependencies")
}

// ─── Custom Fields ────────────────────────────────────────
model CustomField {
  id        String          @id @default(cuid())
  name      String
  type      CustomFieldType // TEXT, NUMBER, DATE, DROPDOWN, CHECKBOX
  projectId String
  options   Json?           // For DROPDOWN: ["option1", "option2"]
  createdAt DateTime        @default(now())

  project   Project         @relation(fields: [projectId], references: [id], onDelete: Cascade)
  values    CustomFieldValue[]

  @@map("custom_fields")
}

model CustomFieldValue {
  id            String      @id @default(cuid())
  customFieldId String
  taskId        String
  value         String?

  customField   CustomField @relation(fields: [customFieldId], references: [id], onDelete: Cascade)
  task          Task        @relation(fields: [taskId], references: [id], onDelete: Cascade)

  @@unique([customFieldId, taskId])
  @@map("custom_field_values")
}

// ─── Favorites / Pinned items ─────────────────────────────
model Favorite {
  id         String   @id @default(cuid())
  userId     String
  entityType String   // "project" | "task" | "folder"
  entityId   String
  createdAt  DateTime @default(now())

  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, entityType, entityId])
  @@map("favorites")
}

// ─── New Enums ────────────────────────────────────────────
enum DependencyType {
  FINISH_TO_START
  START_TO_START
  FINISH_TO_FINISH
  START_TO_FINISH
}

enum CustomFieldType {
  TEXT
  NUMBER
  DATE
  DROPDOWN
  CHECKBOX
  URL
}

// ─── Extend existing models ───────────────────────────────
// Task: add
//   folderId    String?
//   labels      TaskLabel[]
//   timeLogs    TimeLog[]
//   dependencies TaskDependency[] @relation("Predecessors")
//   dependents   TaskDependency[] @relation("Successors")
//   customValues CustomFieldValue[]
//   estimatedHours Float?
//
// Project: add
//   folders      Folder[]
//   labels       Label[]
//   customFields CustomField[]
//   favorites    Favorite[]
//
// User: add
//   timeLogs     TimeLog[]
//   favorites    Favorite[]
```

---

## 🔌 API Endpoints (REST)

### Auth ✅
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Đăng ký |
| POST | `/api/auth/login` | Đăng nhập |
| POST | `/api/auth/logout` | Đăng xuất |
| GET | `/api/auth/me` | Lấy info user hiện tại |
| PUT | `/api/auth/profile` | Cập nhật profile |
| POST | `/api/auth/forgot-password` | ✅ Gửi reset link |
| POST | `/api/auth/reset-password` | ✅ Đặt lại mật khẩu |
| GET | `/api/auth/google` | Google OAuth redirect |
| GET | `/api/auth/google/callback` | Google OAuth callback |
| POST | `/api/users/accept-invite` | ✅ Chấp nhận lời mời |

### Projects ✅
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | Danh sách projects |
| POST | `/api/projects` | Tạo project |
| GET | `/api/projects/:id` | Chi tiết project |
| PUT | `/api/projects/:id` | Cập nhật project |
| DELETE | `/api/projects/:id` | Xóa project |
| GET | `/api/projects/:id/members` | Danh sách members |
| POST | `/api/projects/:id/members` | Thêm member |
| PUT | `/api/projects/:id/members/:userId` | Cập nhật role |
| DELETE | `/api/projects/:id/members/:userId` | Xóa member |
| GET | `/api/projects/:id/stats` | ❌ Thống kê project |
| GET | `/api/labels/project/:projectId` | ✅ Labels của project |
| POST | `/api/labels/project/:projectId` | ✅ Tạo label |
| PUT | `/api/labels/:id` | ✅ Cập nhật label |
| DELETE | `/api/labels/:id` | ✅ Xóa label |

### Tasks ✅ (cần bổ sung)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks/my-tasks` | Tasks được assign cho tôi |
| GET | `/api/tasks/project/:projectId` | Danh sách tasks theo project |
| GET | `/api/tasks/:id` | Chi tiết task |
| POST | `/api/tasks/project/:projectId` | Tạo task |
| PUT | `/api/tasks/:id` | Cập nhật task |
| PUT | `/api/tasks/:id/reorder` | Reorder (drag & drop) |
| DELETE | `/api/tasks/:id` | Xóa task |
| POST | `/api/labels/task/:taskId/assign/:labelId` | ✅ Gán label cho task |
| DELETE | `/api/labels/task/:taskId/assign/:labelId` | ✅ Bỏ label khỏi task |
| GET | `/api/search/timelogs/my` | ✅ Time logs của task |
| POST | `/api/search/timelogs/task/:taskId` | ✅ Log thời gian |
| POST | `/api/tasks/:id/duplicate` | ✅ Nhân bản task |
| PUT | `/api/tasks/:id/dependencies` | ❌ Thêm task dependency |

### Comments & Files ✅
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks/:id/comments` | Comments của task |
| POST | `/api/tasks/:id/comments` | Thêm comment |
| PUT | `/api/comments/:id` | ✅ Sửa comment |
| DELETE | `/api/comments/:id` | ✅ Xóa comment |
| POST | `/api/tasks/:id/attachments` | Upload file |
| DELETE | `/api/attachments/:id` | Xóa file |

### Notifications ✅
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | Danh sách thông báo |
| PUT | `/api/notifications/:id/read` | Đánh dấu đã đọc |
| PUT | `/api/notifications/read-all` | Đánh dấu tất cả đã đọc |
| DELETE | `/api/notifications/:id` | ❌ Xóa notification |

### Folders ❌ MISSING
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/:id/folders` | Danh sách folders |
| POST | `/api/projects/:id/folders` | Tạo folder |
| PUT | `/api/folders/:id` | Cập nhật folder |
| DELETE | `/api/folders/:id` | Xóa folder |

### Time Tracking ✅
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/search/timelogs/my` | ✅ Logs của tôi |
| POST | `/api/search/timelogs/task/:taskId` | ✅ Log giờ |
| PUT | `/api/timelogs/:id` | ❌ Sửa log |
| DELETE | `/api/search/timelogs/:id` | ✅ Xóa log |
| GET | `/api/projects/:id/timelogs` | ❌ Logs theo project |

### Custom Fields ❌ MISSING
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/:id/custom-fields` | Danh sách custom fields |
| POST | `/api/projects/:id/custom-fields` | Tạo custom field |
| PUT | `/api/custom-fields/:id` | Sửa custom field |
| DELETE | `/api/custom-fields/:id` | Xóa custom field |
| PUT | `/api/tasks/:id/custom-fields` | Cập nhật giá trị |

### Search ✅
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/search?q=` | ✅ Search projects, tasks |

### Dashboard/Reports ❌ MISSING
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/overview` | Tổng quan dashboard |
| GET | `/api/reports/workload` | Báo cáo workload |
| GET | `/api/reports/progress` | Tiến trình project |

### Users ✅ (cần bổ sung)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | Danh sách users |
| GET | `/api/users/:id` | ❌ Chi tiết user |
| PUT | `/api/users/:id` | ❌ Cập nhật user (admin) |
| PUT | `/api/users/me/avatar` | ❌ Upload avatar |

---

## 🎨 UI/UX Design

### Design System (Green & White)
```css
/* Primary Palette */
--color-primary: #00A86B;        /* Emerald Green */
--color-primary-dark: #007A4D;   /* Darker Green */
--color-primary-light: #E6F7F1;  /* Light Green bg */
--color-accent: #00D68F;         /* Bright accent */

/* Neutrals */
--color-background: #FFFFFF;
--color-surface: #F8FAFB;
--color-border: #E2E8F0;
--color-text-primary: #1A202C;
--color-text-secondary: #64748B;

/* Status Colors */
--color-todo: #94A3B8;
--color-in-progress: #3B82F6;
--color-review: #F59E0B;
--color-done: #10B981;

/* Priority Colors */
--color-urgent: #EF4444;
--color-high: #F97316;
--color-medium: #EAB308;
--color-low: #6B7280;
```

### Key Pages & Components:

#### 1. **Sidebar Navigation** ✅ (cần nâng cấp)
- Logo Joino (xanh lá)  
- Quick access: Home, Inbox, My Tasks, Dashboards
- ❌ Favorites section (pin projects/tasks)
- ✅ Search bar trong sidebar
- Projects list (collapsible) ✅
- ❌ Nested folders trong project
- ❌ Keyboard shortcut hints
- User avatar + settings ở dưới ✅

#### 2. **Dashboard** ✅
- Greeting + date ✅
- Stats cards: Total tasks, Overdue, Completed this week ✅
- ✅ Tasks by status chart (Recharts donut)
- ✅ Workload chart (bar chart per member)
- My Tasks (upcoming deadlines) ✅
- Recent Activity feed ✅
- Projects overview grid ✅
- ✅ Due Soon warning banner

#### 3. **Project View** ✅
- Header: Project name + color, members avatars, **+ Add Task** ✅
- View switcher: **List | Board | Gantt | Table** ✅
- ✅ Filter bar: Status, Assignee, Priority, Date range, Label
- ✅ Group By dropdown: Status | Assignee | Priority | Due Date | Label
- ✅ Sort dropdown
- ✅ Bulk select + bulk actions (delete, assign, change status)
- ❌ Column visibility toggle (Table view)
- ❌ Export to CSV (từ project settings)

#### 4. **List View** ✅
- Group by status (Todo, In Progress, Review, Done) ✅
- ✅ Inline editing (click to edit title, assignee, date, priority)
- ✅ Expand row for subtasks inline
- ✅ Collapse/expand status groups
- ✅ Empty state per group với "+ Add task"
- ❌ Drag & drop rows để reorder (future)

#### 5. **Board View** ✅ (cần nâng cấp)
- Columns = Status ✅
- Drag & drop cards (dnd-kit) ✅
- Card: Title, priority badge, assignee avatar, due date ✅
- ❌ Add column (custom status)
- ❌ Limits per column (WIP limit)
- ❌ WIP count badge trên column header
- ❌ Collapse column
- ❌ Quick edit on card hover

#### 6. **Gantt View** ✅ (cần nâng cấp)
- Left panel: Task list ✅
- Right panel: Timeline bars ✅
- ❌ Task dependencies arrows
- ❌ Drag to resize bar (change duration)
- ❌ Drag bar to move dates
- Date range: Week / Month / Quarter ✅
- ❌ Today line indicator
- ❌ Critical path highlight

#### 7. **Table View** ✅
- Spreadsheet-like (Wrike-like Table) ✅
- Cột: Title, Status, Priority, Assignee, Start Date, Due Date, Labels, Custom Fields ✅
- ✅ Inline edit cells
- ❌ Resizable columns
- ✅ Freeze first column (UI sticky)
- ✅ Sort by column header click
- ✅ Add custom field column (dynamic)

#### 8. **Task Detail Panel** ✅
- Slide-out từ phải, 40% width ✅
- Title (editable) ✅
- Status, Priority, Assignee, Due date, Start date ✅
- Description (rich text via Tiptap) ✅
- Attachments ✅
- Subtasks ✅
- Comments (threaded) ✅
- Activity log ✅
- Labels / Tags ✅
- Time tracking (log time button) ✅
- ✅ Custom fields display (dynamic logic)
- ❌ Task dependencies panel (Phase 4C)
- Estimated hours vs logged hours ✅
- ❌ Followers (watchers) — notify on changes
- Copy task link button ✅
- Duplicate task button ✅
- ✅ Move to another project
- ✅ Archive task / Delete task ✅

#### 9. **My Tasks Page** ✅
- Table view (spreadsheet-like) ✅
- ✅ Group by: Today / This Week / Later / No Due Date
- ✅ Filter by project
- ✅ Sort controls
- ✅ Mark complete inline (checkbox)
- ✅ Board view toggle ✅

#### 10. **Inbox / Notifications** ✅
- Hiển thị notifications ✅
- ✅ Filter: All / Unread
- ✅ Mark as read khi click ✅
- ✅ Notification grouping by project
- ✅ Link to task từ notification ✅

#### 11. **Team Page** ✅
- User cards ✅
- ✅ Search/filter members
- ✅ Workload view (task count by status per member)
- ✅ Active tasks count per member
- ✅ Invite member qua email (modal)
- ✅ Admin: change role, deactivate user (RBAC) ✅

#### 12. **Settings Pages** ✅
- Profile Settings:
  - ✅ Update name, avatar upload UI, email
  - ✅ Change password UI
  - ✅ Notification preferences (email digests)
- Workspace Settings (Admin only):
  - ✅ Workspace name & logo
  - ✅ Manage members (invite, role, remove - in Team page)
  - ✅ Danger zone (delete workspace)
- Project Settings:
  - ✅ Rename, change color, change status
  - ✅ Archive / Delete project
  - ✅ Manage custom fields (Tab)
  - ✅ Manage labels (Tab) ✅

#### 13. **Search** ✅
- ✅ Global search bar (Cmd+K shortcut)
- ✅ Search tasks by title & description
- ✅ Search projects
- ✅ Recent searches history
- ✅ Filter results: All / Tasks / Projects / Members ✅

#### 14. **Reports / Analytics** ✅
- ✅ Tasks completed over time (line chart)
- ✅ Workload chart per member
- ✅ Project progress bars (Dashboard & Project Header)
- ✅ Overdue tasks report
- ✅ Time tracking summary ✅

#### 15. **Folder Structure** ❌ MISSING (Wrike Spaces/Folders)
- ❌ Tạo folder trong project
- ❌ Nested folders
- ❌ Move tasks vào folder
- ❌ Folder header + view

---

## 📦 Dependencies

### Backend
```json
{
  "express": "^4.18",
  "prisma": "^5.x",
  "@prisma/client": "^5.x",
  "jsonwebtoken": "^9.x",
  "bcryptjs": "^2.x",
  "nodemailer": "^6.x",
  "multer": "^1.x",
  "zod": "^3.x",
  "cors": "^2.x",
  "helmet": "^7.x",
  "express-rate-limit": "^7.x",
  "passport": "^0.7.x",
  "passport-google-oauth20": "^2.x"
}
```

### Frontend
```json
{
  "next": "^15.x",
  "react": "^19.x",
  "shadcn/ui": "latest",
  "tailwindcss": "^3.x",
  "axios": "^1.x",
  "zustand": "^4.x",
  "@tanstack/react-query": "^5.x",
  "@dnd-kit/core": "^6.x",
  "@dnd-kit/sortable": "^8.x",
  "date-fns": "^3.x",
  "@tiptap/react": "^2.x",
  "recharts": "^2.x",
  "@svar/gantt-task-react": "latest",
  "cmdk": "^1.x",
  "react-dropzone": "^14.x",
  "react-virtualized-auto-sizer": "^1.x",
  "react-window": "^1.x"
}
```

---

## 🐳 Docker Configuration

### docker-compose.yml
```yaml
version: '3.9'
services:
  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:4000
    depends_on: [backend]
    volumes:
      - ./frontend:/app
      - /app/node_modules

  backend:
    build: ./backend
    ports: ["4000:4000"]
    environment:
      - DATABASE_URL=postgresql://...
      - SMTP_HOST=mail
      - SMTP_PORT=1025
    depends_on: [db, mail]
    volumes:
      - ./backend:/app
      - /app/node_modules
      - uploads_data:/app/uploads

  db:
    image: postgres:16-alpine
    ports: ["5432:5432"]
    environment:
      POSTGRES_DB: joino
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: secret
    volumes:
      - postgres_data:/var/lib/postgresql/data

  mail:
    image: mailhog/mailhog
    ports:
      - "1025:1025"   # SMTP
      - "8025:8025"   # Web UI

volumes:
  postgres_data:
  uploads_data:
```

---

## 📅 Implementation Phases

### ✅ Phase 1 — Foundation (DONE)
1. ✅ Setup Monorepo + Docker Compose
2. ✅ Backend: Prisma schema + migrations + seed data
3. ✅ Backend: Auth API (register/login/JWT + Google OAuth)
4. ✅ Frontend: Next.js setup + shadcn/ui + Tailwind (xanh/trắng)
5. ✅ Frontend: Login/Register pages
6. ✅ Frontend: App Shell (Sidebar + TopBar layout)
7. ✅ Docker: tất cả services chạy được

### ✅ Phase 2 — Core Features (DONE)
1. ✅ Projects CRUD (API + UI)
2. ✅ Tasks CRUD (API + UI)
3. ✅ **List View** (default view, Wrike-like)
4. ✅ **Board View** (Kanban với dnd-kit)
5. ✅ **Gantt View** (timeline bars)
6. ✅ Task Detail Panel (slide-out)
7. ✅ Comments & Activity log
8. ✅ Dashboard page
9. ✅ My Tasks page
10. ✅ Team page
11. ✅ Inbox/Notifications page
12. ✅ File attachments (multer + local storage)
13. ✅ Email notifications (nodemailer + MailHog)

### 🟢 Phase 3 — Wrike Parity

#### 3A. Table View (Spreadsheet) ✅
- [x] Backend: không cần API mới (reuse tasks API)
- [x] Frontend: `TaskTableView.tsx` component
  - [x] Inline edit cells (click to edit)
  - [ ] Column sort
  - [ ] Resizable columns
  - [ ] Fixed first column (title)
  - [ ] Column visibility toggle
  - [x] Add to project page tab "Table"

#### 3B. Filter & Group By (Áp dụng cho tất cả views) ✅
- [x] Backend: `/api/tasks/project/:id?status=&assigneeId=&priority=&labelId=&dueDateFrom=&dueDateTo=&search=`
- [x] Frontend: `TaskFilters.tsx` component
  - [x] Filter chips: Status multi-select, Assignee multi-select, Priority multi-select, Labels, Date range
  - [x] Active filter indicator (badge count)
  - [x] Clear filters button
- [x] Frontend: `GroupBy.tsx` dropdown
  - [x] Group by: Status (default) | Assignee | Priority | Due Date | Label
  - [x] Sort: A-Z, Z-A, Due Date ASC/DESC, Priority, Created at

#### 3C. Labels / Tags ✅
- [x] Backend: Labels CRUD (`/api/projects/:id/labels`)
- [x] Backend: Assign label to task (`/api/tasks/:id/labels`)
- [x] DB migration: `Label` + `TaskLabel` tables
- [x] Frontend: Label management trong project settings
- [x] Frontend: `LabelBadge.tsx` — colored pill với label name
- [x] Frontend: Label picker trong task detail panel
- [x] Frontend: Filter by label

#### 3D. Task Detail Panel — Nâng cấp (Đang làm)
- [x] Labels display + picker
- [x] Time logging (log hours với note)
- [ ] Followers/Watchers (add watcher → receive notifications)
- [x] Copy task link button
- [x] Duplicate task
- [x] Move to project dropdown
- [x] Archive/Delete từ panel
- [x] Estimated hours field
- [ ] Custom fields display

#### 3E. Inline Editing (List View) ✅
- [x] Click task title → edit inline (input + enter to save)
- [x] Click status → dropdown inline
- [x] Click assignee → user picker inline
- [x] Click due date → date picker inline
- [x] Click priority → dropdown inline
- [ ] Keyboard navigation giữa các cells

#### 3F. Bulk Actions ✅
- [x] Checkbox column (select all / select row)
- [x] Bulk action toolbar: Change status, Assign to, Delete, Move to folder
- [x] Select count indicator

### 🟡 Phase 4 — Power Features

#### 4A. Global Search (Cmd+K) ✅
- [x] Backend: Full-text search API (`/api/search?q=`)
  - [x] Search trong task title, description, comment content
  - [x] Search project name
  - [x] Order by relevance
- [x] Frontend: `SearchModal.tsx` / `GlobalSearch.tsx`
  - [x] Trigger: Cmd+K / Search icon trong TopBar
  - [x] Real-time results as you type (debounced 300ms)
  - [x] Groups: Tasks / Projects / Members
  - [x] Recent searches (localStorage)
  - [x] Keyboard navigation (↑↓ + Enter)

#### 4B. Time Tracking ✅
- [x] DB migration: `TimeLog` table
- [x] Backend: Time log CRUD
- [x] Frontend: "Log Time" button trong task detail
  - [x] Modal: hours input + date + note
  - [x] Total logged hours badge
- [x] Frontend: Time logs list trong task detail
- [x] Reports: Time summary per project/member

#### 4C. Task Dependencies (Gantt)
- [ ] DB migration: `TaskDependency` table
- [ ] Backend: dependency CRUD
- [ ] Frontend: Gantt arrows giữa dependent tasks
- [ ] Frontend: Dependency picker trong task detail panel
- [ ] Validation: no circular dependencies

#### 4D. Custom Fields ✅
- [x] DB migration: `CustomField` + `CustomFieldValue`
- [x] Backend: Custom fields CRUD per project
- [x] Frontend: Custom fields manager trong project settings
  - Add field: Text | Number | Date | Dropdown | Checkbox | URL
- [x] Frontend: Custom fields hiển thị trong task detail
- [x] Frontend: Custom fields như column trong Table view

#### 4E. Folder Structure
- [ ] DB migration: `Folder` table (self-relation)
- [ ] Backend: Folders CRUD
- [ ] Frontend: Sidebar nested folders dưới mỗi project
- [ ] Frontend: Move task to folder
- [ ] Frontend: Folder page view (tasks filtered by folder)

### 🟢 Phase 5 — Settings & Polish

#### 5A. Profile Settings (`/settings/profile`) ✅
- [x] Update name
- [x] Upload avatar (UI mockup)
- [x] Change password (UI mockup)
- [x] Notification preferences (email on/off per type)
- [x] Theme preference (Auto dark/light integration) ✅

#### 5B. Workspace Settings (`/settings/workspace`) — Admin only ✅
- [x] Workspace name & color
- [x] Invite members bằng email
- [x] Member list: change role, deactivate (Merged with Team page)

#### 5C. Project Settings (modal từ project page) ✅
- [x] Rename project, change color, change status
- [x] Archive / Delete project
- [x] Manage labels
- [x] Manage custom fields
- [ ] Export tasks to CSV

#### 5D. Reports / Analytics (`/reports`) ✅
- [x] Tasks completed over time (line chart - Recharts)
- [x] Tasks by status (donut chart)
- [x] Workload per member (bar chart)
- [x] Overdue tasks table
- [x] Date range picker

#### 5E. Notifications System — Nâng cấp ✅
- [x] Filter: All / Unread
- [x] Group by project
- [x] Email digest (daily summary)
- [x] In-app toast khi có notification mới (polling mỗi 30s)

#### 5F. Team Page — Nâng cấp ✅
- [x] Search / filter members
- [x] Active tasks count per member
- [x] Workload view (task count by status)
- [x] Invite via email từ team page
- [x] Admin controls: change role, deactivate

#### 5G. My Tasks — Nâng cấp ✅
- [x] Group by: Today / This Week / Later / No Due Date
- [x] Filter by project
- [x] Mark complete inline (checkbox)
- [x] Board view toggle
- [x] Sort controls

#### 5H. UX Polish
- [x] Keyboard shortcuts: `N` = new task, `Cmd+K` = search, `?` = shortcuts help
- [x] Loading skeletons tất cả trang
- [x] Empty states với illustrations
- [x] Error states với retry button
- [x] Mobile responsive (sidebar collapsible)
- [x] Dark mode (standardized with semantic tokens) ✅
- [x] Drag & drop file vào task detail (dropzone)
- [x] Rich text toolbar improvements (Tiptap)
- [x] @ mention trong comments
- [x] Confirmation dialogs cho delete actions

---

## 📊 Gap Analysis — So sánh với Wrike

| Feature | Wrike | Joino hiện tại | Phase |
|---------|-------|----------------------|-------|
| Project management | ✅ | ✅ | Done |
| Task CRUD | ✅ | ✅ | Done |
| Subtasks | ✅ | ✅ | Done |
| List view | ✅ | ✅ | Done |
| Board (Kanban) | ✅ | ✅ | Done |
| Gantt chart | ✅ | ✅ | Done |
| **Table view** | ✅ | ✅ | Done |
| **Inline editing** | ✅ | ✅ | Done |
| **Filter & Group By** | ✅ | ✅ | Done |
| **Labels/Tags** | ✅ | ✅ | Done |
| **Bulk actions** | ✅ | ✅ | Done |
| Comments | ✅ | ✅ | Done |
| Edit/Delete comment | ✅ | ✅ | Done |
| File attachments | ✅ | ✅ | Done |
| Activity log | ✅ | ✅ | Done |
| Notifications | ✅ | ✅ | Done |
| Email notifications (Welcome, Invite, Reset) | ✅ | ✅ | Done |
| **Global search** | ✅ | ✅ | Done |
| **Time tracking** | ✅ | ✅ | Done |
| **Task dependencies** | ✅ | ❌ | Phase 4C |
| **Custom fields** | ✅ | ✅ | Done |
| **Folder structure** | ✅ | ❌ | Phase 4E |
| **Profile settings** | ✅ | ✅ | Done |
| **Workspace settings** | ✅ | ✅ | Done |
| **Project settings** | ✅ | ✅ | Done |
| **Reports/Analytics** | ✅ | ✅ | Done |
| **My Tasks grouping** | ✅ | ✅ | Done |
| **Team workload view** | ✅ | ✅ | Done |
| Favorites/Pins | ✅ | ❌ | Phase 5H |
| Keyboard shortcuts | ✅ | ✅ | Done |
| Dark mode | ✅ | ✅ | Done |

---

## 🤖 Agent Skills & Rules

### Skills đã tạo:
- ✅ `backend-api-skill.md` — Pattern tạo Express route + controller + service + Prisma

### Skills cần tạo:
- ❌ `frontend-component-skill.md` — Pattern tạo shadcn/ui component với green theme
- ❌ `task-view-skill.md` — Pattern implement các view (List/Board/Gantt/Table)
- ❌ `filter-groupby-skill.md` — Pattern implement filter & group by
- ❌ `docker-service-skill.md` — Pattern add service vào docker-compose

---

## ✅ Verification Plan

### Automated:
- `docker-compose up` → tất cả services healthy
- API smoke tests với curl/Postman
- Prisma migrations chạy sạch

### Manual:
- Login/Register flow (local + Google OAuth)
- Create project → add members → create tasks → switch 4 views
- Drag & drop task trên Board view
- Gantt drag to resize/move bars
- Table view inline editing
- Filter tasks by status + assignee + label
- Bulk select + bulk change status
- Upload file attachment
- Log time on task
- Global search (Cmd+K)
- Nhận email notification qua MailHog UI (localhost:8025)

---

## ✅ Confirmed Decisions

| Câu hỏi | Quyết định |
|---------|------------|
| File Storage | ✅ Local `uploads/` folder (không cần S3/MinIO) |
| Real-time | ✅ Polling đơn giản mỗi 30s (không dùng Socket.IO ở v1) |
| Authentication | ✅ JWT + **Google OAuth** |
| Gantt library | ✅ `@svar/gantt-task-react` (open source) |
| Search | ✅ PostgreSQL full-text search (không cần Elasticsearch) |
| Rich Text | ✅ Tiptap (đã có) |
| Drag & Drop | ✅ dnd-kit (đã có) |
| Command palette | ✅ cmdk library |
| Time tracking | ✅ Manual log (không auto-track) |
| Custom fields | ✅ Flexible JSON-based config |
