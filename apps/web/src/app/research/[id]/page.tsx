'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { notFound } from 'next/navigation';
import { StatusBadge } from '@/components/status-badge';
import { StatsTabs } from '@/components/stats-tabs';
import { ResearchProgress } from '@/components/research-progress';
import { VisibilityToggle } from '@/components/research/visibility-toggle';
import { ArrowLeft, Loader2, Plus } from 'lucide-react';
import { RequireAuth } from '@/components/auth/require-auth';
import { UserNav } from '@/components/auth/user-nav';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { useSession } from '@/lib/auth';
import { apiFetch } from '@/lib/api';

const IN_PROGRESS_STATUSES = new Set([
  'pending',
  'planning',
  'researching',
  'analyzing',
  'generating_report',
]);

interface ResearchDetail {
  id: string;
  userId: string;
  question: string;
  instructions: string | null;
  status: string;
  workflowId: string | null;
  visibility: 'PUBLIC' | 'PRIVATE';
  shareToken: string | null;
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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ResearchDetailContent({ id }: { id: string }) {
  const { data: session } = useSession();
  const [research, setResearch] = useState<ResearchDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiFetch<ResearchDetail>(`/research/${id}`)
      .then((data) => {
        if (!cancelled) setResearch(data);
      })
      .catch(() => {
        if (!cancelled) notFound();
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-calcite-orange" />
      </div>
    );
  }

  if (!research) {
    return null;
  }

  const isOwner = session?.user?.id === research.userId;

  return (
    <div className="min-h-screen bg-background">
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
          <div className="flex items-center gap-2">
            <UserNav />
            <Link
              href="/research"
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              History
            </Link>
            <Link
              href="/research/new"
              className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5')}
            >
              <Plus className="h-3.5 w-3.5" />
              New Research
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
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
            <span
              className={cn(
                'rounded-full border px-2.5 py-0.5 text-xs font-medium',
                research.visibility === 'PUBLIC'
                  ? 'border-calcite-light text-muted-foreground'
                  : 'border-calcite-orange/40 text-calcite-charcoal',
              )}
            >
              {research.visibility === 'PUBLIC' ? 'Public' : 'Private'}
            </span>
          </div>
          <h1 className="max-w-3xl text-balance text-3xl font-black leading-tight tracking-[-0.02em] text-foreground">
            {research.question}
          </h1>
          {research.instructions && (
            <p className="max-w-2xl text-muted-foreground">
              {research.instructions}
            </p>
          )}
          {isOwner && (
            <VisibilityToggle
              researchId={research.id}
              visibility={research.visibility}
              shareToken={research.shareToken}
            />
          )}
        </div>

        {IN_PROGRESS_STATUSES.has(research.status) && (
          <ResearchProgress researchId={research.id} />
        )}

        <StatsTabs
          status={research.status}
          researchId={research.id}
          reports={research.reports}
          findings={research.findings}
          sources={research.sources}
          readOnly={!isOwner}
        />
      </main>
    </div>
  );
}

export default function ResearchDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  return (
    <RequireAuth>
      <ResearchDetailContent id={id} />
    </RequireAuth>
  );
}