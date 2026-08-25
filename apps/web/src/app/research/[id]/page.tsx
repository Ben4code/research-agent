import Link from 'next/link';
import { notFound } from 'next/navigation';
import { StatusBadge } from '@/components/status-badge';
import { StatsTabs } from '@/components/stats-tabs';
import { ResearchProgress } from '@/components/research-progress';
import { ArrowLeft, Plus, Sparkles } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

const IN_PROGRESS_STATUSES = new Set([
  'pending',
  'planning',
  'researching',
  'analyzing',
  'generating_report',
]);

interface ResearchDetail {
  id: string;
  question: string;
  instructions: string | null;
  status: string;
  workflowId: string | null;
  createdAt: string;
  completedAt: string | null;
  sources: Source[];
  findings: Finding[];
  reports: Report[];
}

interface Source {
  id: string;
  url: string;
  title: string;
  snippet: string | null;
}

interface Finding {
  id: string;
  claim: string;
  evidence: string | null;
  confidence: string | null;
  source: { id: string; url: string; title: string };
}

interface Report {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

async function fetchResearch(id: string): Promise<ResearchDetail | null> {
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
  try {
    const res = await fetch(`${apiUrl}/api/research/${id}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function ResearchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const research = await fetchResearch(id);

  if (!research) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      {/* <header className="sticky top-0 z-50 border-b border-calcite-light bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link
            href="/research"
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            History
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <img src="/assets/logo-icon.svg" alt="MechaSearch" className="h-8 w-8" />
            </Link>
          </div>
        </div>
      </header> */}
      {/* <Navbar /> */}

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-calcite-light bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <Link href="/" className="flex items-center gap-2">
              <img src="/assets/logo-icon.svg" alt="MechaSearch" className="h-8 w-8" />
              <span className="text-lg font-black tracking-tight text-foreground">
                Mecha<span className="text-calcite-orange">Search</span>
              </span>
            </Link>
          </div>
          <Link
            href="/research/new"
            className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5')}
          >
            <Plus className="h-3.5 w-3.5" />
            New Research
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        {/* Research header */}
        <div className="mb-10 flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={research.status} />
            <span className="text-sm text-muted-foreground">
              {formatDate(research.createdAt)}
            </span>
            {research.completedAt && (
              <span className="text-sm text-muted-foreground">
                → {formatDate(research.completedAt)}
              </span>
            )}
          </div>
          <h1 className="max-w-3xl text-balance text-3xl font-black leading-tight tracking-[-0.02em] text-foreground">
            {research.question}
          </h1>
          {research.instructions && (
            <p className="max-w-2xl text-muted-foreground">
              {research.instructions}
            </p>
          )}
        </div>

        {/* Live progress for in-progress research */}
        {IN_PROGRESS_STATUSES.has(research.status) && (
          <ResearchProgress researchId={research.id} />
        )}

        {/* Tabbed content: Sources / Findings / Reports */}
        <StatsTabs
          status={research.status}
          researchId={research.id}
          reports={research.reports}
          findings={research.findings}
          sources={research.sources}
        />
      </main>
    </div>
  );
}