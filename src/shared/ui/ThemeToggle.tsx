import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react';
import { useId } from 'react';
import { strings } from '@/shared/i18n/strings';
import type { ThemePreference } from '@/shared/theme/theme';
import { useTheme } from '@/shared/theme/useTheme';
import { cn } from '@/shared/utils/cn';

const OPTIONS: ReadonlyArray<{ value: ThemePreference; label: string; Icon: LucideIcon }> = [
  { value: 'light', label: strings.theme.light, Icon: Sun },
  { value: 'dark', label: strings.theme.dark, Icon: Moon },
  { value: 'system', label: strings.theme.system, Icon: Monitor },
];

export interface ThemeToggleProps {
  className?: string;
}

/** Segmented Light / Dark / System control built on native radios (arrow-key navigation for free). */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const { preference, setPreference } = useTheme();
  const name = useId();

  return (
    <fieldset
      className={cn(
        'border-border bg-surface inline-flex items-center gap-0.5 rounded-full border p-0.5',
        className,
      )}
    >
      <legend className="sr-only">{strings.theme.legend}</legend>
      {OPTIONS.map(({ value, label, Icon }) => {
        const checked = preference === value;
        return (
          <label
            key={value}
            title={label}
            className={cn(
              'relative inline-flex size-8 cursor-pointer items-center justify-center rounded-full transition-colors duration-150',
              'has-[:focus-visible]:outline-accent has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2',
              checked
                ? 'bg-accent text-accent-fg shadow-elevation-1'
                : 'text-text-muted hover:text-text',
            )}
          >
            <input
              type="radio"
              name={name}
              value={value}
              checked={checked}
              onChange={() => {
                setPreference(value);
              }}
              className="sr-only"
            />
            <Icon aria-hidden="true" className="size-4" />
            <span className="sr-only">{label}</span>
          </label>
        );
      })}
    </fieldset>
  );
}
