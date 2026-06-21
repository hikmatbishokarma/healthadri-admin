import { Link } from 'react-router-dom';
import { Activity, Bell, MessageCircle, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { APP_NAME, APP_TAGLINE, PLAY_STORE_URL, SUPPORT_EMAIL } from '@/config/site';

const FEATURES = [
  {
    icon: Activity,
    title: 'Daily symptom check-ins',
    body: 'Patients log how they feel each day. The care team is alerted when something needs attention.',
  },
  {
    icon: Bell,
    title: 'Reminders that matter',
    body: 'Medication and appointment reminders help patients stay on track through treatment.',
  },
  {
    icon: MessageCircle,
    title: 'A dedicated care navigator',
    body: 'Every patient is supported by a navigator who coordinates care and answers questions.',
  },
  {
    icon: ShieldCheck,
    title: 'Caregivers, included',
    body: 'Patients can invite a caregiver to help manage appointments, documents, and updates.',
  },
];

export function HomePage() {
  return (
    <>
      <section className="bg-gradient-to-b from-primary/5 to-background">
        <div className="mx-auto max-w-6xl px-4 py-20 md:py-28 text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            {APP_TAGLINE}
          </h1>
          <p className="mt-5 max-w-2xl mx-auto text-lg text-muted-foreground">
            {APP_NAME} helps cancer patients and their caregivers stay connected to
            their care team — from daily symptom check-ins to reminders and support,
            all in one place.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer">
              <Button size="lg">Get the app on Google Play</Button>
            </a>
            <Link to="/about">
              <Button size="lg" variant="outline">
                Learn more
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-6 sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-xl border border-border bg-card p-6 flex gap-4"
            >
              <div className="w-10 h-10 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-14 text-center">
          <h2 className="text-2xl font-semibold text-foreground">
            Questions about {APP_NAME}?
          </h2>
          <p className="mt-2 text-muted-foreground">
            We’re here to help patients and caregivers get the most from their care.
          </p>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="mt-4 inline-block text-primary font-medium hover:underline"
          >
            {SUPPORT_EMAIL}
          </a>
        </div>
      </section>
    </>
  );
}
