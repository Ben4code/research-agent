'use client';

import Link from 'next/link';
import { useSession } from '@/lib/auth';
import { SignOutButton } from './sign-out-button';
import { LogIn, ShieldCheck } from 'lucide-react';

export function UserNav() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return null;
  }

  if (!session?.user) {
    return (
      <Link
        href="/login"
        className="flex items-center gap-2 rounded-full border border-calcite-light bg-card px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <LogIn className="h-4 w-4" />
        Sign in
      </Link>
    );
  }

  const role = (session.user as { role?: string } | undefined)?.role;

  return (
    <div className="flex items-center gap-2">
      <span className="hidden max-w-[160px] truncate text-sm text-muted-foreground sm:block">
        {session.user.name ?? session.user.email}
      </span>
      {role === 'admin' && (
        <Link
          href="/admin"
          className="flex items-center gap-2 rounded-full border border-calcite-light bg-card px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ShieldCheck className="h-4 w-4" />
          Admin
        </Link>
      )}
      <SignOutButton />
    </div>
  );
}