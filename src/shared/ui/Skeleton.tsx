import type { ComponentProps } from 'react';
import { cn } from '@/shared/utils/cn';

/**
 * Loading placeholder that mirrors the final layout. The shimmer stops under
 * `prefers-reduced-motion` (global rule in styles/index.css).
 */
export function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      aria-hidden="true"
      data-slot="skeleton"
      className={cn(
        'animate-shimmer rounded-md bg-[linear-gradient(90deg,var(--color-border)_25%,color-mix(in_oklch,var(--color-border),var(--color-text)_8%)_50%,var(--color-border)_75%)] bg-size-[400%_100%]',
        className,
      )}
      {...props}
    />
  );
}
