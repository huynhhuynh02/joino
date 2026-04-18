import { PrismaClient, Role, Priority, TaskStatus, ProjectStatus, MemberRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data (dev only)
  await prisma.notification.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  // ─── Users ──────────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('password123', 12);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@joino.local',
      name: 'Admin User',
      passwordHash,
      role: Role.ADMIN,
      avatar: null,
    },
  });

  const alice = await prisma.user.create({
    data: {
      email: 'alice@joino.local',
      name: 'Alice Nguyen',
      passwordHash,
      role: Role.MEMBER,
    },
  });

  const bob = await prisma.user.create({
    data: {
      email: 'bob@joino.local',
      name: 'Bob Tran',
      passwordHash,
      role: Role.MEMBER,
    },
  });

  const carol = await prisma.user.create({
    data: {
      email: 'carol@joino.local',
      name: 'Carol Le',
      passwordHash,
      role: Role.MEMBER,
    },
  });

  console.log('✅ Users created');

  // ─── Organizations ────────────────────────────────────────────────────────────
  const org1 = await prisma.organization.create({
    data: {
      name: 'Acme Corp',
      slug: 'acme-corp',
      members: {
        create: [
          { userId: admin.id, role: 'OWNER' },
          { userId: alice.id, role: 'ADMIN' },
          { userId: bob.id, role: 'MEMBER' },
          { userId: carol.id, role: 'MEMBER' },
        ],
      },
    },
  });

  console.log('✅ Organizations created');

  // ─── Projects ───────────────────────────────────────────────────────────────
  const project1 = await prisma.project.create({
    data: {
      name: 'Website Redesign',
      description: 'Redesign the company website with modern UI/UX',
      color: '#00A86B',
      status: ProjectStatus.ACTIVE,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-03-31'),
      ownerId: admin.id,
      organizationId: org1.id,
      members: {
        create: [
          { userId: admin.id, role: MemberRole.OWNER },
          { userId: alice.id, role: MemberRole.MANAGER },
          { userId: bob.id, role: MemberRole.MEMBER },
          { userId: carol.id, role: MemberRole.MEMBER },
        ],
      },
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: 'Mobile App Development',
      description: 'Build a React Native mobile app for iOS and Android',
      color: '#3B82F6',
      status: ProjectStatus.ACTIVE,
      startDate: new Date('2026-02-01'),
      endDate: new Date('2026-06-30'),
      ownerId: alice.id,
      organizationId: org1.id,
      members: {
        create: [
          { userId: alice.id, role: MemberRole.OWNER },
          { userId: bob.id, role: MemberRole.MANAGER },
          { userId: admin.id, role: MemberRole.VIEWER },
        ],
      },
    },
  });

  const project3 = await prisma.project.create({
    data: {
      name: 'Q1 Marketing Campaign',
      description: 'Launch marketing campaign for Q1 2026',
      color: '#F59E0B',
      status: ProjectStatus.ACTIVE,
      startDate: new Date('2026-01-15'),
      endDate: new Date('2026-03-15'),
      ownerId: carol.id,
      organizationId: org1.id,
      members: {
        create: [
          { userId: carol.id, role: MemberRole.OWNER },
          { userId: admin.id, role: MemberRole.MEMBER },
        ],
      },
    },
  });

  console.log('✅ Projects created');

  // ─── Tasks (Project 1) ──────────────────────────────────────────────────────
  const task1 = await prisma.task.create({
    data: {
      title: 'Design System Setup',
      description: 'Set up color palette, typography, and component library',
      status: TaskStatus.DONE,
      priority: Priority.HIGH,
      projectId: project1.id,
      assigneeId: alice.id,
      creatorId: admin.id,
      startDate: new Date('2024-01-01'),
      dueDate: new Date('2024-01-15'),
      position: 1,
    },
  });

  const task2 = await prisma.task.create({
    data: {
      title: 'Homepage Wireframes',
      description: 'Create wireframes for the new homepage layout',
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      projectId: project1.id,
      assigneeId: alice.id,
      creatorId: admin.id,
      startDate: new Date('2024-01-10'),
      dueDate: new Date('2024-01-25'),
      position: 2,
    },
  });

  const task3 = await prisma.task.create({
    data: {
      title: 'Implement new navigation',
      description: 'Code the new responsive navigation component',
      status: TaskStatus.TODO,
      priority: Priority.MEDIUM,
      projectId: project1.id,
      assigneeId: bob.id,
      creatorId: admin.id,
      startDate: new Date('2024-01-20'),
      dueDate: new Date('2024-02-05'),
      position: 3,
    },
  });

  const task4 = await prisma.task.create({
    data: {
      title: 'Content Migration',
      description: 'Migrate existing content to new CMS structure',
      status: TaskStatus.TODO,
      priority: Priority.LOW,
      projectId: project1.id,
      assigneeId: carol.id,
      creatorId: admin.id,
      dueDate: new Date('2024-02-15'),
      position: 4,
    },
  });

  const task5 = await prisma.task.create({
    data: {
      title: 'SEO Optimization',
      description: 'Optimize all pages for search engines',
      status: TaskStatus.REVIEW,
      priority: Priority.URGENT,
      projectId: project1.id,
      assigneeId: bob.id,
      creatorId: alice.id,
      dueDate: new Date('2024-01-20'),
      position: 5,
    },
  });

  // Subtasks for task2
  await prisma.task.createMany({
    data: [
      {
        title: 'Hero section wireframe',
        status: TaskStatus.DONE,
        priority: Priority.MEDIUM,
        projectId: project1.id,
        assigneeId: alice.id,
        creatorId: alice.id,
        parentId: task2.id,
        position: 1,
      },
      {
        title: 'Features section wireframe',
        status: TaskStatus.IN_PROGRESS,
        priority: Priority.MEDIUM,
        projectId: project1.id,
        assigneeId: alice.id,
        creatorId: alice.id,
        parentId: task2.id,
        position: 2,
      },
    ],
  });

  // ─── Tasks (Project 2) ──────────────────────────────────────────────────────
  await prisma.task.createMany({
    data: [
      {
        title: 'Set up React Native project',
        status: TaskStatus.DONE,
        priority: Priority.HIGH,
        projectId: project2.id,
        assigneeId: bob.id,
        creatorId: alice.id,
        dueDate: new Date('2024-02-10'),
        position: 1,
      },
      {
        title: 'Authentication flow',
        status: TaskStatus.IN_PROGRESS,
        priority: Priority.HIGH,
        projectId: project2.id,
        assigneeId: bob.id,
        creatorId: alice.id,
        dueDate: new Date('2024-02-20'),
        position: 2,
      },
      {
        title: 'Design app icons and splash screen',
        status: TaskStatus.TODO,
        priority: Priority.MEDIUM,
        projectId: project2.id,
        assigneeId: alice.id,
        creatorId: alice.id,
        dueDate: new Date('2024-03-01'),
        position: 3,
      },
    ],
  });

  console.log('✅ Tasks created');

  // ─── Comments ───────────────────────────────────────────────────────────────
  await prisma.comment.createMany({
    data: [
      {
        content: 'Great progress on this! The design looks clean and modern.',
        taskId: task1.id,
        userId: admin.id,
      },
      {
        content: 'I have completed the color palette. Moving on to typography next.',
        taskId: task1.id,
        userId: alice.id,
      },
      {
        content: 'Can you share the Figma link when ready?',
        taskId: task2.id,
        userId: bob.id,
      },
      {
        content: 'Working on it, will share by EOD.',
        taskId: task2.id,
        userId: alice.id,
      },
    ],
  });

  // ─── Activities ──────────────────────────────────────────────────────────────
  await prisma.activity.createMany({
    data: [
      {
        action: 'task_created',
        taskId: task1.id,
        userId: admin.id,
        details: { title: task1.title },
      },
      {
        action: 'status_changed',
        taskId: task1.id,
        userId: alice.id,
        details: { from: 'TODO', to: 'IN_PROGRESS' },
      },
      {
        action: 'status_changed',
        taskId: task1.id,
        userId: alice.id,
        details: { from: 'IN_PROGRESS', to: 'DONE' },
      },
      {
        action: 'task_created',
        taskId: task2.id,
        userId: admin.id,
        details: { title: task2.title },
      },
      {
        action: 'assignee_changed',
        taskId: task3.id,
        userId: admin.id,
        details: { to: bob.name },
      },
    ],
  });

  // ─── Notifications ───────────────────────────────────────────────────────────
  await prisma.notification.createMany({
    data: [
      {
        type: 'task_assigned',
        title: 'New task assigned',
        message: `You have been assigned to "${task3.title}"`,
        userId: bob.id,
        taskId: task3.id,
        projectId: project1.id,
      },
      {
        type: 'comment_added',
        title: 'New comment',
        message: `Bob commented on "${task2.title}"`,
        userId: alice.id,
        taskId: task2.id,
        projectId: project1.id,
      },
    ],
  });

  console.log('✅ Seed data completed!');
  console.log('\n📋 Login credentials:');
  console.log('  Admin: admin@joino.local / password123');
  console.log('  Alice: alice@joino.local / password123');
  console.log('  Bob:   bob@joino.local   / password123');
  console.log('  Carol: carol@joino.local  / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
