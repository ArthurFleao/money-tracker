import { MotionConfig } from 'motion/react';
import type { ReactNode } from 'react';
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
        {children}
        <Toaster />
      </MotionConfig>
    </ThemeProvider>
  );
}
