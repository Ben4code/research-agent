'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import { RequireAuth } from '@/components/auth/require-auth';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ArrowRight, Loader2, ShieldCheck } from 'lucide-react';

function ClaimAdminForm() {
  const router = useRouter();
  const { data: session, isPending, refetch } = useSession();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const role = (session?.user as { role?: string } | undefined)?.role;

  useEffect(() => {
    if (!isPending && role === 'admin') {
      router.replace('/admin');
    }
  }, [isPending, role, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      await apiFetch<{ id: string; role: string }>('/admin/claim', {
        method: 'POST',
        body: JSON.stringify({ code: code.trim() }),
      });

      await refetch();
      toast.success('You are now an admin');
      router.push('/admin');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not register as admin');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-calcite-light bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <img src="/assets/logo-icon.png" alt="DroidSearch" className="h-8 w-8" />
            <span className="text-lg font-black tracking-tight text-foreground">
              Droid<span className="text-calcite-orange">Search</span>
            </span>
          </Link>
          <Link
            href="/research"
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
          >
            Back to research
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-md px-6 py-16">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-calcite-peach/60 text-calcite-charcoal">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <h1 className="text-3xl font-black tracking-[-0.02em] text-foreground">
            Register as admin
          </h1>
          <p className="mt-2 max-w-[42ch] text-muted-foreground">
            Enter the admin signup code to unlock the dashboard and manage every
            research project.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-5 rounded-2xl border border-calcite-light bg-card p-6"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="admin-code">Admin code</Label>
            <Input
              id="admin-code"
              type="password"
              autoComplete="off"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter the admin signup code"
              required
              disabled={loading}
              className="h-10"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!code.trim() || loading}
            className={cn(
              buttonVariants({ size: 'lg' }),
              'h-11 gap-2 rounded-full px-6 text-base',
              'disabled:pointer-events-none disabled:opacity-50',
            )}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Verifying code…
              </>
            ) : (
              <>
                Unlock dashboard
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already an admin?{' '}
          <Link
            href="/admin"
            className="font-medium text-foreground hover:underline"
          >
            Open the dashboard
          </Link>
        </p>
      </main>
    </div>
  );
}

export default function AdminRegisterPage() {
  return (
    <RequireAuth>
      <ClaimAdminForm />
    </RequireAuth>
  );
}