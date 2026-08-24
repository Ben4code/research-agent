'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  FileText,
  GitBranch,
  Link2,
  Loader2,
  Search,
  Sparkles,
  Target,
  TriangleAlert,
  XCircle,
} from 'lucide-react';

interface ProgressEvent {
  id: string;
  type: string;
  researchId: string;
  step?: string;
  message?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

const eventConfig: Record<
  string,
  {
    label: string;
    icon: typeof Search;
    dot: string;
    iconColor: string;
  }
> = {
  'research.started': {
    label: 'Workflow started',
    icon: Sparkles,
    dot: 'bg-calcite-orange',
    iconColor: 'bg-calcite-peach/60 text-calcite-charcoal',
  },
  'research.planning': {
    label: 'Planning',
    icon: Target,
    dot: 'bg-calcite-orange',
    iconColor: 'bg-calcite-peach/60 text-calcite-charcoal',
  },
  'research.searching': {
    label: 'Searching',
    icon: Search,
    dot: 'bg-calcite-orange',
    iconColor: 'bg-calcite-peach/60 text-calcite-charcoal',
  },
  'research.source_found': {
    label: 'Source found',
    icon: Link2,
    dot: 'bg-calcite-orange',
    iconColor: 'bg-calcite-light text-calcite-charcoal',
  },
  'research.analyzing': {
    label: 'Analyzing',
    icon: GitBranch,
    dot: 'bg-calcite-orange',
    iconColor: 'bg-calcite-light text-calcite-charcoal',
  },
  'research.gap_detected': {
    label: 'Gap detected',
    icon: TriangleAlert,
    dot: 'bg-calcite-orange',
    iconColor: 'bg-calcite-orange/15 text-calcite-charcoal',
  },
  'research.generating_report': {
    label: 'Generating report',
    icon: FileText,
    dot: 'bg-calcite-orange',
    iconColor: 'bg-calcite-peach/60 text-calcite-charcoal',
  },
  'research.completed': {
    label: 'Completed',
    icon: CheckCircle2,
    dot: 'bg-calcite-orange',
    iconColor: 'bg-calcite-peach/60 text-calcite-charcoal',
  },
  'research.failed': {
    label: 'Failed',
    icon: XCircle,
    dot: 'bg-destructive',
    iconColor: 'bg-destructive/10 text-destructive',
  },
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function ResearchProgress({
  researchId,
}: {
  researchId: string;
}) {
  const router = useRouter();
  const [events, setEvents] = useState<ProgressEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!researchId) return;

    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
    const es = new EventSource(`${apiUrl}/api/research/${researchId}/events`);
    esRef.current = es;

    es.onopen = () => setConnected(true);

    const handleEvent = (msg: MessageEvent) => {
      if (!msg.data) return;
      try {
        const event: ProgressEvent = JSON.parse(msg.data);
        setEvents((prev) =>
          prev.some((e) => e.id === event.id) ? prev : [...prev, event],
        );
        setStatus(event.type);
        if (event.type === 'research.completed' || event.type === 'research.failed') {
          es.close();
          router.refresh();
        }
      } catch {
        // ignore malformed frames
      }
    };

    // The API emits named SSE events (event: research.started), so we attach a
    // listener per event type rather than relying on the default `message`.
    const types = [
      'research.started',
      'research.planning',
      'research.searching',
      'research.source_found',
      'research.analyzing',
      'research.gap_detected',
      'research.generating_report',
      'research.completed',
      'research.failed',
    ];
    for (const type of types) {
      es.addEventListener(type, handleEvent);
    }
    es.onmessage = handleEvent;

    es.onerror = () => {
      // The browser reconnects automatically; surface that we're not connected.
      setConnected(false);
    };

    return () => {
      for (const type of types) {
        es.removeEventListener(type, handleEvent);
      }
      es.onmessage = null;
      es.close();
      esRef.current = null;
    };
  }, [researchId, router]);

  if (status === 'research.completed' || status === 'research.failed') {
    return null;
  }

  const showConnectionState = events.length === 0;

  return (
    <div className="mb-10 w-full max-w-5xl rounded-2xl border border-calcite-light bg-card p-6">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-calcite-peach/60 text-calcite-charcoal">
            <Loader2 className="h-4 w-4 animate-spin" />
          </span>
          <div>
            <h2 className="text-base font-bold tracking-[-0.01em] text-foreground">
              Research in progress
            </h2>
            <p className="text-xs text-muted-foreground">
              Live progress — the agent is working in the background.
            </p>
          </div>
        </div>
        {connected && events.length > 0 && (
          <span className="flex items-center gap-1.5 rounded-full border border-calcite-light bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-calcite-orange" />
            live
          </span>
        )}
      </div>

      {showConnectionState ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-calcite-orange" />
          <p className="text-sm text-muted-foreground">
            {connected
              ? 'Waiting for workflow events…'
              : 'Connecting to the live progress feed…'}
          </p>
        </div>
      ) : (
        <ol className="relative flex flex-col gap-0">
          {events.map((event, i) => {
            const config = eventConfig[event.type] ?? {
              label: event.step ?? event.type,
              icon: Search,
              dot: 'bg-calcite-orange',
              iconColor: 'bg-calcite-light text-calcite-charcoal',
            };
            const Icon = config.icon;
            const isLast = i === events.length - 1;
            return (
              <li key={event.id} className="relative flex gap-3.5 pb-5 last:pb-0">
                {!isLast && (
                  <span
                    className="absolute left-[17px] top-9 h-[calc(100%-1.25rem)] w-px bg-calcite-light"
                    aria-hidden
                  />
                )}
                <span
                  className={cn(
                    'relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                    config.iconColor,
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="flex min-w-0 flex-col gap-0.5 pt-1">
                  <span className="text-sm font-medium text-foreground">
                    {config.label}
                  </span>
                  {event.message && (
                    <span className="text-sm text-muted-foreground">
                      {event.message}
                    </span>
                  )}
                  <span className="text-xs tabular-nums text-muted-foreground/70">
                    {formatTime(event.timestamp)}
                  </span>
                </div>
              </li>
            );
          })}
          {connected && status !== 'research.completed' && (
            <li className="relative flex items-center gap-3.5">
              <span
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-calcite-peach/60 text-calcite-charcoal',
                )}
              >
                <Loader2 className="h-4 w-4 animate-spin" />
              </span>
              <span className="text-sm text-muted-foreground">
                Working…
              </span>
            </li>
          )}
        </ol>
      )}
    </div>
  );
}