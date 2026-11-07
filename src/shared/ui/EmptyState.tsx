import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/shared/utils/cn';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  /** Primary call to action, e.g. a "Create wallet" button. */
  action?: ReactNode;
  className?: string;
}

/** Designed empty state for lists and screens (PLAN.md §6.6). */
export function EmptyState({ title, description, icon: Icon, action, className }: EmptyStateProps) {
  return (
    <section
      aria-label={title}
      className={cn(
        'border-border flex flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-12 text-center',
        className,
      )}
    >
      {Icon ? (
        <span className="from-accent/20 to-accent-2/20 text-accent inline-flex size-14 items-center justify-center rounded-full bg-linear-to-br">
          <Icon aria-hidden="true" className="size-6" />
        </span>
      ) : null}
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {description ? <p className="text-text-muted max-w-sm text-sm">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </section>
  );
}
