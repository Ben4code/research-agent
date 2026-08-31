'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { StatusBadge } from '@/components/status-badge';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/api';
import { RequireAdmin } from '@/components/admin/require-admin';
import { UserNav } from '@/components/auth/user-nav';
import { toast } from 'sonner';
import {
  ArrowRight,
  Eye,
  EyeOff,
  FileSearch,
  Globe,
  Lock,
  ShieldCheck,
  Trash2,
  Users,
} from 'lucide-react';

interface AdminResearch {
  id: string;
  question: string;
  instructions: string | null;
  status: string;
  visibility: 'PRIVATE' | 'PUBLIC';
  shareToken: string | null;
  createdAt: string;
  completedAt: string | null;
  userId: string;
  user: { id: string; email: string; name: string | null; role: string };
}

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
  _count: { research: number };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

type Tab = 'research' | 'users';

function AdminDashboard() {
  const [research, setResearch] = useState<AdminResearch[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [active, setActive] = useState<Tab>('research');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      apiFetch<AdminResearch[]>('/admin/research'),
      apiFetch<AdminUser[]>('/admin/users'),
    ])
      .then(([researchData, usersData]) => {
        if (cancelled) return;
        setResearch(researchData);
        setUsers(usersData);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load admin data');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const publicCount = research.filter((r) => r.visibility === 'PUBLIC').length;

  async function handleToggleVisibility(item: AdminResearch) {
    const next = item.visibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC';

    try {
      await apiFetch(`/admin/research/${item.id}/visibility`, {
        method: 'POST',
        body: JSON.stringify({ visibility: next }),
      });
      setResearch((prev) =>
        prev.map((r) =>
          r.id === item.id
            ? {
                ...r,
                visibility: next,
                shareToken: next === 'PUBLIC' ? r.shareToken ?? 'public' : null,
              }
            : r,
        ),
      );
      toast.success(next === 'PUBLIC' ? 'Research is now public' : 'Research is now private');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update visibility');
    }
  }

  async function handleDelete(item: AdminResearch) {
    const confirmed = window.confirm(
      `Delete research "${item.question}" for ${item.user.email}? This cannot be undone.`,
    );
    if (!confirmed) return;

    try {
      await apiFetch(`/admin/research/${item.id}`, { method: 'DELETE' });
      setResearch((prev) => prev.filter((r) => r.id !== item.id));
      toast.success('Research deleted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not delete research');
    }
  }

  const tabs: { key: Tab; label: string; icon: typeof FileSearch; count: number }[] = [
    { key: 'research', label: 'Research', icon: FileSearch, count: research.length },
    { key: 'users', label: 'Users', icon: Users, count: users.length },
  ];

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
            <span className="hidden items-center gap-1.5 rounded-full bg-calcite-peach/60 px-3 py-1 text-xs font-semibold text-calcite-charcoal sm:flex">
              <ShieldCheck className="h-3.5 w-3.5" />
              Admin
            </span>
          </div>
          <div className="flex items-center gap-2">
            <UserNav />
            <Link
              href="/research"
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
            >
              My Research
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-[-0.02em] text-foreground">
            Admin Dashboard
          </h1>
          <p className="mt-2 max-w-[58ch] text-muted-foreground">
            {loading
              ? 'Loading all projects…'
              : `Overview of every research project across all users.`}
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
        ) : (
          <>
            <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <StatCard label="Total research" value={research.length} icon={FileSearch} />
              <StatCard label="Public projects" value={publicCount} icon={Globe} />
              <StatCard label="Total users" value={users.length} icon={Users} />
            </div>

            <div
              role="tablist"
              aria-label="Admin sections"
              className="mb-6 flex w-full gap-1 rounded-2xl border border-calcite-light bg-muted/50 p-1.5"
            >
              {tabs.map((tab) => {
                const selected = tab.key === active;
                return (
                  <button
                    key={tab.key}
                    role="tab"
                    aria-selected={selected}
                    aria-controls={`admin-panel-${tab.key}`}
                    id={`admin-tab-${tab.key}`}
                    onClick={() => setActive(tab.key)}
                    className={cn(
                      'flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-3 text-sm font-medium transition-all outline-none focus-visible:ring-2 focus-visible:ring-calcite-orange/60 sm:gap-2 sm:px-4',
                      selected
                        ? 'bg-calcite-charcoal text-calcite-light shadow-sm'
                        : 'text-muted-foreground hover:bg-background hover:text-foreground',
                    )}
                  >
                    <tab.icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{tab.label}</span>
                    <span
                      className={cn(
                        'ml-0.5 shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums sm:ml-1',
                        selected
                          ? 'bg-calcite-orange text-brand-foreground'
                          : 'bg-calcite-light text-foreground',
                      )}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div
              role="tabpanel"
              id={`admin-panel-${active}`}
              aria-labelledby={`admin-tab-${active}`}
              key={active}
              className="animate-in fade-in-0 duration-200"
            >
              {active === 'research' &&
                (research.length === 0 ? (
                  <EmptyState
                    icon={FileSearch}
                    title="No research projects"
                    description="No research has been created yet."
                  />
                ) : (
                  <div className="flex flex-col gap-3">
                    {research.map((item) => (
                      <ResearchRow
                        key={item.id}
                        item={item}
                        onToggleVisibility={() => handleToggleVisibility(item)}
                        onDelete={() => handleDelete(item)}
                      />
                    ))}
                  </div>
                ))}

              {active === 'users' &&
                (users.length === 0 ? (
                  <EmptyState
                    icon={Users}
                    title="No users"
                    description="No accounts have been created yet."
                  />
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {users.map((user) => (
                      <UserRow key={user.id} user={user} />
                    ))}
                  </div>
                ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof FileSearch;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-calcite-light bg-card p-5">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-calcite-peach/60 text-calcite-charcoal">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-2xl font-black tabular-nums tracking-[-0.02em] text-foreground">
          {value}
        </p>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof FileSearch;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-calcite-light py-20 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-calcite-peach/60 text-calcite-charcoal">
        <Icon className="h-7 w-7" />
      </span>
      <div>
        <p className="text-lg font-medium text-foreground">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function ResearchRow({
  item,
  onToggleVisibility,
  onDelete,
}: {
  item: AdminResearch;
  onToggleVisibility: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group flex items-center justify-between gap-4 rounded-2xl border border-calcite-light bg-card p-5 transition-all hover:border-calcite-orange/50 hover:shadow-lg hover:shadow-calcite-orange/5">
      <div className="flex min-w-0 flex-col gap-2">
        <Link
          href={`/research/${item.id}`}
          className="truncate text-[15px] font-medium leading-snug text-foreground hover:underline"
        >
          {item.question}
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={item.status} />
          <span
            className={cn(
              'flex items-center gap-1 text-xs font-medium',
              item.visibility === 'PUBLIC'
                ? 'text-muted-foreground'
                : 'text-calcite-orange',
            )}
          >
            {item.visibility === 'PUBLIC' ? (
              <Globe className="h-3 w-3" />
            ) : (
              <Lock className="h-3 w-3" />
            )}
            {item.visibility === 'PUBLIC' ? 'Public' : 'Private'}
          </span>
          <span className="text-sm text-muted-foreground">
            {formatDate(item.createdAt)}
          </span>
          <span className="text-sm text-muted-foreground">
            by{' '}
            <span className="font-medium text-foreground">
              {item.user.name ?? item.user.email}
            </span>
          </span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={onToggleVisibility}
          title={
            item.visibility === 'PUBLIC'
              ? 'Make private'
              : 'Make public'
          }
          aria-label={
            item.visibility === 'PUBLIC'
              ? 'Make research private'
              : 'Make research public'
          }
          className="flex h-9 w-9 items-center justify-center rounded-full border border-calcite-light text-muted-foreground transition-all hover:border-calcite-orange/50 hover:bg-calcite-peach/60 hover:text-calcite-charcoal"
        >
          {item.visibility === 'PUBLIC' ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
        <button
          type="button"
          onClick={onDelete}
          title="Delete research"
          aria-label="Delete research"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-calcite-light text-muted-foreground transition-all hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </button>
        <Link
          href={`/research/${item.id}`}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-calcite-light text-muted-foreground transition-all hover:border-calcite-orange/50 hover:bg-calcite-peach/60 hover:text-calcite-charcoal"
          aria-label="Open research"
        >
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function UserRow({ user }: { user: AdminUser }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-calcite-light bg-card p-5">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-calcite-peach/60 text-sm font-bold text-calcite-charcoal">
          {(user.name ?? user.email).charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {user.name ?? '—'}
          </p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span
          className={cn(
            'flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
            user.role === 'admin'
              ? 'bg-calcite-peach/60 text-calcite-charcoal'
              : 'bg-muted text-muted-foreground',
          )}
        >
          {user.role === 'admin' && <ShieldCheck className="h-3 w-3" />}
          {user.role === 'admin' ? 'Admin' : 'User'}
        </span>
        <span className="text-sm tabular-nums text-muted-foreground">
          {user._count.research} research
        </span>
        <span className="hidden text-sm text-muted-foreground sm:block">
          Joined {formatDate(user.createdAt)}
        </span>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <RequireAdmin>
      <AdminDashboard />
    </RequireAdmin>
  );
}