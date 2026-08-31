'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Loader2, ShieldAlert, ShieldCheck } from 'lucide-react';

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const role = (session?.user as { role?: string } | undefined)?.role;

  useEffect(() => {
    if (!isPending && !session) {
      router.replace('/login');
    }
  }, [isPending, session, router]);

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-calcite-orange" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-2xl border border-calcite-light bg-card p-10 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <ShieldAlert className="h-7 w-7" />
          </span>
          <div>
            <h1 className="text-2xl font-black tracking-[-0.02em] text-foreground">
              Admin access required
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Your account does not have the admin role. Register with the admin
              code to unlock the dashboard.
            </p>
          </div>
          <Link
            href="/admin/register"
            className={cn(buttonVariants(), 'mt-2 gap-2')}
          >
            <ShieldCheck className="h-4 w-4" />
            Register as admin
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}