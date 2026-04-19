import { Metadata } from 'next';
import Link from 'next/link';
import {
  CheckCircle2, BarChart3, Users2, Layout,
  ShieldCheck, ArrowRight, Zap, Globe,
  Sparkles, GitBranch, Star, Terminal,
  Package, Heart, Mail, ExternalLink, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Joino — Open Source Project Management. Self-Host in Minutes.',
  description:
    'Joino is a free, open-source project management platform. Kanban boards, Gantt charts, team collaboration, and AI insights — all self-hostable with Docker. No vendor lock-in.',
  keywords: [
    'open source project management',
    'self hosted project management',
    'free project management software',
    'docker project management',
    'open source wrike alternative',
    'open source asana alternative',
    'kanban self host',
    'team collaboration open source',
    'joino',
  ],
  openGraph: {
    title: 'Joino — Open Source Project Management',
    description: 'Free & open-source. Kanban, Gantt, AI insights — self-host with Docker in minutes.',
    type: 'website',
    url: 'https://joino.cloud',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Joino Dashboard' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Joino — Open Source Project Management',
    description: 'Free & open-source. Self-host in minutes with Docker.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: 'https://joino.cloud' },
  robots: { index: true, follow: true },
};

const FEATURES = [
  {
    icon: Layout,
    color: 'text-violet-500',
    bg: 'bg-violet-50',
    title: 'Multiple Views',
    desc: 'List, Kanban board, and Gantt chart — switch instantly. All data stays in sync.',
  },
  {
    icon: Users2,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
    title: 'Team Collaboration',
    desc: 'Comments, @mentions, file attachments, and live activity feeds in every task.',
  },
  {
    icon: BarChart3,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    title: 'Reports & Analytics',
    desc: 'Task completion charts, workload heatmaps, and team performance insights.',
  },
  {
    icon: Sparkles,
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    title: 'AI Copilot',
    desc: 'Powered by Gemini. Auto-fill tasks, summarize threads, generate subtasks instantly.',
  },
  {
    icon: Globe,
    color: 'text-teal-500',
    bg: 'bg-teal-50',
    title: 'Multi-language',
    desc: 'Full support for English, Tiếng Việt, and 日本語 — built-in from day one.',
  },
  {
    icon: ShieldCheck,
    color: 'text-rose-500',
    bg: 'bg-rose-50',
    title: 'Role-based Access',
    desc: 'Workspace-level roles: Owner, Admin, Manager, Member, Viewer — fully controlled.',
  },
];

const SELF_HOST_STEPS = [
  {
    step: '1',
    title: 'Clone the repository',
    code: 'git clone https://github.com/huynhhuynh02/joino.git',
    icon: GitBranch,
  },
  {
    step: '2',
    title: 'Configure environment',
    code: 'cp .env.example .env  # Edit your DB & secrets',
    icon: Terminal,
  },
  {
    step: '3',
    title: 'Launch with Docker',
    code: 'docker compose up -d',
    icon: Package,
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-900 antialiased selection:bg-primary/20 selection:text-primary">

      {/* ── SEO Schema ── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'Joino',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Any',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            description: 'Free and open-source project management platform, self-hostable with Docker.',
            url: 'https://joino.cloud',
            license: 'https://opensource.org/licenses/MIT',
          }),
        }}
      />

      {/* ── Navigation ── */}
      <header role="banner" className="fixed top-0 w-full z-50 border-b border-gray-100/80 bg-white/80 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" aria-label="Joino Home" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 group-hover:shadow-primary/50 transition-shadow">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tight">Joino</span>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold tracking-wider">
              OPEN SOURCE
            </span>
          </Link>

          <nav aria-label="Main navigation" className="hidden md:flex items-center gap-8">
            {[
              { href: '#features', label: 'Features' },
              { href: '#self-host', label: 'Self-Host' },
              { href: '#contribute', label: 'Contribute' },
            ].map(({ href, label }) => (
              <Link key={href} href={href} className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="https://github.com/huynhhuynh02/joino"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 text-sm font-medium text-gray-600 hover:text-gray-900 transition-all"
            >
              <GitBranch className="w-4 h-4" />
              GitHub
            </a>
            <Link href="/login">
              <Button size="sm" className="font-bold rounded-xl shadow-md shadow-primary/20">
                Live Demo
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content">

        {/* ── Hero ── */}
        <section aria-labelledby="hero-heading" className="relative pt-32 pb-20 md:pt-44 md:pb-28 px-6 overflow-hidden">
          {/* Gradient orbs */}
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-gradient-radial from-primary/8 to-transparent blur-3xl pointer-events-none" />
          <div className="absolute top-48 right-10 w-72 h-72 rounded-full bg-emerald-200/30 blur-3xl pointer-events-none" />

          <div className="max-w-5xl mx-auto text-center relative">

            {/* Open Source badge */}
            <a
              href="https://github.com/huynhhuynh02/joino"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-900 border border-gray-700 text-white text-xs font-bold tracking-wide mb-8 hover:bg-gray-800 transition-colors"
            >
              <GitBranch className="w-3.5 h-3.5" />
              Star us on GitHub
              <Star className="w-3 h-3 text-amber-400" />
            </a>

            <h1
              id="hero-heading"
              className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-gray-900 mb-7 leading-[0.95] animate-in fade-in slide-in-from-bottom-4 duration-700"
            >
              Project management,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-emerald-500 to-teal-400">
                free & open.
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
              A full-featured, beautiful project management platform you can{' '}
              <strong className="text-gray-700 font-semibold">self-host in minutes</strong>{' '}
              with Docker. No subscriptions. No lock-in. Yours forever.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
              <a
                href="https://github.com/huynhhuynh02/joino"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  id="hero-cta-github"
                  size="lg"
                  className="h-14 px-8 text-base font-bold rounded-2xl shadow-2xl shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-200 gap-2"
                >
                  <GitBranch className="w-5 h-5" />
                  View on GitHub
                </Button>
              </a>
              <Link href="/login">
                <Button
                  id="hero-cta-demo"
                  variant="outline"
                  size="lg"
                  className="h-14 px-8 text-base font-medium rounded-2xl border-gray-200 hover:border-gray-300 gap-2"
                >
                  Try Live Demo
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            <p className="text-xs text-gray-400 mb-16 animate-in fade-in duration-700 delay-300">
              MIT Licensed · Self-hosted · No credit card · No vendor lock-in
            </p>

            {/* Dashboard Mockup — Real Screenshot */}
            <div className="relative mx-auto max-w-6xl animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
              <div className="absolute -inset-6 bg-gradient-to-b from-primary/25 via-primary/8 to-transparent blur-3xl rounded-[48px] -z-10" />

              <div className="relative rounded-[24px] border border-gray-200 shadow-[0_32px_80px_-12px_rgba(0,0,0,0.18)] overflow-hidden ring-1 ring-black/5">
                <div className="flex items-center gap-2 px-5 py-3.5 bg-[#f5f5f7] border-b border-gray-200/80">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                    <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                    <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                  </div>
                  <div className="flex items-center gap-1 mx-3">
                    <div className="bg-white border border-gray-200 rounded-md px-4 py-1 flex items-center gap-2 shadow-sm">
                      <div className="w-3 h-3 rounded-sm bg-primary/80 flex-shrink-0" />
                      <span className="text-[10px] font-medium text-gray-700">Website Redesign — Joino</span>
                    </div>
                  </div>
                  <div className="flex-1 max-w-sm mx-auto">
                    <div className="h-6 bg-white rounded-md border border-gray-200 flex items-center gap-2 px-3">
                      <div className="w-2.5 h-2.5 rounded-full border border-green-500 flex items-center justify-center flex-shrink-0">
                        <div className="w-1 h-1 rounded-full bg-green-500" />
                      </div>
                      <span className="text-[10px] text-gray-400">localhost:3000 · joino.cloud</span>
                    </div>
                  </div>
                </div>
                <img
                  src="/app-hero.png"
                  alt="Joino kanban board showing Website Redesign project with To Do, In Progress, Review and Done columns"
                  className="w-full h-auto block"
                  width={1512}
                  height={795}
                  loading="eager"
                />
              </div>

              {/* Floating badges */}
              <div className="absolute -left-6 top-1/3 hidden lg:flex -translate-y-1/2">
                <div className="bg-white rounded-2xl px-4 py-3 shadow-xl border border-gray-100 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0">
                    <Heart className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-900">100% Free</p>
                    <p className="text-[9px] text-gray-400">MIT License</p>
                  </div>
                </div>
              </div>
              <div className="absolute -right-6 top-1/2 hidden lg:flex -translate-y-1/2">
                <div className="bg-white rounded-2xl px-4 py-3 shadow-xl border border-gray-100 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gray-900 flex items-center justify-center flex-shrink-0">
                    <Package className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-900">Docker ready</p>
                    <p className="text-[9px] text-gray-400">1 command deploy</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── What is Joino ── */}
        <section aria-label="About Joino" className="px-6 py-12 bg-gray-50 border-y border-gray-100">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-lg text-gray-600 leading-relaxed">
              <strong className="text-gray-900">Joino</strong> is an open-source project management tool
              built with <strong className="text-gray-900">Next.js, Node.js & PostgreSQL</strong>.
              It's designed for developers and teams who want full control —
              host it on your own server, customize it freely, and contribute back to the community.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
              {['TypeScript', 'Next.js 15', 'Node.js', 'PostgreSQL', 'Docker', 'Prisma', 'Gemini AI'].map((tech) => (
                <span key={tech} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 shadow-sm">
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features Grid ── */}
        <section id="features" aria-labelledby="features-heading" className="px-6 py-24 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-bold tracking-wider mb-5">
                BUILT-IN FEATURES
              </div>
              <h2 id="features-heading" className="text-3xl md:text-5xl font-black tracking-tighter text-gray-900 mb-4 leading-tight">
                Everything you need,<br />nothing you don't.
              </h2>
              <p className="text-gray-500 text-lg leading-relaxed">
                A complete project management suite — open-source, free to use, and ready to self-host.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES.map(({ icon: Icon, color, bg, title, desc }) => (
                <div
                  key={title}
                  className="group bg-white rounded-3xl border border-gray-100 p-8 hover:border-gray-200 hover:shadow-xl transition-all duration-300 cursor-default"
                >
                  <div className={`w-12 h-12 ${bg} rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`w-6 h-6 ${color}`} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Feature screenshot: Board ── */}
        <section aria-labelledby="board-heading" className="px-6 py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
              <div className="flex-1 order-2 lg:order-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 border border-violet-100 text-violet-600 text-xs font-bold tracking-wider mb-6">
                  <Layout className="w-3 h-3" />
                  KANBAN & GANTT
                </div>
                <h2 id="board-heading" className="text-3xl md:text-5xl font-black tracking-tighter text-gray-900 mb-6 leading-tight">
                  Visualize work,<br />your way.
                </h2>
                <p className="text-lg text-gray-500 leading-relaxed mb-8">
                  Drag-and-drop Kanban boards, timeline Gantt charts, and a compact table view. Switch between them instantly — all data stays perfectly synchronized.
                </p>
                <ul className="space-y-4">
                  {[
                    'Drag-and-drop Kanban with swim lanes',
                    'Interactive Gantt with dependency lines',
                    'Sortable, filterable table view',
                    'Group by status, priority, or assignee',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-gray-700">
                      <CheckCircle2 className="w-5 h-5 text-violet-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm font-medium leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <Link href="/login">
                    <Button className="rounded-xl gap-2 font-bold" id="board-cta">
                      Try it live <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="flex-1 order-1 lg:order-2 relative">
                <div className="absolute -inset-8 bg-violet-400/10 blur-3xl rounded-[48px]" />
                <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-[0_24px_60px_-8px_rgba(0,0,0,0.15)] ring-1 ring-black/5">
                  <div className="flex items-center gap-1.5 px-4 py-3 bg-[#f5f5f7] border-b border-gray-200">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                    <span className="text-[10px] text-gray-400 ml-2">Website Redesign — Board view</span>
                  </div>
                  <img
                    src="/app-hero.png"
                    alt="Joino kanban board view with drag-and-drop columns"
                    className="w-full h-auto block"
                    width={1512}
                    height={795}
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Feature screenshot: Task Detail ── */}
        <section aria-labelledby="tasks-heading" className="px-6 py-24 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row-reverse items-center gap-16 lg:gap-24">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-bold tracking-wider mb-6">
                  <Users2 className="w-3 h-3" />
                  COLLABORATION
                </div>
                <h2 id="tasks-heading" className="text-3xl md:text-5xl font-black tracking-tighter text-gray-900 mb-6 leading-tight">
                  Tasks with full<br />context built-in.
                </h2>
                <p className="text-lg text-gray-500 leading-relaxed mb-8">
                  Every task is a full workspace — comments, attachments, time logs, subtasks, and custom fields. Your team always has the full picture without switching tools.
                </p>
                <ul className="space-y-4">
                  {[
                    'Rich comments with activity history',
                    'File attachments up to 10MB',
                    'Time tracking & estimated hours',
                    'Subtasks, labels & custom fields',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-gray-700">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm font-medium leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex-1 relative">
                <div className="absolute -inset-8 bg-emerald-400/10 blur-3xl rounded-[48px]" />
                <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-[0_24px_60px_-8px_rgba(0,0,0,0.15)] ring-1 ring-black/5">
                  <div className="flex items-center gap-1.5 px-4 py-3 bg-[#f5f5f7] border-b border-gray-200">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                    <span className="text-[10px] text-gray-400 ml-2">Design app icons — Task Detail</span>
                  </div>
                  <img
                    src="/app-task-detail.png"
                    alt="Joino task detail panel showing status, priority, assignee, comments and attachments"
                    className="w-full h-auto block"
                    width={1512}
                    height={795}
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Feature screenshot: Reports ── */}
        <section aria-labelledby="reports-heading" className="px-6 py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold tracking-wider mb-6">
                  <BarChart3 className="w-3 h-3" />
                  ANALYTICS
                </div>
                <h2 id="reports-heading" className="text-3xl md:text-5xl font-black tracking-tighter text-gray-900 mb-6 leading-tight">
                  Insights that actually<br />help your team.
                </h2>
                <p className="text-lg text-gray-500 leading-relaxed mb-8">
                  Real-time dashboards that show what matters — task velocity, workload distribution, and overdue risks. No setup required.
                </p>
                <ul className="space-y-4">
                  {[
                    'Task completion trend over time',
                    'Tasks by status — live donut chart',
                    'Workload per team member bar chart',
                    'Overdue task tracker',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-gray-700">
                      <CheckCircle2 className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm font-medium leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex-1 relative">
                <div className="absolute -inset-8 bg-blue-400/10 blur-3xl rounded-[48px]" />
                <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-[0_24px_60px_-8px_rgba(0,0,0,0.15)] ring-1 ring-black/5">
                  <div className="flex items-center gap-1.5 px-4 py-3 bg-[#f5f5f7] border-b border-gray-200">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                    <span className="text-[10px] text-gray-400 ml-2">Reports & Analytics — Last 30 days</span>
                  </div>
                  <img
                    src="/app-reports.png"
                    alt="Joino reports page showing task completion chart, status donut chart and workload analytics"
                    className="w-full h-auto block"
                    width={1512}
                    height={795}
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Self-Host in 3 steps ── */}
        <section id="self-host" aria-labelledby="selfhost-heading" className="px-6 py-24 bg-gray-900 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs font-bold tracking-wider mb-8">
              <Package className="w-3 h-3" />
              SELF-HOST
            </div>
            <h2 id="selfhost-heading" className="text-3xl md:text-5xl font-black tracking-tighter text-white mb-6 leading-tight">
              Your server. Your data.<br />Up in 3 steps.
            </h2>
            <p className="text-gray-400 text-lg mb-14 max-w-xl mx-auto">
              Deploy Joino on any Linux server, VPS, or local machine. Docker handles everything — database, backend, and frontend.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left mb-14">
              {SELF_HOST_STEPS.map(({ step, title, code, icon: Icon }) => (
                <div key={step} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-colors">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Step {step}</span>
                  </div>
                  <p className="text-sm font-bold text-white mb-3">{title}</p>
                  <div className="bg-black/40 rounded-lg px-4 py-3 border border-white/5">
                    <code className="text-xs text-emerald-400 font-mono break-all">{code}</code>
                  </div>
                </div>
              ))}
            </div>

            <a
              href="https://github.com/huynhhuynh02/joino#readme"
              target="_blank"
              rel="noopener noreferrer"
              id="selfhost-docs-cta"
            >
              <Button size="lg" variant="outline" className="h-12 px-8 rounded-xl font-bold border-white/20 text-white hover:bg-white/10 gap-2">
                <ExternalLink className="w-4 h-4" />
                Read full documentation
              </Button>
            </a>
          </div>
        </section>

        {/* ── Contribute / Open Source ── */}
        <section id="contribute" aria-labelledby="contribute-heading" className="px-6 py-24 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-100 text-amber-600 text-xs font-bold tracking-wider mb-6">
                  <Heart className="w-3 h-3" />
                  OPEN SOURCE
                </div>
                <h2 id="contribute-heading" className="text-3xl md:text-4xl font-black tracking-tighter text-gray-900 mb-6 leading-tight">
                  Built in public.<br />Improved by the community.
                </h2>
                <p className="text-gray-500 leading-relaxed mb-8">
                  Joino is developed openly. Every line of code is available on GitHub. Whether you spot a bug, have a feature idea, or want to add a new language — contributions are always welcome.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <a
                    href="https://github.com/huynhhuynh02/joino"
                    target="_blank"
                    rel="noopener noreferrer"
                    id="github-contribute-cta"
                  >
                    <Button size="lg" className="h-12 px-6 rounded-xl font-bold gap-2">
                      <GitBranch className="w-4 h-4" />
                      View source on GitHub
                    </Button>
                  </a>
                  <a
                    href="https://github.com/huynhhuynh02/joino/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button size="lg" variant="outline" className="h-12 px-6 rounded-xl font-bold border-gray-200 gap-2">
                      <Star className="w-4 h-4" />
                      Report an issue
                    </Button>
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: GitBranch, title: 'Fork it', desc: 'Fork the repo and customize Joino exactly for your team.', color: 'bg-primary/10 text-primary' },
                  { icon: Star, title: 'Star it', desc: 'Give the project a ⭐ to help more developers discover it.', color: 'bg-amber-50 text-amber-600' },
                  { icon: Heart, title: 'Contribute', desc: 'Submit PRs for bug fixes, features, or translations.', color: 'bg-rose-50 text-rose-500' },
                  { icon: Globe, title: 'Translate', desc: 'Help add new languages — currently EN, VI, JA supported.', color: 'bg-teal-50 text-teal-500' },
                ].map(({ icon: Icon, title, desc, color }) => (
                  <div key={title} className="bg-gray-50 border border-gray-100 rounded-2xl p-5 hover:border-gray-200 hover:shadow-sm transition-all duration-200">
                    <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center mb-3`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <p className="text-sm font-bold text-gray-900 mb-1">{title}</p>
                    <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Commercial use / Contact ── */}
        <section aria-labelledby="commercial-heading" className="px-6 py-20 bg-gray-50 border-t border-gray-100">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-200 text-gray-600 text-xs font-bold tracking-wider mb-6">
              COMMERCIAL USE
            </div>
            <h2 id="commercial-heading" className="text-2xl md:text-4xl font-black tracking-tighter text-gray-900 mb-4">
              Want to use Joino for your business?
            </h2>
            <p className="text-gray-500 text-lg leading-relaxed mb-8 max-w-xl mx-auto">
              Joino is MIT licensed — you can self-host and use it commercially for free. If you're looking for a managed deployment, onboarding help, or custom development, feel free to get in touch directly.
            </p>
            <a href="mailto:huynhhuynh02@gmail.com" id="contact-commercial-cta">
              <Button size="lg" variant="outline" className="h-14 px-8 rounded-2xl font-bold border-gray-300 hover:border-gray-400 gap-3 text-base">
                <Mail className="w-5 h-5" />
                Contact for commercial inquiries
              </Button>
            </a>
            <p className="text-xs text-gray-400 mt-4">We usually respond within 24 hours.</p>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section aria-labelledby="cta-heading" className="px-6 py-24 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="relative bg-gray-900 rounded-[40px] px-8 py-20 text-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-transparent to-emerald-600/20 opacity-60" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-64 bg-primary/20 blur-3xl rounded-full" />

              <div className="relative z-10">
                <h2 id="cta-heading" className="text-3xl md:text-5xl font-black tracking-tighter text-white mb-6 leading-tight">
                  Open source.<br />Ready for your team.
                </h2>
                <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
                  Clone it, host it, customize it. Joino is built for teams that value ownership and transparency.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <a
                    href="https://github.com/huynhhuynh02/joino"
                    target="_blank"
                    rel="noopener noreferrer"
                    id="final-github-cta"
                  >
                    <Button size="lg" className="h-14 px-10 rounded-2xl bg-white text-gray-900 hover:bg-gray-100 font-black text-base gap-2 shadow-2xl hover:-translate-y-0.5 transition-transform">
                      <GitBranch className="w-5 h-5" />
                      Star on GitHub
                    </Button>
                  </a>
                  <Link href="/login" id="final-demo-cta">
                    <Button variant="ghost" size="lg" className="h-14 px-8 rounded-2xl text-white hover:bg-white/10 font-medium">
                      Try the live demo →
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer role="contentinfo" className="border-t border-gray-100 px-6 py-12 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center shadow-md shadow-primary/25">
                <Zap className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-lg font-extrabold tracking-tight text-gray-900">Joino</span>
              <span className="text-xs text-gray-400">— Open Source</span>
            </div>

            <div className="flex items-center gap-8 flex-wrap justify-center">
              <a href="https://github.com/huynhhuynh02/joino" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5" /> GitHub
              </a>
              <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Live Demo</Link>
              <a href="mailto:huynhhuynh02@gmail.com" className="text-sm text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> Contact
              </a>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">© 2026 Joino · MIT License</span>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-gray-400">joino.cloud online</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
