import Link from 'next/link';
import { notFound } from 'next/navigation';
import { StatusBadge } from '@/components/status-badge';
import { StatsTabs } from '@/components/stats-tabs';
import { ArrowLeft, Globe } from 'lucide-react';

interface ResearchDetail {
  id: string;
  question: string;
  instructions: string | null;
  status: string;
  createdAt: string;
  completedAt: string | null;
  sources: { id: string; url: string; title: string; snippet: string | null }[];
  findings: {
    id: string;
    claim: string;
    evidence: string | null;
    confidence: string | null;
    source: { id: string; url: string; title: string };
  }[];
  reports: { id: string; title: string; content: string; createdAt: string }[];
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

async function fetchPublicResearch(
  token: string,
): Promise<ResearchDetail | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
  try {
    const res = await fetch(`${apiUrl}/api/research/public/${token}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function PublicResearchPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const research = await fetchPublicResearch(token);

  if (!research) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-calcite-light bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <img src="/assets/logo-icon.svg" alt="MechaSearch" className="h-8 w-8" />
            <span className="text-lg font-black tracking-tight text-foreground">
              Mecha<span className="text-calcite-orange">Search</span>
            </span>
          </Link>
          <span className="flex items-center gap-1.5 rounded-full border border-calcite-light bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
            <Globe className="h-3.5 w-3.5 text-calcite-orange" />
            Public research
          </span>
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

        <StatsTabs
          status={research.status}
          researchId={research.id}
          reports={research.reports}
          findings={research.findings}
          sources={research.sources}
          readOnly
        />

        <div className="mt-6 flex justify-center">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Start your own research
          </Link>
        </div>
      </main>
    </div>
  );
}