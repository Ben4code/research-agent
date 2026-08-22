import { Badge } from '@/components/ui/badge';

const statusConfig: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  pending: { label: 'Pending', variant: 'outline' },
  planning: { label: 'Planning', variant: 'secondary' },
  researching: { label: 'Researching', variant: 'secondary' },
  analyzing: { label: 'Analyzing', variant: 'secondary' },
  generating_report: { label: 'Generating Report', variant: 'secondary' },
  completed: { label: 'Completed', variant: 'default' },
  failed: { label: 'Failed', variant: 'destructive' },
  waiting_for_user: { label: 'Waiting for User', variant: 'outline' },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] ?? {
    label: status,
    variant: 'outline' as const,
  };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
