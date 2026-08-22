import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <main className="flex w-full max-w-2xl flex-col items-center gap-8 py-32">
        <Badge variant="secondary" className="gap-1.5">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
          Durable Research Workflows
        </Badge>

        <div className="flex flex-col items-center gap-4 text-center">
          <h1 className="text-5xl font-bold tracking-tight text-foreground">
            Research Agent
          </h1>
          <p className="max-w-md text-lg text-muted-foreground">
            Submit complex research questions and receive structured,
            source-backed reports powered by AI agents and durable execution.
          </p>
        </div>

        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Start a research project</CardTitle>
            <CardDescription>
              Enter a research question and let the agent handle the rest.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Link
              href="/research/new"
              className={cn(buttonVariants(), 'flex-1')}
            >
              Start Research
            </Link>
            <Link
              href="/research"
              className={cn(buttonVariants({ variant: 'outline' }), 'flex-1')}
            >
              View History
            </Link>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
