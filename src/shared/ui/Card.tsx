import type { ComponentProps } from 'react';
import { cn } from '@/shared/utils/cn';

export interface CardProps extends ComponentProps<'div'> {
  /** Elevation level from the design tokens (PLAN.md §7.2). */
  elevation?: 1 | 2 | 3;
  /** Adds hover lift + accent glow for clickable cards. */
  interactive?: boolean;
}

const ELEVATION = {
  1: 'shadow-elevation-1',
  2: 'shadow-elevation-2',
  3: 'shadow-elevation-3',
} as const;

export function Card({ elevation = 1, interactive = false, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'border-border bg-surface rounded-lg border',
        ELEVATION[elevation],
        interactive &&
          'hover:shadow-glow cursor-pointer transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5',
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex flex-col gap-1 p-5 pb-0', className)} {...props} />;
}

export function CardTitle({ className, children, ...props }: ComponentProps<'h3'>) {
  return (
    <h3 className={cn('text-base font-semibold tracking-tight', className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ className, ...props }: ComponentProps<'p'>) {
  return <p className={cn('text-text-muted text-sm', className)} {...props} />;
}

export function CardContent({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('p-5', className)} {...props} />;
}

export function CardFooter({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex items-center gap-2 p-5 pt-0', className)} {...props} />;
}
