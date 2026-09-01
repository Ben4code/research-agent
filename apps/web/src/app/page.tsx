import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { LandingAnimations } from '@/components/landing-animations';
import { cn } from '@/lib/utils';
import {
  ArrowRight,
  Sparkles,
  Shield,
  Search,
  FileText,
  Clock,
  GitBranch,
  Zap,
  Globe,
  CheckCircle2,
} from 'lucide-react';

const features = [
  {
    icon: GitBranch,
    title: 'Durable Workflows',
    description:
      'Research survives crashes, restarts, and deployment. Close the tab and come back — your research keeps running.',
  },
  {
    icon: Sparkles,
    title: 'AI Planning',
    description:
      'An agent breaks your question into a structured plan: what to search, what to fetch, what to compare.',
  },
  {
    icon: Search,
    title: 'Real Web Research',
    description:
      'Search the live web, fetch full pages, and extract grounded findings with cited sources — no hallucinated answers.',
  },
  {
    icon: Shield,
    title: 'Source-Backed Reports',
    description:
      'Every claim traces back to a real URL. Confidence levels surface how certain the agent is about each finding.',
  },
  {
    icon: Clock,
    title: 'Progress in Real Time',
    description:
      'Watch each step unfold live — planning, searching, analyzing, report generation — over a streaming feed.',
  },
  {
    icon: FileText,
    title: 'Structured Reports',
    description:
      'Get a clean Markdown report with an executive summary, comparison tables, analysis, and citations.',
  },
];

const steps = [
  {
    number: '01',
    title: 'Ask',
    description:
      'Submit a complex research question with optional focus instructions.',
  },
  {
    number: '02',
    title: 'Research',
    description:
      'The agent plans, searches the web, fetches sources, and extracts findings — durably.',
  },
  {
    number: '03',
    title: 'Report',
    description:
      'Receive a structured, source-backed report with recommendations and citations.',
  },
];

