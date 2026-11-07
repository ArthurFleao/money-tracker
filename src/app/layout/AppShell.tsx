import { strings } from '@/shared/i18n/strings';
import { AnimatedOutlet } from './AnimatedOutlet';
import { MobileNav } from './MobileNav';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export function AppShell() {
  return (
    <div className="flex min-h-dvh">
      <a
        href="#main"
        className="bg-accent text-accent-fg sr-only z-50 rounded-md px-4 py-2 focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        {strings.nav.skipToContent}
      </a>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main
          id="main"
          tabIndex={-1}
          className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-28 outline-none md:px-8 md:pt-10 md:pb-10"
        >
          <AnimatedOutlet />
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
