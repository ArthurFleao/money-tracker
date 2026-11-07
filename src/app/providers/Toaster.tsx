import { Toaster as SonnerToaster } from 'sonner';
import { useTheme } from '@/shared/theme/useTheme';

/** App-wide toasts, themed to match the current resolved theme. */
export function Toaster() {
  const { resolvedTheme } = useTheme();
  return (
    <SonnerToaster
      theme={resolvedTheme}
      position="bottom-right"
      mobileOffset={{ bottom: 96 }}
      closeButton
      toastOptions={{
        className: 'font-sans',
      }}
    />
  );
}
