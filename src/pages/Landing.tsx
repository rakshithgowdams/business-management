import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, Zap, Shield, BarChart3, Wallet, Target, FileText, Calculator, Receipt, RefreshCw, Users, Briefcase, Brain, Megaphone, MessageSquare, Bot, TrendingUp, Clock, Star, ChevronDown, ChevronRight, Building2, GitBranch, Camera, Mic, Image, Video, ClipboardList, UserCheck, Activity, Globe, Award, Play, PieChart, Layers, Cpu, Lock, HeartPulse, CalendarCheck, Bell, FolderOpen, Handshake, Search, Menu, X, ShoppingCart, Gift, Sparkles, ExternalLink, BadgeCheck, LayoutDashboard, Kanban, Ligature as FileSignature, BarChart2, Workflow, Palette, Music, Wand2, ScanLine, LineChart, BookOpen, MonitorPlay, TestTube2, Rocket } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'AI Tools', href: '#ai' },
  { label: 'Marketing', href: '#marketing' },
  { label: 'Roadmap', href: '#roadmap' },
  { label: 'Pricing', href: '#pricing' },
];

const STATS = [
  { value: '40+', label: 'Modules', icon: Layers },
  { value: '40+', label: 'AI Models', icon: Brain },
  { value: '100%', label: 'GST Compliant', icon: CheckCircle },
  { value: '₹0', label: 'Start for Free', icon: Star },
];

const FEATURE_GROUPS = [
  {
    category: 'Finance & Billing',
    color: 'from-amber-500 to-orange-500',
    bgAccent: 'amber',
    features: [
      { icon: Wallet, title: 'Income Tracker', desc: 'Multi-source income tracking with category tags, project/invoice links, multi-currency support, and GST-ready reporting.' },
      { icon: ScanLine, title: 'Expense Management', desc: 'AI receipt scanner via Gemini OCR. Categorize by 15+ types, set budget limits per category, track vendor & payment method.' },
      { icon: FileText, title: 'Invoice Builder', desc: 'GST invoices with 4 premium themes, digital signature, bank details, client linking, PDF export, and overdue tracking.' },
      { icon: FileText, title: 'Quotation Builder', desc: 'Professional quotations with line items, tax breakdowns, and one-click conversion to invoice. Track accepted vs. rejected.' },
      { icon: BarChart3, title: 'GST Tracker', desc: 'Auto-calculate CGST/SGST/IGST from invoices & expenses. Input tax credit tracking. GSTR-1 ready monthly summaries.' },
      { icon: Calculator, title: 'EMI & Loan Tracker', desc: 'Full amortization schedules, principal vs. interest breakdowns, upcoming payment alerts, and multi-loan management.' },
      { icon: RefreshCw, title: 'Subscription Manager', desc: 'Track all SaaS tools, AI APIs, and services. Auto-detect renewals, monitor monthly burn, and get cancellation reminders.' },
      { icon: Target, title: 'Goals & Savings', desc: 'Set 6 goal types — Save, Earn, Reduce Spend, Milestone, Invest, Debt Payoff — with visual progress rings and timeline.' },
    ],
  },
  {
    category: 'Business Operations',
    color: 'from-sky-500 to-blue-600',
    bgAccent: 'sky',
    features: [
      { icon: GitBranch, title: 'Sales Pipeline CRM', desc: 'Kanban deal board with 6 stages, deal value & probability tracking, win rate analytics, and hot deal identification.' },
      { icon: Briefcase, title: 'Project Management', desc: 'End-to-end project tracking with budget vs. actuals, expense tabs, team allocation, profitability calculation, and timelines.' },
      { icon: Users, title: 'Client Management', desc: 'Full CRM with interaction logs, invoice & project history, client source tracking, revenue per client, and relationship health.' },
      { icon: FileSignature, title: 'Agreement Builder', desc: 'AI-generated contracts with 10+ templates — service, NDA, website, marketing. Clauses, milestones, signatures, PDF export.' },
      { icon: FolderOpen, title: 'Document Vault', desc: 'Secure cloud document storage with upload, search, tagging, template library, and version management.' },
      { icon: Bell, title: 'Follow-up Engine', desc: 'Multi-step sequences via WhatsApp, Email, and LinkedIn. Status tracking: Sent, Pending, Overdue. Message preview before sending.' },
      { icon: CalendarCheck, title: 'AI Meeting Prep', desc: 'Auto-generates client briefs with company profile, project status, invoice history, talking points, and custom agenda.' },
      { icon: Building2, title: 'Onboarding Manager', desc: 'Structured pipeline for client & employee onboarding — stage tracking, checklist management, document collection, activity log.' },
    ],
  },
  {
    category: 'Team & HR',
    color: 'from-emerald-500 to-teal-600',
    bgAccent: 'emerald',
    features: [
      { icon: UserCheck, title: 'Employee Management', desc: 'Full profiles with department, role, employment type, salary, hourly rate, payroll overview, and document management.' },
      { icon: Activity, title: 'HR Suite', desc: 'Hiring pipeline with job postings, applicant tracking, leave management with approval workflow, appraisals, and HR policies.' },
      { icon: ClipboardList, title: 'Task Management', desc: 'Advanced task board with role-based assignment, priorities, email notifications, alert center, analytics, and logged hours.' },
      { icon: Clock, title: 'Work Tracker', desc: 'Kanban boards + timesheets with project linking, billable hour tracking, kanban/list/calendar view, and overdue detection.' },
      { icon: MessageSquare, title: 'Team Messenger', desc: 'E2E encrypted chat, group creation, file attachments, pinned messages, message forwarding, approval workflow, AI chat panel.' },
      { icon: Shield, title: 'Roles & Permissions', desc: 'Granular module-level permissions per team member. Control what each employee can view, edit, or manage across the system.' },
    ],
  },
  {
    category: 'Analytics & Intelligence',
    color: 'from-rose-500 to-pink-600',
    bgAccent: 'rose',
    features: [
      { icon: LayoutDashboard, title: 'Customizable Dashboard', desc: '30+ drag-and-drop widgets — KPI cards, revenue charts, pipeline status, task overview, HR metrics, and health score.' },
      { icon: HeartPulse, title: 'Business Health Score', desc: 'AI scores 10 metrics in real-time: revenue growth, invoice health, profit margin, pipeline strength, team productivity.' },
      { icon: LineChart, title: 'Weekly AI Summary', desc: 'Auto-generated every week: revenue recap, top clients, risk flags, task completion, team performance, and next-week priorities.' },
      { icon: BarChart2, title: 'Financial Analytics', desc: 'Revenue vs. expenses bar charts, profit margin trends, cash flow lines, GST breakdowns, income source rankings.' },
      { icon: Activity, title: 'HR Analytics', desc: 'Department headcount, payroll analysis, leave utilization, hiring velocity, attrition trends, and performance rating distributions.' },
      { icon: PieChart, title: 'AI Usage Tracker', desc: 'Real-time token usage monitoring, cost-per-model analytics, spending forecasts, and model performance comparisons.' },
    ],
  },
  {
    category: 'Website & Brand',
    color: 'from-violet-500 to-fuchsia-600',
    bgAccent: 'violet',
    features: [
      { icon: Globe, title: 'Website Builder', desc: 'No-code builder with 15+ section types — hero, services, pricing, FAQ, gallery, testimonials. Drag-and-drop reordering.' },
      { icon: Palette, title: 'Brand Kit', desc: 'Manage your brand colors, typography, logos, and visual guidelines. Apply consistently across all documents and exports.' },
      { icon: MonitorPlay, title: 'Live Preview', desc: 'Real-time desktop, tablet, and mobile preview as you build. Section-by-section enable/disable toggling.' },
      { icon: Users, title: 'Website Leads', desc: 'Capture and manage leads from your website\'s contact and free-call sections. Direct CRM integration.' },
      { icon: FileText, title: 'Public Website', desc: 'Publish a professional public-facing website for your business with animated sections and custom domain support.' },
      { icon: Layers, title: 'Section Templates', desc: '15+ pre-built section templates — About, Stats, Blog, CTA, Pricing, Team, and more. Fully customizable content.' },
    ],
  },
];

