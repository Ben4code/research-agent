import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { buttonVariants } from '@/components/ui/button';
import { StatusBadge } from '@/components/status-badge';
import { cn } from '@/lib/utils';

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

const confidenceColor: Record<string, string> = {
  high: 'text-emerald-600',
  medium: 'text-amber-600',
  low: 'text-zinc-500',
};

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

  const latestReport = research.reports[0];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link
              href="/research"
              className="text-muted-foreground hover:text-foreground"
            >
              ← History
            </Link>
          </div>
          <Link
            href="/"
            className={cn(buttonVariants({ size: 'sm', variant: 'outline' }))}
          >
            New Research
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-3">
          <div className="flex items-center gap-3">
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
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {research.question}
          </h1>
          {research.instructions && (
            <p className="text-muted-foreground">
              {research.instructions}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="mb-8 flex gap-6">
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-foreground">
              {research.sources.length}
            </span>
            <span className="text-sm text-muted-foreground">Sources</span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-foreground">
              {research.findings.length}
            </span>
            <span className="text-sm text-muted-foreground">Findings</span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-foreground">
              {research.reports.length}
            </span>
            <span className="text-sm text-muted-foreground">Reports</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Report */}
          <div className="lg:col-span-2">
            {latestReport ? (
              <div>
                <h2 className="mb-4 text-xl font-bold text-foreground">
                  Report
                </h2>
                <article className="prose prose-zinc dark:prose-invert max-w-none rounded-lg border border-border bg-card p-6">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {latestReport.content}
                  </ReactMarkdown>
                </article>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border p-12 text-center">
                <p className="text-muted-foreground">
                  {research.status === 'failed'
                    ? 'Research failed before a report could be generated.'
                    : research.status === 'completed'
                      ? 'Research completed but no report was generated.'
                      : 'Report will appear here once research completes.'}
                </p>
              </div>
            )}
          </div>

          {/* Sidebar: Sources & Findings */}
          <div className="flex flex-col gap-8">
            {/* Sources */}
            <div>
              <h2 className="mb-4 text-xl font-bold text-foreground">
                Sources
              </h2>
              {research.sources.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No sources collected.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {research.sources.map((source) => (
                    <a
                      key={source.id}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex flex-col gap-1 rounded-lg border border-border bg-card p-3 transition-colors hover:border-foreground/20 hover:bg-accent"
                    >
                      <span className="truncate text-sm font-medium text-foreground group-hover:underline">
                        {source.title}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {source.url}
                      </span>
                      {source.snippet && (
                        <span className="line-clamp-2 text-xs text-muted-foreground">
                          {source.snippet}
                        </span>
                      )}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Findings */}
            {research.findings.length > 0 && (
              <div>
                <h2 className="mb-4 text-xl font-bold text-foreground">
                  Findings
                </h2>
                <div className="flex flex-col gap-3">
                  {research.findings.map((finding) => (
                    <div
                      key={finding.id}
                      className="rounded-lg border border-border bg-card p-3"
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <a
                          href={finding.source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate text-xs font-medium text-muted-foreground hover:text-foreground hover:underline"
                        >
                          {finding.source.title}
                        </a>
                        {finding.confidence && (
                          <span
                            className={`shrink-0 text-xs font-medium ${
                              confidenceColor[finding.confidence] ??
                              'text-muted-foreground'
                            }`}
                          >
                            {finding.confidence}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-foreground">
                        {finding.claim}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
