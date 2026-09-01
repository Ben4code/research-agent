'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/api';
import { RequireAuth } from '@/components/auth/require-auth';
import { UserNav } from '@/components/auth/user-nav';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';

function NewResearchForm() {
  const router = useRouter();
  const [question, setQuestion] = useState('');
  const [instructions, setInstructions] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const data = await apiFetch<{ id: string }>('/research', {
        method: 'POST',
        body: JSON.stringify({
          question: question.trim(),
          instructions: instructions.trim() || undefined,
        }),
      });

      router.push(`/research/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-calcite-light bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/research" className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to History
          </Link>
          <div className="flex items-center gap-2">
            <UserNav />
            <Link href="/" className="flex items-center gap-2">
              <img src="/assets/logo-icon.png" alt="DroidSearch" className="h-8 w-8" />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-[-0.02em] text-foreground">
            Start a research project
          </h1>
          <p className="mt-2 max-w-[58ch] text-muted-foreground">
            Ask a complex question. The agent will plan, search the live web,
            and return a source-backed report.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-6 rounded-2xl border border-calcite-light bg-card p-6"
        >
          <div className="flex flex-col gap-2">
            <label htmlFor="question" className="text-sm font-medium text-foreground">
              Research question
            </label>
            <textarea
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. Compare the top five payment processors available to Canadian SaaS companies"
              rows={4}
              required
              disabled={submitting}
              className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:opacity-60"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="instructions" className="text-sm font-medium text-foreground">
              Additional instructions <span className="text-muted-foreground">(optional)</span>
            </label>
            <textarea
              id="instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Focus on pricing, APIs, payment methods, and developer experience"
              rows={3}
              disabled={submitting}
              className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:opacity-60"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Research runs durably in the background — you can leave and return.
            </p>
            <button
              type="submit"
              disabled={!question.trim() || submitting}
              className={cn(
                buttonVariants({ size: 'lg' }),
                'h-11 gap-2 rounded-full px-6 text-base',
                'disabled:pointer-events-none disabled:opacity-50',
              )}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Starting…
                </>
              ) : (
                <>
                  Start Research
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default function NewResearchPage() {
  return (
    <RequireAuth>
      <NewResearchForm />
    </RequireAuth>
  );
}