const AI_FEATURES = [
  { icon: HeartPulse, title: 'Business Health Score', desc: 'Real-time AI score across 10 metrics — revenue growth, invoice health, profit margin, pipeline strength. Weekly trends, PDF/Word export.', badge: 'Real-time' },
  { icon: Brain, title: 'AI Intelligence Hub', desc: '5-step pipeline: business analysis, ROI calculator, cold outreach generator, competitor research, and proposal writer — all Gemini-powered.', badge: 'Gemini AI' },
  { icon: Bot, title: 'Weekly AI Summary', desc: 'Auto-generated every week: revenue recap, top clients, risk flags, task completion rate, team performance, and prioritized next-week actions.', badge: 'Auto' },
  { icon: Search, title: 'AI Meeting Prep', desc: 'Enter a client name and get a complete brief: company background, project history, invoice status, talking points, and a custom meeting agenda.', badge: 'Smart' },
  { icon: Cpu, title: 'Team AI Assistant', desc: 'Embedded AI in the team messenger and task board. Ask questions, get daily digests, generate subtasks, and query business data in plain English.', badge: 'Contextual' },
  { icon: FileSignature, title: 'Agreement AI', desc: 'Generates full contracts: service scope, payment milestones, IP rights, confidentiality, termination, and dispute resolution — customized per project.', badge: 'Legal-ready' },
  { icon: ScanLine, title: 'AI Receipt Scanner', desc: 'Photograph any receipt and Gemini AI extracts vendor, amount, date, and category automatically — instantly logged as an expense.', badge: 'Gemini OCR' },
  { icon: Wand2, title: 'AI Model Selector', desc: 'Smart auto-mode picks the best AI model per task across 40+ models — Claude, GPT-5, Gemini, Llama. Tracks cost and performance per model.', badge: '40+ Models' },
  { icon: TestTube2, title: 'API Console & Playground', desc: 'Live API playground to test custom AI models, parse cURL commands, and build your own integrations via the OpenRouter-compatible endpoint.', badge: 'Dev-ready' },
];

