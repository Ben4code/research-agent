'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Check, Copy, ExternalLink } from 'lucide-react';

export function ShareLink({ shareToken }: { shareToken: string }) {
  const [copied, setCopied] = useState(false);
  const url =
    typeof window !== 'undefined'
      ? `${window.location.origin}/research/public/${shareToken}`
      : '';

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy link');
    }
  }

  return (
    <div className="flex w-full max-w-md items-center gap-2 rounded-xl border border-calcite-light bg-background p-2">
      <span className="flex min-w-0 flex-1 items-center gap-2 truncate px-2 text-xs text-muted-foreground">
        <GlobeIcon className="h-3.5 w-3.5 shrink-0 text-calcite-orange" />
        <span className="truncate">{url}</span>
      </span>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Open public research"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
      <button
        type="button"
        onClick={copy}
        aria-label="Copy share link"
        className="flex h-7 items-center gap-1.5 rounded-lg bg-calcite-charcoal px-2.5 text-xs font-medium text-calcite-light transition-colors hover:opacity-90"
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5" />
            Copied
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" />
            Copy
          </>
        )}
      </button>
    </div>
  );
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  );
}