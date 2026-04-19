import { Metadata } from 'next';
import Link from 'next/link';
import { 
  Rocket, 
  CheckCircle2, 
  BarChart3, 
  Users2, 
  Layout, 
  ShieldCheck, 
  ArrowRight,
  Zap,
  Globe,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Joino | Modern Project Management for SaaS Teams',
  description: 'Streamline your team collaboration, task management, and project tracking with Joino. The all-in-one high-fidelity workspace for modern SaaS startups.',
  keywords: ['project management', 'saas', 'team collaboration', 'task tracking', 'wrike alternative', 'productivity'],
  openGraph: {
    title: 'Joino | Modern Project Management',
    description: 'High-fidelity project management for modern teams.',
    images: ['/mockup.png'],
  },
};

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white selection:bg-primary/20">
      {/* ─── Navigation ─── */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-primary/20">
            J
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900">Joino</span>
        </div>
        
        <nav className="hidden md:flex items-center gap-8">
          <Link href="#features" className="text-sm font-medium text-gray-500 hover:text-primary transition-colors">Features</Link>
          <Link href="#solutions" className="text-sm font-medium text-gray-500 hover:text-primary transition-colors">Solutions</Link>
          <Link href="#pricing" className="text-sm font-medium text-gray-500 hover:text-primary transition-colors">Pricing</Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="font-medium text-gray-600">Log In</Button>
          </Link>
          <Link href="/register">
            <Button size="sm" className="font-semibold shadow-md shadow-primary/20">Get Started</Button>
          </Link>
        </div>
      </header>

      <main className="flex-grow pt-24">
        {/* ─── Hero Section ─── */}
        <section className="relative px-6 py-20 md:py-32 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-primary/5 to-transparent blur-[120px] -z-10 rounded-full" />
          
          <div className="max-w-7xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
               <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
               NEXT-GEN SAAS PROJECT MANAGEMENT
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-gray-900 mb-8 max-w-4xl mx-auto leading-[1.1] animate-in fade-in slide-in-from-bottom-8 duration-700">
              The platform where <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-500 italic">teams thrive</span> and projects flow.
            </h1>
            
            <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-12 duration-1000">
              A high-fidelity workspace designed for modern teams. Consolidate your tasks, team, and goals into a single, beautiful experience.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
              <Link href="/register">
                <Button size="lg" className="h-14 px-8 text-lg font-bold rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform">
                  Start Your Journey <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="h-14 px-8 text-lg font-medium rounded-2xl border-gray-200">
                Book a Demo
              </Button>
            </div>

            {/* App Mockup Rendering */}
            <div className="relative group max-w-6xl mx-auto rounded-3xl p-2 bg-gradient-to-b from-gray-200 via-gray-100 to-white shadow-2xl overflow-hidden scale-95 transition-all duration-1000">
              <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none" />
              <img 
                src="/mockup.png" 
                alt="Joino Dashboard High-Fidelity Mockup"
                className="w-full h-auto rounded-2xl shadow-inner shadow-black/5"
                width={1200}
                height={800}
              />
            </div>
          </div>
        </section>

        {/* ─── Features Grid ─── */}
        <section id="features" className="px-6 py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight text-gray-900">Built for Performance</h2>
              <p className="text-gray-500 max-w-xl mx-auto text-lg">
                Stop jumping between tabs. Joino combines everything your team needs in a seamless interface.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { 
                  icon: <Layout className="w-10 h-10 text-primary" />, 
                  title: 'Kanban & Timeline', 
                  desc: 'Visualize work your way. Switch between list, board, and gantt views instantly.' 
                },
                { 
                  icon: <Users2 className="w-10 h-10 text-emerald-500" />, 
                  title: 'Team Alignment', 
                  desc: 'Keep everyone in sync with real-time comments, @mentions, and presence indicators.' 
                },
                { 
                  icon: <BarChart3 className="w-10 h-10 text-blue-500" />, 
                  title: 'Insights API', 
                  desc: 'Make data-driven decisions with automated reporting and team performance audits.' 
                },
                { 
                  icon: <Zap className="w-10 h-10 text-purple-500" />, 
                  title: 'Automation Engine', 
                  desc: 'Automate repetitive tasks and status updates with our rule-based workflow engine.' 
                },
                { 
                  icon: <ShieldCheck className="w-10 h-10 text-rose-500" />, 
                  title: 'Secure by Design', 
                  desc: 'Enterprise-grade security with SSO, MFA, and granular role-based access control.' 
                },
                { 
                  icon: <Globe className="w-10 h-10 text-amber-500" />, 
                  title: 'Global Workspace', 
                  desc: 'Distributed-first design that keeps teams connected across timezones and regions.' 
                }
              ].map((feature, i) => (
                <Card key={i} className="border-none shadow-none bg-white hover:bg-white hover:shadow-2xl hover:shadow-gray-200/50 transition-all duration-300 rounded-3xl p-4 overflow-hidden group">
                  <CardContent className="pt-6">
                    <div className="mb-6 p-3 rounded-2xl bg-gray-50 w-fit group-hover:bg-primary group-hover:text-white transition-colors duration-500">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-gray-900">{feature.title}</h3>
                    <p className="text-gray-500 leading-relaxed">{feature.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Product Deep Dive ─── */}
        <section className="px-6 py-24 bg-white">
          <div className="max-w-7xl mx-auto space-y-32">
            {/* Feature 1: Collaboration */}
            <div className="flex flex-col md:flex-row items-center gap-16">
              <div className="flex-1 space-y-6">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">01</div>
                <h2 className="text-4xl font-extrabold tracking-tight text-gray-900">Collaboration built for speed</h2>
                <p className="text-xl text-gray-500 leading-relaxed">
                  Engage your team where the work happens. With real-time chat, instant @mentions, and live activity streams, you'll never lose context again.
                </p>
                <ul className="space-y-4">
                  {['Live cursor presence', 'Rich text comments with attachments', 'Contextual chat threads'].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-gray-700 font-medium">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex-1 relative group">
                <div className="absolute -inset-4 bg-emerald-500/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity rounded-[32px] -z-10" />
                <img 
                  src="/collaboration.png" 
                  alt="Team Collaboration Interface" 
                  className="rounded-[32px] shadow-2xl border border-gray-100 w-full h-auto"
                />
              </div>
            </div>

            {/* Feature 2: Analytics */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-16">
              <div className="flex-1 space-y-6">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">02</div>
                <h2 className="text-4xl font-extrabold tracking-tight text-gray-900">Insights that drive results</h2>
                <p className="text-xl text-gray-500 leading-relaxed">
                  Turn raw tasks into actionable intelligence. Our automated reporting engine tracks team velocity, project health, and resource allocation.
                </p>
                <ul className="space-y-4">
                  {['Automated weekly digests', 'Customizable KPI dashboards', 'Resource workload heatmaps'].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-gray-700 font-medium">
                      <CheckCircle2 className="w-5 h-5 text-blue-500" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex-1 relative group">
                <div className="absolute -inset-4 bg-blue-500/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity rounded-[32px] -z-10" />
                <img 
                  src="/analytics.png" 
                  alt="Advanced Analytics Dashboard" 
                  className="rounded-[32px] shadow-2xl border border-gray-100 w-full h-auto shadow-blue-500/10"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ─── PRICING ─── */}
        <section id="pricing" className="px-6 py-24">
           <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tight text-gray-900">Simple SaaS Pricing</h2>
              <p className="text-gray-500 text-lg">No hidden fees. Scale with your team as you grow.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Free Plan */}
              <div className="border border-gray-100 rounded-[32px] p-10 bg-white hover:border-gray-200 transition-colors">
                <div className="mb-10">
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Basic</span>
                  <p className="text-2xl font-bold mt-2 text-gray-900">$0</p>
                  <p className="text-gray-400 text-sm">Free forever for individuals</p>
                </div>
                <div className="space-y-4 mb-10">
                  <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-primary" /> Unlimited Tasks
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-primary" /> 3 Active Projects
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-primary" /> 500MB Storage
                  </div>
                </div>
                <Button variant="outline" className="w-full h-12 rounded-xl">Get Started</Button>
              </div>

              {/* Pro Plan */}
              <div className="relative border-2 border-primary rounded-[32px] p-10 bg-white shadow-2xl shadow-primary/10">
                <div className="absolute top-0 right-10 -translate-y-1/2 px-4 py-1.5 bg-primary text-white text-xs font-bold rounded-full">
                  MOST POPULAR
                </div>
                <div className="mb-10">
                  <span className="text-xs font-bold uppercase tracking-widest text-primary">Grow</span>
                  <div className="flex items-baseline gap-1 mt-2">
                    <p className="text-4xl font-extrabold tracking-tighter text-gray-900">$12</p>
                    <span className="text-gray-400 font-medium font-serif">/mo</span>
                  </div>
                  <p className="text-gray-500 text-sm mt-1">Per user, billed yearly</p>
                </div>
                <div className="space-y-4 mb-10">
                  <div className="flex items-center gap-2 text-sm text-gray-800 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-primary" /> Unlimited Projects
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-800 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-primary" /> Global Search
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-800 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-primary" /> Priority Support
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-800 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-primary" /> Custom Fields
                  </div>
                </div>
                <Button className="w-full h-12 rounded-xl font-bold shadow-lg shadow-primary/20">Upgrade Now</Button>
              </div>

              {/* Enterprise Plan */}
              <div className="border border-gray-100 rounded-[32px] p-10 bg-white hover:border-gray-200 transition-colors">
                <div className="mb-10">
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Scale</span>
                  <p className="text-2xl font-bold mt-2 text-gray-900">Contact Us</p>
                  <p className="text-gray-400 text-sm">For large organizations</p>
                </div>
                <div className="space-y-4 mb-10">
                  <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-primary" /> Unlimited Users
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-primary" /> Dedicated Manager
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-primary" /> API Access
                  </div>
                </div>
                <Button variant="outline" className="w-full h-12 rounded-xl">Contact Sales</Button>
              </div>
            </div>
           </div>
        </section>

        {/* ─── Footer CTA ─── */}
        <section className="px-6 py-24 text-center">
          <div className="max-w-5xl mx-auto rounded-[40px] bg-gray-900 px-8 py-20 text-white relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-primary/20 to-transparent -z-0 opacity-50" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-extrabold mb-8 max-w-2xl mx-auto leading-tight">
                Ready to transform the way your team works?
              </h2>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/register">
                  <Button size="lg" className="h-14 px-10 rounded-2xl bg-white text-gray-900 hover:bg-gray-100 font-bold">
                    Start Free Trial
                  </Button>
                </Link>
                <div className="flex -space-x-3 items-center">
                   {[1,2,3,4].map(i => (
                     <div key={i} className="w-10 h-10 rounded-full border-2 border-gray-900 bg-gray-800 flex items-center justify-center text-[10px] font-bold">
                       {String.fromCharCode(64 + i)}
                     </div>
                   ))}
                   <div className="w-10 h-10 rounded-full border-2 border-gray-900 bg-primary flex items-center justify-center text-xs font-bold">
                     <Plus className="w-3 h-3" />
                   </div>
                   <span className="flex items-center ml-4 text-sm text-gray-400 font-medium underline underline-offset-4 decoration-primary cursor-pointer hover:text-white transition-colors">
                     Join 500+ teams today
                   </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-100 px-6 py-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center text-white text-[10px] font-bold">
              J
            </div>
            <span className="text-lg font-bold tracking-tight text-gray-900">Joino</span>
          </div>

          <p className="text-sm text-gray-500 text-center md:text-left">&copy; 2026 Joino SaaS Inc. All rights reserved.</p>

          <div className="flex items-center gap-6">
             <Link href="#" className="text-gray-400 hover:text-primary transition-colors hover:scale-110 active:scale-90"><Rocket className="w-5 h-5" /></Link>
             <Link href="#" className="text-gray-400 hover:text-primary transition-colors hover:scale-110 active:scale-90"><Zap className="w-5 h-5" /></Link>
             <Link href="#" className="text-gray-400 hover:text-primary transition-colors hover:scale-110 active:scale-90"><ArrowRight className="w-5 h-5" /></Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