const MARKETING_FEATURES = [
  {
    icon: Image,
    title: 'AI Image Studio',
    desc: 'Text-to-image, image-to-image transformation, and advanced editing. Supports Stable Diffusion, FLUX Pro, FLUX Realism, Leonardo AI, and custom model APIs.',
    tags: ['Text to Image', 'Img-to-Img', 'FLUX / SD', 'Custom Models'],
  },
  {
    icon: Video,
    title: 'AI Video & Cinematic Studio',
    desc: 'Full cinematic pipeline: hero frame generation, script-to-vision, camera rig builder, camera motion, bridge to video, and final export. Powered by Kling 3.0, Luma, HunyuanVideo, and Wanx.',
    tags: ['Kling 3.0', 'Camera Motion', 'Cinematic', 'Luma / Wan'],
  },
  {
    icon: Mic,
    title: 'Voice & Music Studio',
    desc: 'AI voice generation with ElevenLabs, text-to-speech, music composition with Suno AI. Create voiceovers, background tracks, and podcast audio — all in-platform.',
    tags: ['ElevenLabs', 'Suno AI', 'Voice Gen', 'Music Comp'],
  },
  {
    icon: Camera,
    title: 'Graphic Designer Suite',
    desc: 'Ad creator, banner generator, carousel builder, mockup studio, post designer, and NanaBanana-style layout tools. Brand-consistent outputs with your kit applied automatically.',
    tags: ['Ad Creator', 'Banners', 'Carousels', 'Mockups'],
  },
  {
    icon: Workflow,
    title: 'Character & UGC AI',
    desc: 'Generate AI characters, train custom character models, build a character library, and produce UGC-style video content. Ads, reels, and product demos powered by your brand characters.',
    tags: ['Character AI', 'UGC Creator', 'Brand Chars', 'Training'],
  },
  {
    icon: Globe,
    title: 'SMM Agent & Content Calendar',
    desc: 'AI-assisted post creation, multi-platform content calendar, workflow automation engine, and analytics. Schedule and auto-publish to Instagram, Facebook, and LinkedIn.',
    tags: ['Auto Publish', 'Content Cal', 'Workflow', 'Analytics'],
  },
  {
    icon: Megaphone,
    title: 'Digital Marketing Hub',
    desc: 'Unified dashboard for Google Ads (campaigns, ad groups, keywords), Meta Ads (campaigns, ad sets, creatives), and offline B2B marketing events and outreach.',
    tags: ['Google Ads', 'Meta Ads', 'Offline B2B', 'Lead Track'],
  },
  {
    icon: Cpu,
    title: 'API Console & Custom Models',
    desc: 'Live API playground, cURL command parser, saved model library, and OpenRouter-compatible endpoint. Bring your own model and integrate any AI API into your workflow.',
    tags: ['API Playground', 'cURL Parser', 'OpenRouter', 'Custom API'],
  },
];

const HOW_IT_WORKS = [
  { num: '01', icon: UserCheck, title: 'Create Your Account', desc: 'Sign up with just your email. No credit card required. Set up your business profile in under 2 minutes.' },
  { num: '02', icon: Layers, title: 'Connect Your Business', desc: 'Add clients, projects, employees, and financial data. Import existing data or start fresh — it\'s your choice.' },
  { num: '03', icon: Brain, title: 'Let AI Do the Heavy Lifting', desc: 'AI analyses your data, generates reports, prepares meetings, drafts agreements, and surfaces insights automatically.' },
  { num: '04', icon: TrendingUp, title: 'Grow with Confidence', desc: 'Make data-driven decisions backed by real-time health scores, revenue forecasts, and business intelligence.' },
];

const TESTIMONIALS = [
  { name: 'Rajesh Menon', role: 'Founder, TechSpark India', text: 'The agreement builder alone saves me 3 hours per client. The AI writes better contracts than I used to!', avatar: 'RM', color: 'from-amber-500 to-orange-500' },
  { name: 'Priya Hegde', role: 'Digital Agency Owner', text: 'I manage 12 team members, 40+ clients, and 3 campaigns — all from one screen. Game changer.', avatar: 'PH', color: 'from-sky-500 to-blue-500' },
  { name: 'Suresh Gowda', role: 'Freelance Consultant', text: 'GST filing used to take me a full day. Now it\'s 15 minutes. The auto-calculations are spot on.', avatar: 'SG', color: 'from-emerald-500 to-teal-500' },
];

const PRICING_PLANS = [
  {
    name: 'Starter',
    price: 'Free',
    period: 'forever',
    badge: null,
    desc: 'Perfect for solopreneurs and freelancers getting started.',
    features: [
      'Dashboard & Business Health Score',
      'Income & Expense Tracking',
      'Invoice & Quotation Builder',
      'Client & Project Management',
      'GST & EMI Tracker',
      'Goal & Savings Tracker',
      'Document Vault',
      'Subscription Manager',
    ],
    cta: 'Get Started Free',
    highlight: false,
    ctaLink: '/signup',
  },
  {
    name: 'Pro',
    price: '₹999',
    period: 'per month',
    badge: 'Most Popular',
    desc: 'Everything you need to run and grow your business with AI.',
    features: [
      'Everything in Starter — unlimited',
      'AI Intelligence Hub (Gemini-powered)',
      'Agreement Builder with AI Clauses',
      'Team Messenger & Task Management',
      'Work Tracker & Timesheets',
      'Marketing Studio (Image + Video AI)',
      'HR Management, Hiring & Payroll',
      'SMM Agent & Content Calendar',
      'Digital Marketing Hub',
      'Sales Pipeline & CRM',
      'Weekly AI Summary & Reports',
      'All future features included — v1.0 & beyond',
    ],
    cta: 'Start Pro — ₹999/mo',
    highlight: true,
    ctaLink: '/signup',
  },
  {
    name: 'Custom',
    price: 'Custom',
    period: 'tailored for you',
    badge: null,
    desc: 'A fully custom solution built around your business needs.',
    features: [
      'Everything in Pro',
      'Custom AI model integrations',
      'White-label branding & PDF reports',
      'Multi-workspace & team management',
      'Dedicated onboarding & setup',
      'Custom workflows & automations',
      'Priority support with SLA',
      'All current & future features',
    ],
    cta: 'Talk to Us',
    highlight: false,
    ctaLink: '/signup',
  },
];

