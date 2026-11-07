import { strings } from '@/shared/i18n/strings';
import { ThemeToggle } from '@/shared/ui/ThemeToggle';
import { ThemeProvider } from './providers/ThemeProvider';

export function App() {
  return (
    <ThemeProvider>
      <main className="mx-auto flex min-h-dvh max-w-3xl flex-col items-start justify-center gap-6 p-6">
        <h1 className="from-accent to-accent-2 bg-linear-to-r bg-clip-text text-3xl font-semibold tracking-tight text-transparent">
          {strings.app.name}
        </h1>
        <ThemeToggle />
      </main>
    </ThemeProvider>
  );
}
