'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/api';
import { ShareLink } from './share-link';
import { Globe, Loader2, Lock } from 'lucide-react';

interface VisibilityToggleProps {
  researchId: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  shareToken: string | null;
}

export function VisibilityToggle({
  researchId,
  visibility: initialVisibility,
  shareToken: initialShareToken,
}: VisibilityToggleProps) {
  const [visibility, setVisibility] = useState(initialVisibility);
  const [shareToken, setShareToken] = useState<string | null>(
    initialShareToken,
  );
  const [pending, setPending] = useState(false);

  async function toggle(next: 'PUBLIC' | 'PRIVATE') {
    if (pending || next === visibility) return;
    setPending(true);

    try {
      const data = await apiFetch<{
        visibility: 'PUBLIC' | 'PRIVATE';
        shareToken: string | null;
      }>(`/research/${researchId}/visibility`, {
        method: 'POST',
        body: JSON.stringify({ visibility: next }),
      });
      setVisibility(data.visibility);
      setShareToken(data.shareToken);
      toast.success(
        data.visibility === 'PUBLIC'
          ? 'Research is now public'
          : 'Research is now private',
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Could not update visibility',
      );
    } finally {
      setPending(false);
    }
  }

  const isPublic = visibility === 'PUBLIC';

  return (
    <div className="flex flex-col items-start gap-3">
      <div className="flex items-center gap-1 rounded-full border border-calcite-light bg-background p-1">
        <button
          type="button"
          onClick={() => toggle('PUBLIC')}
          disabled={pending}
          className={cn(
            'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60',
            isPublic
              ? 'bg-calcite-charcoal text-calcite-light'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Globe className="h-3.5 w-3.5" />
          Public
        </button>
        <button
          type="button"
          onClick={() => toggle('PRIVATE')}
          disabled={pending}
          className={cn(
            'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60',
            !isPublic
              ? 'bg-calcite-charcoal text-calcite-light'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Lock className="h-3.5 w-3.5" />
          Private
        </button>
        {pending && <Loader2 className="mx-1 h-3.5 w-3.5 animate-spin text-calcite-orange" />}
      </div>

      {isPublic && shareToken && <ShareLink shareToken={shareToken} />}
    </div>
  );
}