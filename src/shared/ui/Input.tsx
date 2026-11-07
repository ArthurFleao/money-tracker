import type { ComponentProps } from 'react';
import { cn } from '@/shared/utils/cn';
import { CONTROL_CLASSES } from './controlClasses';
import { Field } from './Field';

export interface InputProps extends Omit<ComponentProps<'input'>, 'id'> {
  label: string;
  description?: string;
  error?: string;
  hideLabel?: boolean;
  id?: string;
  containerClassName?: string;
}

/** Labelled text input with description and error wiring. */
export function Input({
  label,
  description,
  error,
  hideLabel,
  id,
  containerClassName,
  className,
  ...props
}: InputProps) {
  return (
    <Field
      label={label}
      description={description}
      error={error}
      hideLabel={hideLabel}
      id={id}
      className={containerClassName}
    >
      {({ inputId, describedBy, invalid }) => (
        <input
          id={inputId}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          className={cn(CONTROL_CLASSES, className)}
          {...props}
        />
      )}
    </Field>
  );
}
