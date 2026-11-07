import { ChevronDown } from 'lucide-react';
import type { ComponentProps } from 'react';
import { cn } from '@/shared/utils/cn';
import { CONTROL_CLASSES } from './controlClasses';
import { Field } from './Field';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<ComponentProps<'select'>, 'id' | 'children'> {
  label: string;
  options: readonly SelectOption[];
  /** Optional first, empty option (e.g. "Choose a wallet"). */
  placeholder?: string;
  description?: string;
  error?: string;
  hideLabel?: boolean;
  id?: string;
  containerClassName?: string;
}

/** Styled native select: best keyboard, screen-reader and mobile picker support for free. */
export function Select({
  label,
  options,
  placeholder,
  description,
  error,
  hideLabel,
  id,
  containerClassName,
  className,
  ...props
}: SelectProps) {
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
        <div className="relative">
          <select
            id={inputId}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            className={cn(CONTROL_CLASSES, 'cursor-pointer appearance-none pr-10', className)}
            {...props}
          >
            {placeholder === undefined ? null : <option value="">{placeholder}</option>}
            {options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden="true"
            className="text-text-muted pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2"
          />
        </div>
      )}
    </Field>
  );
}
