import * as TabsPrimitive from '@radix-ui/react-tabs';
import type { ComponentProps } from 'react';
import { cn } from '@/shared/utils/cn';

/** Accessible tabs (Radix): arrow keys move between tabs, Home/End jump. */
export const Tabs = TabsPrimitive.Root;

export function TabsList({ className, ...props }: ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        'border-border bg-surface inline-flex items-center gap-1 rounded-full border p-1',
        className,
      )}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'text-text-muted hover:text-text inline-flex min-h-9 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium transition-[background-color,color,box-shadow] duration-150',
        'data-[state=active]:bg-surface-elevated data-[state=active]:text-text data-[state=active]:shadow-elevation-1',
        'disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      className={cn('mt-4 focus-visible:outline-none', className)}
      {...props}
    />
  );
}
