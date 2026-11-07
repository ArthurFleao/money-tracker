import { useId, type ReactNode } from 'react';
import { cn } from '@/shared/utils/cn';

export interface FieldIds {
  inputId: string;
  describedBy: string | undefined;
  invalid: boolean;
}

export interface FieldProps {
  label: string;
  description?: string | undefined;
  error?: string | undefined;
  hideLabel?: boolean | undefined;
  id?: string | undefined;
  className?: string | undefined;
  children: (ids: FieldIds) => ReactNode;
}

/** Label + control + description + error, wired with ids and ARIA (shared by Input, Select, …). */
export function Field({
  label,
  description,
  error,
  hideLabel,
  id,
  className,
  children,
}: FieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const descriptionId = description ? `${inputId}-description` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={inputId} className={cn('text-sm font-medium', hideLabel && 'sr-only')}>
        {label}
      </label>
      {children({ inputId, describedBy, invalid: Boolean(error) })}
      {description ? (
        <p id={descriptionId} className="text-text-muted text-xs">
          {description}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-danger text-xs font-medium">
          {error}
        </p>
      ) : null}
    </div>
  );
}
