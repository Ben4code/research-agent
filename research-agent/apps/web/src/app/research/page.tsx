import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { StatusBadge } from '@/components/status-badge';
import { cn } from '@/lib/utils';

interface ResearchItem {
  id: string;
  question: string;
  status: string;
  createdAt: string;
  completedAt: string | null;
}

interface ResearchResponse {
  items: ResearchItem[];
  total: number;
}

async function fetchResearch(): Promise<ResearchItem[]> {
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
  try {
    const res = await fetch(`${apiUrl}/api/research`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data: ResearchResponse = await res.json();
    return data.items;
  } catch {
    return [];
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default async function ResearchPage() {
  const items = await fetchResearch();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/">
              <h1 className="text-lg font-bold text-foreground">
                Research Agent
              </h1>
            </Link>
            <span className="text-muted-foreground">/ History</span>
          </div>
          <Link
            href="/"
            className={cn(buttonVariants({ size: 'sm' }))}
          >
            New Research
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              My Research
            </h2>
            <p className="text-sm text-muted-foreground">
              {items.length} project{items.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-20 text-center">
            <p className="text-lg font-medium text-muted-foreground">
              No research projects yet
            </p>
            <p className="text-sm text-muted-foreground">
              Start your first research project to see it here.
            </p>
            <Link
              href="/"
              className={cn(buttonVariants(), 'mt-2')}
            >
              Start Research
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/research/${item.id}`}
                className="group flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:border-foreground/20 hover:bg-accent"
              >
                <div className="flex flex-col gap-1.5 overflow-hidden">
                  <p className="truncate font-medium text-foreground">
                    {item.question}
                  </p>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={item.status} />
                    <span className="text-sm text-muted-foreground">
                      {formatDate(item.createdAt)}
                    </span>
                  </div>
                </div>
                <span className="ml-4 text-muted-foreground transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