const stack = ['Next.js', 'NestJS', 'Temporal', 'Mastra', 'PostgreSQL'];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <LandingAnimations />
      {/* ── Nav ─────────────────────────────────────────────── */}
      <header
        data-anim="nav"
        className="sticky top-0 z-50 border-b border-calcite-light bg-background/80 backdrop-blur-md"
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center">
            <img src="/assets/logo-icon.png" alt="DroidSearch" className="h-8 w-8" />
            <span className="text-lg font-black tracking-tight text-foreground">
              Droid<span className="text-calcite-orange">Search</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">
              Features
            </a>
            <a href="#how-it-works" className="transition-colors hover:text-foreground">
              How it works
            </a>
            <a href="#stack" className="transition-colors hover:text-foreground">
              Stack
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/research"
              className={cn(
                buttonVariants({ variant: 'outline', size: 'sm' }),
                'hidden sm:inline-flex',
              )}
            >
              View History
            </Link>
            <Link
              href="/research"
              className={cn(buttonVariants({ size: 'sm' }))}
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-calcite-orange/15 blur-[140px]" />
          <div
            className="absolute inset-0 opacity-[0.5]"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, var(--calcite-light) 1px, transparent 0)',
              backgroundSize: '32px 32px',
            }}
          />
        </div>

        <div className="mx-auto flex max-w-6xl flex-col items-center px-6 pb-20 pt-24 text-center sm:pt-32">
          <h1 className="max-w-4xl text-balance text-[clamp(2.75rem,8vw,5.5rem)] font-black leading-[1.02] tracking-[-0.03em] text-foreground">
            <span data-anim="hero-title" className="block">
              Ask anything.
            </span>
            <span data-anim="hero-title" className="relative inline-block px-2">
              <span className="relative z-10 text-calcite-charcoal">
                Get a source-backed report.
              </span>
              <span
                data-anim="hero-marker"
                aria-hidden
                className="absolute inset-x-0 bottom-0.5 z-0 h-[0.4em] -rotate-1 rounded-sm bg-calcite-peach/70"
              />
            </span>
          </h1>

          <p
            data-anim="hero-copy"
            className="mt-6 max-w-[62ch] text-balance text-lg leading-relaxed text-muted-foreground sm:text-xl"
          >
            DroidSearch turns complex questions into structured, cited
            reports — an AI agent that plans, searches the live web, extracts
            findings, and writes it all up. Even when you close the browser.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
            <Link
              data-anim="hero-cta"
              href="/research"
              className={cn(
                buttonVariants({ size: 'lg' }),
                'h-11 gap-2 rounded-full px-7 text-base',
              )}
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              data-anim="hero-cta"
              href="#how-it-works"
              className={cn(
                buttonVariants({ variant: 'outline', size: 'lg' }),
                'h-11 rounded-full px-7 text-base',
              )}
            >
              See how it works
            </Link>
          </div>

          <div data-anim="hero-trust" className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
            <span className="flex h-2 w-2 rounded-full bg-calcite-orange" />
            Durable execution · Live web research · Cited sources
          </div>

          {/* Hero mock */}
          <div
            data-anim="terminal"
            className="mt-16 w-full max-w-3xl overflow-hidden rounded-2xl border border-calcite-light bg-card shadow-2xl shadow-calcite-orange/10"
          >
            <div data-anim="term-header" className="flex items-center gap-2 border-b border-calcite-light bg-calcite-charcoal px-5 py-3">
              <span className="h-3 w-3 rounded-full bg-calcite-orange" />
              <span className="h-3 w-3 rounded-full bg-calcite-peach" />
              <span className="h-3 w-3 rounded-full bg-calcite-light" />
              <span className="ml-3 font-mono text-xs text-calcite-light/80">
                research — Temporal vs BullMQ vs Inngest
              </span>
            </div>
            <div className="relative space-y-3 p-6 text-left">
              <span
                data-anim="term-progress"
                aria-hidden
                className="absolute left-0 top-0 h-0.5 w-full bg-calcite-orange/60"
              />
              <HeroStep done label="Understanding research question" />
              <HeroStep done label="Creating research plan" />
              <HeroStep done label="Searching the web" />
              <HeroStep active label="Fetching 12 sources" />
              <HeroStep label="Extracting findings" />
              <HeroStep label="Generating report" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Stack strip ─────────────────────────────────────── */}
      <section id="stack" className="border-y border-calcite-light bg-calcite-light/40">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 py-10">
          <p className="text-sm uppercase tracking-widest text-muted-foreground">
            Built on a production-grade stack
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {stack.map((item) => (
              <span
                key={item}
                data-anim="stack-chip"
                className="rounded-full border border-calcite-light bg-background px-4 py-1.5 text-sm font-medium text-foreground"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────── */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-12 flex flex-col items-center text-center">
          <h2 className="max-w-2xl text-balance text-3xl font-black tracking-[-0.02em] text-foreground sm:text-4xl">
            Research you can trust, built to last
          </h2>
          <p className="mt-4 max-w-[58ch] text-muted-foreground">
            Traditional chat gives you an answer. DroidSearch gives you a
            durable, citable investigation you can verify.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              data-anim="feature-card"
              className="group rounded-2xl border border-calcite-light bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-calcite-orange/50 hover:shadow-lg hover:shadow-calcite-orange/5"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-calcite-peach/60 text-calcite-charcoal">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-2 text-base font-bold tracking-[-0.01em] text-foreground">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────── */}
      <section id="how-it-works" className="border-y border-calcite-light bg-calcite-light/40">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-12 flex flex-col items-center text-center">
            <h2 className="text-3xl font-black tracking-[-0.02em] text-foreground sm:text-4xl">
              From question to cited report
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.number}
                data-anim="step-card"
                className="relative rounded-2xl border border-calcite-light bg-background p-7"
              >
                <span className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-full bg-calcite-orange text-base font-bold text-brand-foreground">
                  {step.number}
                </span>
                <h3 className="mb-2 text-xl font-bold tracking-[-0.01em] text-foreground">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <section data-anim="cta-section" className="relative overflow-hidden bg-calcite-charcoal">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-1/2 h-[400px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-calcite-orange/25 blur-[120px]" />
        </div>
        <div data-anim="cta-content" className="mx-auto flex max-w-3xl flex-col items-center px-6 py-24 text-center">
          <h2 className="text-balance text-3xl font-black tracking-[-0.02em] text-calcite-light sm:text-5xl">
            Start your first research project
          </h2>
          <p className="mt-4 max-w-lg text-calcite-light/70 sm:text-lg">
            Ask a question, walk away, and come back to a source-backed report.
            No more tab-hopping through fifty articles.
          </p>
          <Link
            href="/research"
            className={cn(
              buttonVariants({ size: 'lg' }),
              'mt-8 h-12 gap-2 rounded-full px-8 text-base',
            )}
          >
            <Zap className="h-4 w-4" />
            Get Started
            <ArrowRight className="h-4 w-4" />
          </Link>
          <div className="mt-6 flex items-center gap-2 text-sm text-calcite-light/70">
            <CheckCircle2 className="h-4 w-4 text-calcite-orange" />
            Free to use · Sign up in seconds
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="border-t border-calcite-light/20 bg-calcite-charcoal">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-calcite-light/70 sm:flex-row">
          <div className="flex items-center gap-2">
            <img src="/assets/logo-icon.png" alt="DroidSearch" className="h-5 w-5" />
            DroidSearch — durable AI research
          </div>
          <p>Mastra decides what to do. Temporal makes sure it gets done.</p>
        </div>
      </footer>
    </div>
  );
}

function HeroStep({
  label,
  done,
  active,
}: {
  label: string;
  done?: boolean;
  active?: boolean;
}) {
  return (
    <div data-anim="term-step" className="flex items-center gap-3">
      <span
        data-anim="term-dot"
        data-active={active || undefined}
        className={cn(
          'flex h-5 w-5 items-center justify-center rounded-full text-[10px]',
          done && 'bg-calcite-charcoal text-calcite-light',
          active && 'border-2 border-calcite-orange',
          !done && !active && 'border border-calcite-light bg-muted/40',
        )}
      >
        {done && <CheckCircle2 className="h-3 w-3" />}
      </span>
      <span
        className={cn(
          'text-sm',
          done && 'text-muted-foreground line-through',
          active && 'font-medium text-foreground',
          !done && !active && 'text-muted-foreground',
        )}
      >
        {label}
      </span>
    </div>
  );
}