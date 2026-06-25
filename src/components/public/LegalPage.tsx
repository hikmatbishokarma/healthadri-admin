import { type ReactNode } from 'react';
import { LEGAL_LAST_UPDATED } from '@/config/site';

// Shared wrapper for legal/long-form pages. Descendant utility classes style
// plain semantic markup (h2/h3/p/ul/a) so each page just writes content —
// no dependency on the Tailwind typography plugin.
export function LegalPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:py-16">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        {title}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: {LEGAL_LAST_UPDATED}
      </p>
      {intro ? (
        <p className="mt-6 text-base text-foreground/90">{intro}</p>
      ) : null}

      <div
        className={[
          'mt-8 space-y-4',
          '[&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:mt-10 [&_h2]:mb-2',
          '[&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mt-6 [&_h3]:mb-1',
          '[&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-muted-foreground',
          '[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ul]:text-sm [&_ul]:text-muted-foreground',
          '[&_li]:leading-relaxed',
          '[&_a]:text-primary [&_a]:hover:underline',
          '[&_strong]:text-foreground [&_strong]:font-semibold',
        ].join(' ')}
      >
        {children}
      </div>
    </div>
  );
}
