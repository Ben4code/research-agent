'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { StatusBadge } from '@/components/status-badge';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/api';
import { RequireAuth } from '@/components/auth/require-auth';
import { UserNav } from '@/components/auth/user-nav';
import { ArrowRight, FileSearch, Plus } from 'lucide-react';

interface ResearchItem {
  id: string;
  question: string;
  status: string;
  visibility: string;
  shareToken: string | null;
  createdAt: string;
  completedAt: string | null;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function ResearchList() {
  const [items, setItems] = useState<ResearchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch<{ items: ResearchItem[]; total: number }>('/research')
      .then((data) => {
        if (cancelled) return;
        setItems(data.items);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load research');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-[-0.02em] text-foreground">
            My Research
          </h1>
          <p className="mt-2 max-w-[58ch] text-muted-foreground">
            {loading
              ? 'Loading your projects…'
              : `${items.length} project${items.length !== 1 ? 's' : ''} — reopen any research to see its report and sources.`}
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-2xl border border-calcite-light bg-muted/40"
              />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">
            {error}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-calcite-light py-20 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-calcite-peach/60 text-calcite-charcoal">
              <FileSearch className="h-7 w-7" />
            </span>
            <div>
              <p className="text-lg font-medium text-foreground">
                No research projects yet
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Ask your first question and watch the agent go to work.
              </p>
            </div>
            <Link
              href="/research/new"
              className={cn(buttonVariants(), 'mt-2 gap-1.5')}
            >
              <Plus className="h-4 w-4" />
              Start Research
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/research/${item.id}`}
                className="group flex items-center justify-between gap-4 rounded-2xl border border-calcite-light bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-calcite-orange/50 hover:shadow-lg hover:shadow-calcite-orange/5"
              >
                <div className="flex min-w-0 flex-col gap-2">
                  <p className="truncate text-[15px] font-medium leading-snug text-foreground">
                    {item.question}
                  </p>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={item.status} />
                    <span className="text-sm text-muted-foreground">
                      {formatDate(item.createdAt)}
                    </span>
                    <span
                      className={cn(
                        'text-xs font-medium',
                        item.visibility === 'PUBLIC'
                          ? 'text-muted-foreground'
                          : 'text-calcite-orange',
                      )}
                    >
                      {item.visibility === 'PUBLIC' ? 'Public' : 'Private'}
                    </span>
                  </div>
                </div>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-calcite-light text-muted-foreground transition-all group-hover:border-calcite-orange/50 group-hover:bg-calcite-peach/60 group-hover:text-calcite-charcoal">
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function ResearchPage() {
  return (
    <RequireAuth>
      <ResearchList />
    </RequireAuth>
  );
}