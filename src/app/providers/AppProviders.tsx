import { MotionConfig } from 'motion/react';
import type { ReactNode } from 'react';
import { TooltipProvider } from '@/shared/ui/Tooltip';
import { ThemeProvider } from './ThemeProvider';
import { Toaster } from './Toaster';

export interface AppProvidersProps {
  children: ReactNode;
}

/** Every cross-cutting provider, in one place. Tests render through the same stack. */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      {/* Honour prefers-reduced-motion for every Motion animation (PLAN.md §7.3). */}
      <MotionConfig reducedMotion="user">
        <TooltipProvider>
          {children}
          <Toaster />
        </TooltipProvider>
      </MotionConfig>
    </ThemeProvider>
  );
}
