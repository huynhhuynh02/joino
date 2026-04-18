-- ===============================================================
-- Full init migration — Joino SaaS Multi-tenant
-- ===============================================================

-- ─── Enums ────────────────────────────────────────────────────
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MANAGER', 'MEMBER');
CREATE TYPE "MemberRole" AS ENUM ('OWNER', 'MANAGER', 'MEMBER', 'VIEWER');
CREATE TYPE "OrgRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED');
CREATE TYPE "ProjectStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ARCHIVED', 'ON_HOLD');
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'REVIEW', 'DONE');
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
CREATE TYPE "AuthProvider" AS ENUM ('LOCAL', 'GOOGLE');
CREATE TYPE "CustomFieldType" AS ENUM ('TEXT', 'NUMBER', 'DATE', 'DROPDOWN', 'CHECKBOX', 'URL');
CREATE TYPE "DependencyType" AS ENUM ('FINISH_TO_START', 'START_TO_START', 'FINISH_TO_FINISH', 'START_TO_FINISH');

-- ─── Organizations ────────────────────────────────────────────
CREATE TABLE "organizations" (
    "id"        TEXT        NOT NULL,
    "name"      TEXT        NOT NULL,
    "slug"      TEXT        NOT NULL,
    "logo"      TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- ─── Users ────────────────────────────────────────────────────
CREATE TABLE "users" (
    "id"                      TEXT         NOT NULL,
    "email"                   TEXT         NOT NULL,
    "name"                    TEXT         NOT NULL,
    "avatar"                  TEXT,
    "passwordHash"            TEXT,
    "provider"                "AuthProvider" NOT NULL DEFAULT 'LOCAL',
    "googleId"                TEXT,
    "role"                    "Role"       NOT NULL DEFAULT 'MEMBER',
    "isActive"                BOOLEAN      NOT NULL DEFAULT true,
    "dailySummary"            BOOLEAN      NOT NULL DEFAULT true,
    "mentionsNotifications"   BOOLEAN      NOT NULL DEFAULT true,
    "assignmentsNotifications" BOOLEAN     NOT NULL DEFAULT true,
    "createdAt"               TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"               TIMESTAMP(3) NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- ─── Organization Members ─────────────────────────────────────
CREATE TABLE "organization_members" (
    "id"             TEXT        NOT NULL,
    "userId"         TEXT        NOT NULL,
    "organizationId" TEXT        NOT NULL,
    "role"           "OrgRole"   NOT NULL DEFAULT 'MEMBER',
    "joinedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id")
);

-- ─── Invitations ──────────────────────────────────────────────
CREATE TABLE "invitations" (
    "id"             TEXT               NOT NULL,
    "email"          TEXT               NOT NULL,
    "organizationId" TEXT               NOT NULL,
    "invitedById"    TEXT               NOT NULL,
    "role"           "OrgRole"          NOT NULL DEFAULT 'MEMBER',
    "token"          TEXT               NOT NULL,
    "status"         "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt"      TIMESTAMP(3)       NOT NULL,
    "createdAt"      TIMESTAMP(3)       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

-- ─── Projects ─────────────────────────────────────────────────
CREATE TABLE "projects" (
    "id"             TEXT           NOT NULL,
    "name"           TEXT           NOT NULL,
    "description"    TEXT,
    "color"          TEXT           NOT NULL DEFAULT '#00A86B',
    "status"         "ProjectStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate"      TIMESTAMP(3),
    "endDate"        TIMESTAMP(3),
    "ownerId"        TEXT           NOT NULL,
    "organizationId" TEXT           NOT NULL,
    "createdAt"      TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3)   NOT NULL,
    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- ─── Project Members ──────────────────────────────────────────
CREATE TABLE "project_members" (
    "id"        TEXT        NOT NULL,
    "userId"    TEXT        NOT NULL,
    "projectId" TEXT        NOT NULL,
    "role"      "MemberRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "project_members_pkey" PRIMARY KEY ("id")
);

-- ─── Folders ──────────────────────────────────────────────────
CREATE TABLE "folders" (
    "id"          TEXT        NOT NULL,
    "name"        TEXT        NOT NULL,
    "description" TEXT,
    "color"       TEXT        NOT NULL DEFAULT '#6B7280',
    "projectId"   TEXT        NOT NULL,
    "parentId"    TEXT,
    "position"    INTEGER     NOT NULL DEFAULT 0,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,
    CONSTRAINT "folders_pkey" PRIMARY KEY ("id")
);

-- ─── Tasks ────────────────────────────────────────────────────
CREATE TABLE "tasks" (
    "id"             TEXT         NOT NULL,
    "title"          TEXT         NOT NULL,
    "description"    TEXT,
    "status"         "TaskStatus" NOT NULL DEFAULT 'TODO',
    "priority"       "Priority"   NOT NULL DEFAULT 'MEDIUM',
    "startDate"      TIMESTAMP(3),
    "dueDate"        TIMESTAMP(3),
    "estimatedHours" DOUBLE PRECISION,
    "position"       INTEGER      NOT NULL DEFAULT 0,
    "projectId"      TEXT         NOT NULL,
    "assigneeId"     TEXT,
    "creatorId"      TEXT         NOT NULL,
    "parentId"       TEXT,
    "folderId"       TEXT,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL,
    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- ─── Task Dependencies ────────────────────────────────────────
CREATE TABLE "task_dependencies" (
    "id"            TEXT             NOT NULL,
    "predecessorId" TEXT             NOT NULL,
    "successorId"   TEXT             NOT NULL,
    "type"          "DependencyType" NOT NULL DEFAULT 'FINISH_TO_START',
    "createdAt"     TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "task_dependencies_pkey" PRIMARY KEY ("id")
);

-- ─── Comments ─────────────────────────────────────────────────
CREATE TABLE "comments" (
    "id"        TEXT        NOT NULL,
    "content"   TEXT        NOT NULL,
    "taskId"    TEXT        NOT NULL,
    "userId"    TEXT        NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- ─── Attachments ─────────────────────────────────────────────
CREATE TABLE "attachments" (
    "id"           TEXT        NOT NULL,
    "filename"     TEXT        NOT NULL,
    "originalName" TEXT        NOT NULL,
    "url"          TEXT        NOT NULL,
    "size"         INTEGER     NOT NULL,
    "mimeType"     TEXT        NOT NULL,
    "taskId"       TEXT        NOT NULL,
    "uploaderId"   TEXT        NOT NULL,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- ─── Activities ───────────────────────────────────────────────
CREATE TABLE "activities" (
    "id"        TEXT        NOT NULL,
    "action"    TEXT        NOT NULL,
    "details"   JSONB,
    "taskId"    TEXT        NOT NULL,
    "userId"    TEXT        NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- ─── Notifications ────────────────────────────────────────────
CREATE TABLE "notifications" (
    "id"        TEXT        NOT NULL,
    "type"      TEXT        NOT NULL,
    "title"     TEXT        NOT NULL,
    "message"   TEXT        NOT NULL,
    "read"      BOOLEAN     NOT NULL DEFAULT false,
    "userId"    TEXT        NOT NULL,
    "taskId"    TEXT,
    "projectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- ─── Labels ───────────────────────────────────────────────────
CREATE TABLE "labels" (
    "id"        TEXT        NOT NULL,
    "name"      TEXT        NOT NULL,
    "color"     TEXT        NOT NULL DEFAULT '#6B7280',
    "projectId" TEXT        NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "labels_pkey" PRIMARY KEY ("id")
);

-- ─── Task Labels ──────────────────────────────────────────────
CREATE TABLE "task_labels" (
    "taskId"  TEXT NOT NULL,
    "labelId" TEXT NOT NULL,
    CONSTRAINT "task_labels_pkey" PRIMARY KEY ("taskId","labelId")
);

-- ─── Time Logs ────────────────────────────────────────────────
CREATE TABLE "time_logs" (
    "id"       TEXT             NOT NULL,
    "taskId"   TEXT             NOT NULL,
    "userId"   TEXT             NOT NULL,
    "hours"    DOUBLE PRECISION NOT NULL,
    "note"     TEXT,
    "loggedAt" TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "time_logs_pkey" PRIMARY KEY ("id")
);

-- ─── Custom Fields ────────────────────────────────────────────
CREATE TABLE "custom_fields" (
    "id"        TEXT             NOT NULL,
    "name"      TEXT             NOT NULL,
    "type"      "CustomFieldType" NOT NULL,
    "options"   JSONB,
    "projectId" TEXT             NOT NULL,
    "createdAt" TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3)     NOT NULL,
    CONSTRAINT "custom_fields_pkey" PRIMARY KEY ("id")
);

-- ─── Custom Field Values ──────────────────────────────────────
CREATE TABLE "custom_field_values" (
    "id"      TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "taskId"  TEXT NOT NULL,
    "value"   TEXT NOT NULL,
    CONSTRAINT "custom_field_values_pkey" PRIMARY KEY ("id")
);

-- ─── Favorites ────────────────────────────────────────────────
CREATE TABLE "favorites" (
    "id"         TEXT        NOT NULL,
    "userId"     TEXT        NOT NULL,
    "entityType" TEXT        NOT NULL,
    "entityId"   TEXT        NOT NULL,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- ─── Settings ─────────────────────────────────────────────────
CREATE TABLE "settings" (
    "id"        TEXT        NOT NULL,
    "key"       TEXT        NOT NULL,
    "value"     TEXT        NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- ================================================================
-- Indexes
-- ================================================================

CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");
CREATE INDEX "organizations_slug_idx" ON "organizations"("slug");

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");
CREATE INDEX "users_email_idx" ON "users"("email");

CREATE UNIQUE INDEX "organization_members_userId_organizationId_key" ON "organization_members"("userId", "organizationId");
CREATE INDEX "organization_members_organizationId_idx" ON "organization_members"("organizationId");

CREATE UNIQUE INDEX "invitations_token_key" ON "invitations"("token");
CREATE INDEX "invitations_token_idx" ON "invitations"("token");
CREATE INDEX "invitations_organizationId_idx" ON "invitations"("organizationId");
CREATE INDEX "invitations_email_idx" ON "invitations"("email");

CREATE INDEX "projects_ownerId_idx" ON "projects"("ownerId");
CREATE INDEX "projects_organizationId_idx" ON "projects"("organizationId");

CREATE UNIQUE INDEX "project_members_userId_projectId_key" ON "project_members"("userId", "projectId");
CREATE INDEX "project_members_projectId_idx" ON "project_members"("projectId");

CREATE INDEX "folders_projectId_idx" ON "folders"("projectId");
CREATE INDEX "folders_parentId_idx" ON "folders"("parentId");

CREATE INDEX "tasks_projectId_status_idx" ON "tasks"("projectId", "status");
CREATE INDEX "tasks_assigneeId_dueDate_idx" ON "tasks"("assigneeId", "dueDate");
CREATE INDEX "tasks_parentId_idx" ON "tasks"("parentId");
CREATE INDEX "tasks_folderId_idx" ON "tasks"("folderId");

CREATE UNIQUE INDEX "task_dependencies_predecessorId_successorId_key" ON "task_dependencies"("predecessorId", "successorId");
CREATE INDEX "task_dependencies_predecessorId_idx" ON "task_dependencies"("predecessorId");
CREATE INDEX "task_dependencies_successorId_idx" ON "task_dependencies"("successorId");

CREATE INDEX "comments_taskId_idx" ON "comments"("taskId");
CREATE INDEX "attachments_taskId_idx" ON "attachments"("taskId");
CREATE INDEX "activities_taskId_idx" ON "activities"("taskId");
CREATE INDEX "notifications_userId_read_idx" ON "notifications"("userId", "read");

CREATE UNIQUE INDEX "labels_name_projectId_key" ON "labels"("name", "projectId");
CREATE INDEX "labels_projectId_idx" ON "labels"("projectId");

CREATE INDEX "time_logs_taskId_idx" ON "time_logs"("taskId");
CREATE INDEX "time_logs_userId_idx" ON "time_logs"("userId");

CREATE UNIQUE INDEX "custom_fields_name_projectId_key" ON "custom_fields"("name", "projectId");
CREATE INDEX "custom_fields_projectId_idx" ON "custom_fields"("projectId");

CREATE UNIQUE INDEX "custom_field_values_fieldId_taskId_key" ON "custom_field_values"("fieldId", "taskId");
CREATE INDEX "custom_field_values_taskId_idx" ON "custom_field_values"("taskId");

CREATE UNIQUE INDEX "favorites_userId_entityType_entityId_key" ON "favorites"("userId", "entityType", "entityId");
CREATE UNIQUE INDEX "settings_key_key" ON "settings"("key");

-- ================================================================
-- Foreign Keys
-- ================================================================

-- organization_members
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- invitations
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invitedById_fkey"
    FOREIGN KEY ("invitedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- projects
ALTER TABLE "projects" ADD CONSTRAINT "projects_ownerId_fkey"
    FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "projects" ADD CONSTRAINT "projects_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- project_members
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- folders
ALTER TABLE "folders" ADD CONSTRAINT "folders_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "folders" ADD CONSTRAINT "folders_parentId_fkey"
    FOREIGN KEY ("parentId") REFERENCES "folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- tasks
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigneeId_fkey"
    FOREIGN KEY ("assigneeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_creatorId_fkey"
    FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_parentId_fkey"
    FOREIGN KEY ("parentId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_folderId_fkey"
    FOREIGN KEY ("folderId") REFERENCES "folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- task_dependencies
ALTER TABLE "task_dependencies" ADD CONSTRAINT "task_dependencies_predecessorId_fkey"
    FOREIGN KEY ("predecessorId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "task_dependencies" ADD CONSTRAINT "task_dependencies_successorId_fkey"
    FOREIGN KEY ("successorId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- comments
ALTER TABLE "comments" ADD CONSTRAINT "comments_taskId_fkey"
    FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "comments" ADD CONSTRAINT "comments_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- attachments
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_taskId_fkey"
    FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_uploaderId_fkey"
    FOREIGN KEY ("uploaderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- activities
ALTER TABLE "activities" ADD CONSTRAINT "activities_taskId_fkey"
    FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activities" ADD CONSTRAINT "activities_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- notifications
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- labels
ALTER TABLE "labels" ADD CONSTRAINT "labels_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- task_labels
ALTER TABLE "task_labels" ADD CONSTRAINT "task_labels_taskId_fkey"
    FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "task_labels" ADD CONSTRAINT "task_labels_labelId_fkey"
    FOREIGN KEY ("labelId") REFERENCES "labels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- time_logs
ALTER TABLE "time_logs" ADD CONSTRAINT "time_logs_taskId_fkey"
    FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "time_logs" ADD CONSTRAINT "time_logs_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- custom_fields
ALTER TABLE "custom_fields" ADD CONSTRAINT "custom_fields_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- custom_field_values
ALTER TABLE "custom_field_values" ADD CONSTRAINT "custom_field_values_fieldId_fkey"
    FOREIGN KEY ("fieldId") REFERENCES "custom_fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "custom_field_values" ADD CONSTRAINT "custom_field_values_taskId_fkey"
    FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- favorites
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
