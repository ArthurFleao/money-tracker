import { strings } from '@/shared/i18n/strings';

export interface PlaceholderPageProps {
  title: string;
  description: string;
  /** Roadmap phase that delivers this screen; omitted for permanent pages such as 404. */
  phase?: number;
}

/** Temporary screen for routes whose feature lands in a later phase. */
export function PlaceholderPage({ title, description, phase }: PlaceholderPageProps) {
  return (
    <section aria-labelledby="page-title" className="space-y-3">
      {phase === undefined ? null : (
        <p className="text-accent text-xs font-semibold tracking-wider uppercase">
          {strings.placeholder.comingIn(phase)}
        </p>
      )}
      <h1 id="page-title" className="text-2xl font-semibold tracking-tight md:text-3xl">
        {title}
      </h1>
      <p className="text-text-muted max-w-prose">{description}</p>
    </section>
  );
}
