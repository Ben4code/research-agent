'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUp } from '@/lib/auth';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowRight, Loader2, Sparkles } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || password.length < 8 || loading) return;

    setLoading(true);
    setError(null);

    const { error } = await signUp.email({
      name: name.trim(),
      email,
      password,
    });

    if (error) {
      setError(error.message ?? 'Sign up failed');
      setLoading(false);
      return;
    }

    router.push('/research');
    router.refresh();
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
            href="/login"
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
          >
            Sign in
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-md px-6 py-16">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-calcite-peach/60 text-calcite-charcoal">
            <Sparkles className="h-6 w-6" />
          </span>
          <h1 className="text-3xl font-black tracking-[-0.02em] text-foreground">
            Create your account
          </h1>
          <p className="mt-2 max-w-[40ch] text-muted-foreground">
            Start asking complex questions and get source-backed reports.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-5 rounded-2xl border border-calcite-light bg-card p-6"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ada Lovelace"
              required
              disabled={loading}
              className="h-10"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={loading}
              className="h-10"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
              minLength={8}
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
            disabled={
              !name.trim() || !email.trim() || password.length < 8 || loading
            }
            className={cn(
              buttonVariants({ size: 'lg' }),
              'h-11 gap-2 rounded-full px-6 text-base',
              'disabled:pointer-events-none disabled:opacity-50',
            )}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating account…
              </>
            ) : (
              <>
                Create account
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-medium text-foreground hover:underline"
          >
            Sign in
          </Link>
        </p>
      </main>
    </div>
  );
}