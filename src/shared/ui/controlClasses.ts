import { cn } from '@/shared/utils/cn';

/** Shared visual style for text-like form controls (Input, Select, MoneyInput, …). */
export const CONTROL_CLASSES = cn(
  'border-border bg-surface-elevated text-text h-11 w-full rounded-md border px-3 text-base transition-[border-color,box-shadow] duration-150 sm:text-sm',
  'placeholder:text-text-muted/70 hover:border-text/25',
  'focus-visible:border-accent focus-visible:ring-accent/30 focus-visible:ring-4 focus-visible:outline-none',
  'aria-invalid:border-danger aria-invalid:focus-visible:ring-danger/25',
  'disabled:cursor-not-allowed disabled:opacity-50',
);
