import * as SwitchPrimitive from '@radix-ui/react-switch';
import { useId, type ComponentProps } from 'react';
import { cn } from '@/shared/utils/cn';

export interface SwitchProps extends Omit<ComponentProps<typeof SwitchPrimitive.Root>, 'id'> {
  label: string;
  description?: string;
  id?: string;
}

/** Accessible on/off switch (Radix) with a visible label. */
export function Switch({ label, description, id, className, ...props }: SwitchProps) {
  const generatedId = useId();
  const switchId = id ?? generatedId;
  const descriptionId = description ? `${switchId}-description` : undefined;

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-0.5">
        <label htmlFor={switchId} className="text-sm font-medium">
          {label}
        </label>
        {description ? (
          <p id={descriptionId} className="text-text-muted text-xs">
            {description}
          </p>
        ) : null}
      </div>
      <SwitchPrimitive.Root
        id={switchId}
        aria-describedby={descriptionId}
        className={cn(
          'peer border-border inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border p-0.5 transition-colors duration-200',
          'data-[state=checked]:bg-accent data-[state=unchecked]:bg-text/15',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      >
        <SwitchPrimitive.Thumb className="bg-surface-elevated shadow-elevation-1 block size-5.5 rounded-full transition-transform duration-200 data-[state=checked]:translate-x-5" />
      </SwitchPrimitive.Root>
    </div>
  );
}