const FUTURE_FEATURES = [
  {
    category: 'AI & Automation',
    color: 'from-orange-500 to-amber-500',
    icon: Brain,
    items: [
      { title: 'AI Voice Call Agent', desc: 'Automated AI phone agent that calls leads, follows up on invoices, and schedules meetings on your behalf.' },
      { title: 'Predictive Revenue Forecasting', desc: 'ML-based revenue prediction using your historical income patterns, pipeline, and seasonal trends.' },
      { title: 'Auto Invoice Matching', desc: 'AI automatically matches bank transactions to invoices and marks them paid without manual input.' },
      { title: 'Smart Contract Negotiation AI', desc: 'AI suggests contract clause revisions, flags risky terms, and benchmarks against industry standards.' },
    ],
  },
  {
    category: 'Finance & Payments',
    color: 'from-emerald-500 to-teal-500',
    icon: Wallet,
    items: [
      { title: 'UPI & Razorpay Integration', desc: 'Accept payments directly from invoices via UPI, Razorpay, and Stripe. Auto-reconcile on payment.' },
      { title: 'Tally & Zoho Books Sync', desc: 'Two-way sync with Tally ERP and Zoho Books. Keep your accountant in the loop without data entry.' },
      { title: 'Multi-Entity Accounting', desc: 'Manage finances for multiple business entities or subsidiaries under one login.' },
      { title: 'Tax Filing Assistant', desc: 'AI-guided ITR filing, advance tax reminders, and TDS compliance for freelancers and agencies.' },
    ],
  },
  {
    category: 'Marketing & Growth',
    color: 'from-sky-500 to-blue-600',
    icon: Megaphone,
    items: [
      { title: 'Email Marketing Studio', desc: 'Design, schedule, and send bulk email campaigns with open rate tracking and AI-written copy.' },
      { title: 'WhatsApp Business API', desc: 'Native WhatsApp broadcast campaigns, automated follow-ups, and template message management.' },
      { title: 'Affiliate & Referral Tracker', desc: 'Build and track an affiliate program for your services with commission management and payouts.' },
      { title: 'SEO Content Generator', desc: 'AI-powered long-form blog writer, meta tag optimizer, and keyword research tool for your website.' },
    ],
  },
  {
    category: 'Operations & Scale',
    color: 'from-rose-500 to-pink-600',
    icon: Rocket,
    items: [
      { title: 'Client Portal', desc: 'A white-labeled self-service portal where clients can view invoices, approve quotations, and track project progress.' },
      { title: 'Mobile App (iOS & Android)', desc: 'Full-featured native mobile app to manage your business on the go with push notifications and offline support.' },
      { title: 'Custom Workflow Builder', desc: 'No-code automation builder to trigger actions across modules — e.g., auto-create task when invoice is paid.' },
      { title: 'Marketplace Integrations', desc: 'Direct integrations with Upwork, Fiverr, LinkedIn, Razorpay, Stripe, Slack, and Zapier.' },
    ],
  },
];

const TRUST_BADGES = [
  { icon: Shield, label: 'Bank-grade Security', sub: 'AES-256 encryption' },
  { icon: Lock, label: 'End-to-End Encrypted', sub: 'Team messages & files' },
  { icon: CheckCircle, label: 'GST Compliant', sub: 'India tax laws built-in' },
  { icon: Award, label: 'DPDP Act 2023', sub: 'Data privacy compliant' },
];

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function AnimSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const { ref, inView } = useInView();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
    >
      {children}
    </div>
  );
}

