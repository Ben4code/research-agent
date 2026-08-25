'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  ExternalLink,
  FileText,
  Link2,
  Loader2,
  Target,
  Trash2,
} from 'lucide-react';

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

interface StatsTabsProps {
  sources: Source[];
  findings: Finding[];
  reports: Report[];
  status: string;
  researchId: string;
}

type Metric = 'findings' | 'reports' | 'sources';

const metrics: {
  key: Metric;
  label: string;
  icon: typeof Link2;
}[] = [
    { key: 'reports', label: 'Reports', icon: FileText },
    { key: 'findings', label: 'Findings', icon: Target },
    { key: 'sources', label: 'Sources', icon: Link2 }
  ];

const confidenceStyles: Record<string, string> = {
  high: 'bg-calcite-charcoal text-calcite-light',
  medium: 'bg-calcite-peach/60 text-calcite-charcoal',
  low: 'bg-muted text-muted-foreground',
};

export function StatsTabs({
  sources,
  findings,
  reports: initialReports,
  status,
  researchId,
}: StatsTabsProps) {
  const [reports, setReports] = useState<Report[]>(initialReports);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const values: Record<Metric, number> = {
    reports: reports.length,
    findings: findings.length,
    sources: sources.length,
  };
  const [active, setActive] = useState<Metric>(
    reports.length > 0 ? 'reports' : 'sources',
  );

  async function handleDeleteReport(report: Report) {
    const confirmed = window.confirm(
      `Delete report "${report.title}"? This cannot be undone.`,
    );
    if (!confirmed) return;

    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

    setDeletingId(report.id);

    try {
      const res = await fetch(
        `${apiUrl}/api/research/${researchId}/reports/${report.id}`,
        { method: 'DELETE' },
      );

      if (!res.ok) {
        throw new Error('Failed to delete report');
      }

      setReports((prev) => prev.filter((r) => r.id !== report.id));
      toast.success('Report deleted');
    } catch (error) {
      toast.error('Could not delete report. Please try again.');
      console.error(error);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mb-10">
      <div
        role="tablist"
        aria-label="Research content"
        className="flex w-full max-w-5xl gap-1 rounded-2xl border border-calcite-light bg-muted/50 p-1.5"
      >
        {metrics.map((m) => {
          const selected = m.key === active;
          return (
            <button
              key={m.key}
              role="tab"
              aria-selected={selected}
              aria-controls={`metric-panel-${m.key}`}
              id={`metric-tab-${m.key}`}
              onClick={() => setActive(m.key)}
              className={cn(
                'flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-3 text-sm font-medium transition-all outline-none focus-visible:ring-2 focus-visible:ring-calcite-orange/60 sm:gap-2 sm:px-4',
                selected
                  ? 'bg-calcite-charcoal text-calcite-light shadow-sm'
                  : 'text-muted-foreground hover:bg-background hover:text-foreground',
              )}
            >
              <m.icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{m.label}</span>
              <span
                className={cn(
                  'ml-0.5 shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums sm:ml-1',
                  selected
                    ? 'bg-calcite-orange text-brand-foreground'
                    : 'bg-calcite-light text-foreground',
                )}
              >
                {values[m.key]}
              </span>
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`metric-panel-${active}`}
        aria-labelledby={`metric-tab-${active}`}
        key={active}
        className="mt-3 w-full max-w-5xl rounded-2xl border border-calcite-light bg-card p-6 animate-in fade-in-0 duration-200"
      >
        {active === 'reports' && (
          <ReportsPanel
            reports={reports}
            status={status}
            deletingId={deletingId}
            onDelete={handleDeleteReport}
          />
        )}
        {active === 'sources' && <SourcesPanel sources={sources} />}
        {active === 'findings' && <FindingsPanel findings={findings} />}
      </div>
    </div>
  );
}

function ReportsPanel({
  reports,
  status,
  deletingId,
  onDelete,
}: {
  reports: Report[];
  status: string;
  deletingId: string | null;
  onDelete: (report: Report) => void;
}) {
  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-14 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-calcite-peach/60 text-calcite-charcoal">
          <FileText className="h-7 w-7" />
        </span>
        <p className="max-w-sm text-muted-foreground">
          {status === 'failed'
            ? 'Research failed before a report could be generated.'
            : status === 'completed'
              ? 'Research completed but no report was generated.'
              : 'Report will appear here once research completes.'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {reports.map((report) => (
        <div key={report.id} className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            {report.title ? (
              <h3 className="text-base font-bold tracking-[-0.01em] text-foreground">
                {report.title}
              </h3>
            ) : (
              <span className="text-base font-bold tracking-[-0.01em] text-foreground">
                Report
              </span>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Delete report "${report.title}"`}
              disabled={deletingId === report.id}
              onClick={() => onDelete(report)}
              className="text-muted-foreground hover:text-destructive"
            >
              {deletingId === report.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
          <article className="prose-calcite dark:prose-invert max-w-none rounded-xl border border-calcite-light bg-background p-8">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {report.content}
            </ReactMarkdown>
          </article>
        </div>
      ))}
    </div>
  );
}

function SourcesPanel({ sources }: { sources: Source[] }) {
  if (sources.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No sources collected.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
      {sources.map((source) => (
        <a
          key={source.id}
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex flex-col gap-1.5 rounded-xl border border-calcite-light bg-background p-4 transition-all hover:-translate-y-0.5 hover:border-calcite-orange/50 hover:shadow-md hover:shadow-calcite-orange/5"
        >
          <span className="flex items-center gap-1.5 truncate text-sm font-medium text-foreground group-hover:underline">
            {source.title}
            <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-calcite-charcoal" />
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
  );
}

function FindingsPanel({ findings }: { findings: Finding[] }) {
  if (findings.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No findings extracted.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {findings.map((finding) => (
        <div
          key={finding.id}
          className="rounded-xl border border-calcite-light bg-background p-4"
        >
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <a
              href={finding.source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-w-0 items-center gap-1.5 truncate text-xs font-medium text-muted-foreground hover:text-foreground hover:underline"
            >
              <span className="truncate">{finding.source.title}</span>
              <ExternalLink className="h-3 w-3 shrink-0" />
            </a>
            {finding.confidence && (
              <span
                className={cn(
                  'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize',
                  confidenceStyles[finding.confidence] ?? 'bg-muted text-muted-foreground',
                )}
              >
                {finding.confidence}
              </span>
            )}
          </div>
          <p className="text-sm text-foreground">{finding.claim}</p>
          {finding.evidence && (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {finding.evidence}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}