function GradientOrb({ className }: { className: string }) {
  return <div className={`absolute rounded-full blur-3xl pointer-events-none ${className}`} />;
}

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [activeGroup, setActiveGroup] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const faqs = [
    { q: 'Is MyDesignNexus really free to start?', a: 'Yes! The Starter plan is completely free with no credit card required. You get full access to core finance and business modules including invoicing, expense tracking, and client management.' },
    { q: 'Do I need technical knowledge to use AI features?', a: 'Not at all. Simply type what you need in plain English — the AI handles everything. Whether it\'s writing agreements, generating meeting briefs, or creating marketing images, it just works.' },
    { q: 'Is my financial data secure?', a: 'Absolutely. All data is encrypted using AES-256 at rest and in transit. We are DPDP Act 2023 compliant and team messages use end-to-end encryption.' },
    { q: 'Can I use this for multiple businesses?', a: 'The Agency plan supports multi-workspace access, allowing you to manage multiple business profiles, clients, and teams from a single login.' },
    { q: 'Does it work for GST filing in India?', a: 'Yes. The GST Tracker automatically pulls data from your invoices and expenses, calculates CGST/SGST/IGST, and generates GSTR-1 ready summaries.' },
  ];

  return (
    <div className="min-h-screen bg-[#080a0f] text-white overflow-x-hidden">

      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#080a0f]/95 backdrop-blur-xl border-b border-white/[0.06] shadow-2xl' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/Group_3_(1).png" alt="MyDesignNexus" className="h-8 object-contain" />
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((l) => (
              <a key={l.label} href={l.href} className="text-sm text-gray-400 hover:text-white transition-colors font-medium">
                {l.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link to="/signup" className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl gradient-orange hover:opacity-90 transition-all shadow-lg shadow-orange-500/20 flex items-center gap-2">
              Get Started Free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <button className="md:hidden p-2 text-gray-400 hover:text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0d1017]/98 backdrop-blur-xl border-b border-white/[0.06] px-4 py-4 space-y-3">
            {NAV_LINKS.map((l) => (
              <a key={l.label} href={l.href} onClick={() => setMobileMenuOpen(false)} className="block py-2 text-gray-300 hover:text-white text-sm font-medium">
                {l.label}
              </a>
            ))}
            <div className="pt-3 border-t border-white/[0.06] flex flex-col gap-2">
              <Link to="/login" className="text-center py-2.5 text-sm font-medium text-gray-300 border border-white/10 rounded-xl">Sign In</Link>
              <Link to="/signup" className="text-center py-2.5 text-sm font-semibold text-white rounded-xl gradient-orange">Get Started Free</Link>
            </div>
          </div>
        )}
      </nav>

      <section className="relative pt-32 pb-24 px-4 overflow-hidden">
        <GradientOrb className="w-[600px] h-[600px] top-[-200px] left-[-200px] bg-orange-600/10" />
        <GradientOrb className="w-[400px] h-[400px] top-[100px] right-[-100px] bg-sky-600/8" />
        <GradientOrb className="w-[300px] h-[300px] bottom-0 left-1/2 -translate-x-1/2 bg-emerald-600/6" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.05] border border-orange-500/20 text-orange-400 text-sm font-medium mb-8 backdrop-blur-sm">
            <Zap className="w-3.5 h-3.5" />
            All-in-One Business OS for India
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-[64px] font-extrabold leading-[1.1] tracking-tight mb-6">
            Run Your Entire Business<br />
            <span className="gradient-text">From One Dashboard</span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Finance, CRM, HR, AI tools, Marketing Studio, and Team collaboration — built for Indian freelancers, agencies, and growing businesses.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              to="/signup"
              className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-white rounded-2xl gradient-orange hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-xl shadow-orange-500/25"
            >
              Start for Free <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#features"
              className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-gray-300 rounded-2xl border border-white/10 hover:border-white/20 hover:text-white transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" /> See All Features
            </a>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {STATS.map(({ value, label, icon: Icon }) => (
              <div key={label} className="text-center p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm">
                <Icon className="w-5 h-5 text-orange-400 mx-auto mb-2 opacity-80" />
                <div className="text-2xl font-extrabold gradient-text">{value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-20 max-w-6xl mx-auto relative z-10 px-4">
          <div className="rounded-3xl overflow-hidden border border-white/[0.08] shadow-2xl shadow-black/60">
            <div className="bg-[#0d1117]/90 backdrop-blur-xl px-4 py-3 flex items-center gap-2 border-b border-white/[0.06]">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-amber-500/70" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
              </div>
              <div className="flex-1 mx-4 bg-white/[0.04] rounded-lg px-3 py-1 text-xs text-gray-500 font-mono">app.mydesignnexus.com/dashboard</div>
            </div>
            <div className="bg-gradient-to-br from-[#0d1117] via-[#0f1420] to-[#0a0d14] p-6 sm:p-10">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {[
                  { label: 'Total Revenue', value: '₹4,82,500', change: '+18.4%', up: true },
                  { label: 'Active Projects', value: '12', change: '+3 this month', up: true },
                  { label: 'Health Score', value: '87/100', change: 'Excellent', up: true },
                  { label: 'Pending Invoices', value: '₹96,000', change: '4 invoices', up: false },
                ].map((s) => (
                  <div key={s.label} className="bg-white/[0.04] rounded-xl p-3 border border-white/[0.05]">
                    <div className="text-xs text-gray-500 mb-1">{s.label}</div>
                    <div className="text-lg font-bold text-white">{s.value}</div>
                    <div className={`text-xs font-medium mt-1 ${s.up ? 'text-emerald-400' : 'text-amber-400'}`}>{s.change}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: 'AI Health Score', score: 87, color: 'emerald' },
                  { label: 'Revenue vs Target', score: 76, color: 'orange' },
                  { label: 'Invoice Collection', score: 62, color: 'sky' },
                ].map((bar) => (
                  <div key={bar.label} className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.04]">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-gray-400">{bar.label}</span>
                      <span className="text-xs font-bold text-white">{bar.score}%</span>
                    </div>
                    <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${bar.color === 'emerald' ? 'bg-emerald-500' : bar.color === 'orange' ? 'bg-orange-500' : 'bg-sky-500'}`}
                        style={{ width: `${bar.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-24 px-4 relative">
        <GradientOrb className="w-[500px] h-[500px] top-0 right-0 bg-sky-600/6" />
        <div className="max-w-7xl mx-auto">
          <AnimSection>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-sm font-medium mb-6">
                <Layers className="w-3.5 h-3.5" /> 32+ Modules
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4 tracking-tight">
                Everything Your Business Needs,<br className="hidden sm:block" />
                <span className="gradient-text"> In One Place</span>
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                From invoicing to HR, from AI intelligence to marketing automation — no more switching between apps.
              </p>
            </div>
          </AnimSection>

          <div className="flex flex-wrap gap-2 justify-center mb-10">
            {FEATURE_GROUPS.map((g, i) => (
              <button
                key={g.category}
                onClick={() => setActiveGroup(i)}
                className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${activeGroup === i ? 'bg-white text-black shadow-lg' : 'bg-white/[0.05] text-gray-400 hover:bg-white/[0.08] hover:text-white border border-white/[0.06]'}`}
              >
                {g.category}
              </button>
            ))}
          </div>

          {FEATURE_GROUPS.map((group, gi) => (
            <div key={group.category} className={`transition-all duration-500 ${activeGroup === gi ? 'block' : 'hidden'}`}>
              <AnimSection>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {group.features.map((f) => (
                    <div
                      key={f.title}
                      className="group relative rounded-2xl p-5 bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.12] hover:bg-white/[0.04] transition-all duration-300 cursor-default"
                    >
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${group.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                        <f.icon className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="font-semibold text-white mb-2 text-sm">{f.title}</h3>
                      <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>
                    </div>
                  ))}
                </div>
              </AnimSection>
            </div>
          ))}
        </div>
      </section>

      <section id="ai" className="py-24 px-4 relative bg-gradient-to-b from-transparent via-[#0b0e16] to-transparent">
        <GradientOrb className="w-[600px] h-[600px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-orange-600/6" />
        <div className="max-w-7xl mx-auto">
          <AnimSection>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-medium mb-6">
                <Brain className="w-3.5 h-3.5" /> Powered by Gemini AI
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4 tracking-tight">
                AI That Works as Your<br />
                <span className="gradient-text">Business Co-Pilot</span>
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                9 AI-powered modules that analyse, write, research, and act — so you can focus on what matters.
              </p>
            </div>
          </AnimSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {AI_FEATURES.map((f, i) => (
              <AnimSection key={f.title}>
                <div className="relative h-full rounded-2xl p-6 bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.07] hover:border-orange-500/25 transition-all duration-300 group overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 to-orange-500/0 group-hover:from-orange-500/5 group-hover:to-transparent transition-all duration-500" />
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <f.icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 font-medium">
                        {f.badge}
                      </span>
                    </div>
                    <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </AnimSection>
            ))}
          </div>
        </div>
      </section>

      <section id="marketing" className="py-24 px-4 relative">
        <GradientOrb className="w-[500px] h-[500px] bottom-0 left-0 bg-violet-600/6" />
        <div className="max-w-7xl mx-auto">
          <AnimSection>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-6">
                <Megaphone className="w-3.5 h-3.5" /> Marketing Studio
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4 tracking-tight">
                Create, Publish & Track<br />
                <span className="gradient-text">All Your Marketing</span>
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Generate images, videos, voice, and ads. Manage Google and Meta campaigns. Schedule social posts. All in one studio.
              </p>
            </div>
          </AnimSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {MARKETING_FEATURES.map((f) => (
              <AnimSection key={f.title}>
                <div className="h-full rounded-2xl p-6 bg-white/[0.02] border border-white/[0.05] hover:border-emerald-500/20 hover:bg-white/[0.04] transition-all duration-300 group">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                    <f.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-4">{f.desc}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {f.tags.map((tag) => (
                      <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </AnimSection>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4 bg-[#0b0e16]">
        <div className="max-w-5xl mx-auto">
          <AnimSection>
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
                Up and Running in <span className="gradient-text">4 Steps</span>
              </h2>
              <p className="text-gray-400 text-lg max-w-xl mx-auto">No complex setup. No long onboarding. Just sign up and go.</p>
            </div>
          </AnimSection>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((step, i) => (
              <AnimSection key={step.num}>
                <div className="relative text-center group">
                  {i < HOW_IT_WORKS.length - 1 && (
                    <div className="hidden lg:block absolute top-8 left-[calc(50%+40px)] right-[-40px] h-[1px] bg-gradient-to-r from-white/10 to-transparent" />
                  )}
                  <div className="relative inline-flex">
                    <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-4 mx-auto group-hover:border-orange-500/30 transition-colors">
                      <step.icon className="w-7 h-7 text-orange-400" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full gradient-orange flex items-center justify-center text-xs font-black text-white">
                      {i + 1}
                    </div>
                  </div>
                  <h3 className="font-bold text-white mb-2 text-sm">{step.title}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed">{step.desc}</p>
                </div>
              </AnimSection>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <AnimSection>
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
                Loved by Business Owners <span className="gradient-text">Across India</span>
              </h2>
            </div>
          </AnimSection>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <AnimSection key={t.name}>
                <div className="rounded-2xl p-6 bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.1] transition-all duration-300">
                  <div className="flex gap-0.5 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed mb-5 italic">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-xs font-bold text-white`}>
                      {t.avatar}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{t.name}</div>
                      <div className="text-xs text-gray-500">{t.role}</div>
                    </div>
                  </div>
                </div>
              </AnimSection>
            ))}
          </div>
        </div>
      </section>

      <section id="roadmap" className="py-24 px-4 relative bg-gradient-to-b from-transparent via-[#0b0e16] to-transparent">
        <GradientOrb className="w-[500px] h-[500px] top-1/2 left-0 -translate-y-1/2 bg-sky-600/5" />
        <GradientOrb className="w-[400px] h-[400px] bottom-0 right-0 bg-orange-600/5" />
        <div className="max-w-7xl mx-auto">
          <AnimSection>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-medium mb-6">
                <Rocket className="w-3.5 h-3.5" /> What's Coming — Roadmap
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4 tracking-tight">
                We're Just Getting Started.<br />
                <span className="gradient-text">Here's What's Next.</span>
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Pro plan users get every future feature the moment it ships — at no extra cost. This is your roadmap.
              </p>
            </div>
          </AnimSection>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {FUTURE_FEATURES.map((group) => (
              <AnimSection key={group.category}>
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden hover:border-white/[0.1] transition-all duration-300">
                  <div className={`px-6 py-4 bg-gradient-to-r ${group.color} bg-opacity-10 border-b border-white/[0.05] flex items-center gap-3`}>
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${group.color} flex items-center justify-center`}>
                      <group.icon className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="font-bold text-white text-sm">{group.category}</h3>
                    <span className="ml-auto text-[10px] px-2.5 py-0.5 rounded-full bg-white/10 border border-white/40 text-white font-semibold">
                      Coming Soon
                    </span>
                  </div>
                  <div className="p-5 space-y-4">
                    {group.items.map((item) => (
                      <div key={item.title} className="flex items-start gap-3 group">
                        <div className="w-5 h-5 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:border-orange-500/30 transition-colors">
                          <Zap className="w-2.5 h-2.5 text-orange-400/70" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white mb-0.5">{item.title}</div>
                          <div className="text-xs text-gray-500 leading-relaxed">{item.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </AnimSection>
            ))}
          </div>

          <AnimSection>
            <div className="mt-10 rounded-2xl border border-orange-500/20 bg-gradient-to-r from-orange-500/[0.06] to-transparent p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl gradient-orange flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Pro plan = every future feature, automatically</div>
                  <div className="text-xs text-gray-500 mt-0.5">No upgrade fees, no re-subscriptions. Everything ships directly to your account.</div>
                </div>
              </div>
              <Link to="/signup" className="flex-shrink-0 px-6 py-2.5 rounded-xl gradient-orange text-sm font-semibold text-white hover:opacity-90 transition-all shadow-lg shadow-orange-500/20 flex items-center gap-2">
                Get Pro — ₹999/mo <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </AnimSection>
        </div>
      </section>

      <section id="pricing" className="py-24 px-4 bg-[#0b0e16] relative">
        <GradientOrb className="w-[400px] h-[400px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-orange-600/5" />
        <div className="max-w-6xl mx-auto">
          <AnimSection>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium mb-6">
                <PieChart className="w-3.5 h-3.5" /> Simple Pricing
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
                Start Free, Scale as You Grow
              </h2>
              <p className="text-gray-400 text-lg">No hidden fees. Cancel anytime.</p>
            </div>
          </AnimSection>

          <div className="flex items-center justify-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-gray-400 text-xs font-semibold">
              <Zap className="w-3 h-3 text-orange-400" />
              Version 1.0 — All plans include v1.0 features
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {PRICING_PLANS.map((plan) => (
              <AnimSection key={plan.name}>
                <div className={`relative h-full rounded-2xl border transition-all duration-300 flex flex-col overflow-hidden ${plan.highlight ? 'bg-gradient-to-b from-orange-500/[0.12] to-transparent border-orange-500/35 shadow-2xl shadow-orange-500/15' : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.03]'}`}>
                  {plan.highlight && (
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-orange-500 to-transparent" />
                  )}
                  {plan.name === 'Custom' && (
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-sky-500/60 to-transparent" />
                  )}
                  <div className="p-6 pb-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                      {plan.badge && (
                        <span className="px-3 py-0.5 rounded-full gradient-orange text-[10px] font-bold text-white shadow-md">
                          {plan.badge}
                        </span>
                      )}
                      {plan.name === 'Custom' && (
                        <span className="px-3 py-0.5 rounded-full bg-sky-500/15 border border-sky-500/25 text-sky-400 text-[10px] font-bold">
                          Enterprise
                        </span>
                      )}
                    </div>
                    <p className="text-gray-500 text-xs mb-5">{plan.desc}</p>
                    <div className="flex items-baseline gap-1.5 mb-6">
                      {plan.name === 'Custom' ? (
                        <div>
                          <span className="text-3xl font-extrabold text-white">Custom</span>
                          <p className="text-gray-500 text-xs mt-1">Pricing tailored to your needs</p>
                        </div>
                      ) : (
                        <>
                          <span className="text-3xl font-extrabold text-white">{plan.price}</span>
                          <span className="text-gray-500 text-sm">{plan.period}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <ul className="space-y-2.5 flex-1 px-6 mb-6">
                    {plan.features.map((feat) => {
                      const isFuture = feat.toLowerCase().includes('future');
                      return (
                        <li key={feat} className="flex items-start gap-2.5 text-sm">
                          <CheckCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isFuture ? 'text-orange-400' : 'text-emerald-400'}`} />
                          <span className={`leading-snug ${isFuture ? 'text-orange-300 font-medium' : 'text-gray-300'}`}>{feat}</span>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="px-6 pb-6">
                    <Link
                      to={plan.ctaLink}
                      className={`w-full text-center py-3 rounded-xl text-sm font-semibold transition-all block ${plan.highlight ? 'gradient-orange text-white hover:opacity-90 shadow-lg shadow-orange-500/20' : plan.name === 'Custom' ? 'bg-sky-500/15 border border-sky-500/25 text-sky-300 hover:bg-sky-500/25 hover:text-white' : 'border border-white/10 text-gray-300 hover:border-white/20 hover:text-white'}`}
                    >
                      {plan.cta}
                    </Link>
                  </div>
                </div>
              </AnimSection>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {TRUST_BADGES.map((b) => (
              <div key={b.label} className="text-center p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                <b.icon className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                <div className="text-xs font-semibold text-white mb-0.5">{b.label}</div>
                <div className="text-xs text-gray-500">{b.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4 bg-[#0b0e16]">
        <div className="max-w-3xl mx-auto">
          <AnimSection>
            <h2 className="text-3xl font-extrabold text-center mb-12">
              Frequently Asked <span className="gradient-text">Questions</span>
            </h2>
          </AnimSection>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-xl border border-white/[0.06] overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/[0.02] transition-colors"
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                >
                  <span className="text-sm font-semibold text-white pr-4">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${activeFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {activeFaq === i && (
                  <div className="px-5 pb-4 text-sm text-gray-400 leading-relaxed border-t border-white/[0.04]">
                    <div className="pt-3">{faq.a}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4 relative overflow-hidden">
        <GradientOrb className="w-[600px] h-[400px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-orange-600/8" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <AnimSection>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-medium mb-8">
              <Zap className="w-3.5 h-3.5" /> Free to start, no credit card
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4 tracking-tight">
              Your Business Deserves<br />
              <span className="gradient-text">Better Tools</span>
            </h2>
            <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
              Join thousands of Indian business owners managing their entire operation from a single, AI-powered platform.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/signup"
                className="w-full sm:w-auto px-10 py-4 text-base font-semibold text-white rounded-2xl gradient-orange hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-xl shadow-orange-500/25"
              >
                Get Started Free <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-gray-300 rounded-2xl border border-white/10 hover:border-white/20 hover:text-white transition-all flex items-center justify-center gap-2"
              >
                Sign In <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </AnimSection>
        </div>
      </section>

      {/* ============================================================
          BUY THIS SYSTEM SECTION
      ============================================================ */}
      <section className="py-24 px-4 relative overflow-hidden bg-gradient-to-b from-[#0b0e16] to-[#080a0f]">
        <GradientOrb className="w-[700px] h-[500px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-amber-500/8" />
        <GradientOrb className="w-[300px] h-[300px] top-0 right-0 bg-orange-600/6" />
        <GradientOrb className="w-[250px] h-[250px] bottom-0 left-0 bg-sky-600/5" />

        <div className="max-w-5xl mx-auto relative z-10">
          <AnimSection>
            <div className="rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.06] via-orange-500/[0.04] to-transparent p-8 sm:p-12 relative overflow-hidden">

              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/20 to-transparent" />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-sm font-semibold mb-6">
                    <ShoppingCart className="w-3.5 h-3.5" />
                    Own This System
                  </div>

                  <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold leading-[1.15] tracking-tight mb-5">
                    Buy This System &<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
                      Get a Free Business
                    </span>
                  </h2>

                  <p className="text-gray-400 text-base sm:text-lg leading-relaxed mb-8">
                    Purchase the complete MyDesignNexus Business OS and we'll set up your entire business presence — free. Brand identity, domain, and digital foundation included.
                  </p>

                  <ul className="space-y-3 mb-10">
                    {[
                      { text: 'Full source code of this business OS', icon: BadgeCheck },
                      { text: 'Free business setup & brand identity', icon: Gift },
                      { text: 'Custom domain & deployment support', icon: Globe },
                      { text: 'Lifetime updates & documentation', icon: Sparkles },
                      { text: 'White-label rights included', icon: Award },
                    ].map((item) => (
                      <li key={item.text} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                          <item.icon className="w-3 h-3 text-amber-400" />
                        </div>
                        <span className="text-gray-300 text-sm">{item.text}</span>
                      </li>
                    ))}
                  </ul>

                  <a
                    href="https://www.mydesignnexus.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-base font-bold text-black bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 transition-all duration-200 shadow-2xl shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-[1.02] active:scale-[0.99]"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    Buy This System
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  <p className="text-gray-600 text-xs mt-4">
                    Redirects to mydesignnexus.in — our official purchase portal
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                        <Gift className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">Free Business Bundle</div>
                        <div className="text-xs text-gray-500">Included with every purchase</div>
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      {[
                        { label: 'Business Registration Guidance', value: 'Free' },
                        { label: 'Logo & Brand Kit Design', value: 'Free' },
                        { label: 'Professional Website Setup', value: 'Free' },
                        { label: 'GST Registration Support', value: 'Free' },
                        { label: '1 Year Domain Included', value: 'Free' },
                      ].map((row) => (
                        <div key={row.label} className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">{row.label}</span>
                          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                            {row.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-amber-500/15 bg-amber-500/[0.04] p-5">
                    <div className="flex items-start gap-3">
                      <Zap className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-sm font-semibold text-white mb-1">Limited Time Offer</div>
                        <div className="text-xs text-gray-400 leading-relaxed">
                          Buy the complete MyDesignNexus system and launch your own fully operational business — no extra cost, no hidden fees. Everything you need to start earning, built and ready.
                        </div>
                      </div>
                    </div>
                  </div>

                  <a
                    href="https://www.mydesignnexus.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between w-full px-5 py-3.5 rounded-xl border border-amber-500/20 bg-amber-500/[0.04] hover:bg-amber-500/[0.08] hover:border-amber-500/35 transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Globe className="w-4 h-4 text-amber-400" />
                      <span className="text-sm font-medium text-gray-300">mydesignnexus.in</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
                  </a>
                </div>
              </div>
            </div>
          </AnimSection>
        </div>
      </section>

      <footer className="border-t border-white/[0.05] py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            <div className="md:col-span-2">
              <img src="/Group_3_(1).png" alt="MyDesignNexus" className="h-8 object-contain mb-4" />
              <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
                All-in-one business operating system for Indian freelancers, agencies, and entrepreneurs. Built with love in India.
              </p>
              <div className="flex gap-2 mt-4 flex-wrap">
                {TRUST_BADGES.map((b) => (
                  <div key={b.label} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.06] text-xs text-gray-500">
                    <b.icon className="w-3 h-3 text-emerald-400" /> {b.label}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-4">Product</h4>
              <ul className="space-y-2.5">
                {['Finance & Billing', 'AI Tools', 'Marketing Studio', 'Team & HR', 'Pricing'].map((item) => (
                  <li key={item}><a href="#features" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">{item}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-4">Quick Links</h4>
              <ul className="space-y-2.5">
                {[
                  { label: 'Sign Up Free', to: '/signup' },
                  { label: 'Sign In', to: '/login' },
                  { label: 'Team Login', to: '/employee' },
                ].map((item) => (
                  <li key={item.label}><Link to={item.to} className="text-sm text-gray-500 hover:text-gray-300 transition-colors">{item.label}</Link></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-white/[0.05] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-gray-600 text-xs">&copy; {new Date().getFullYear()} MyDesignNexus. All rights reserved.</p>
            <p className="text-gray-600 text-xs">Made with care for Indian businesses</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
