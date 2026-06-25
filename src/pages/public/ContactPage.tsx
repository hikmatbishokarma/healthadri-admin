import { type ComponentType, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Mail, MapPin, MessageCircle, MessagesSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Eyebrow, HeaderArt } from '@/components/public/marketing';
import {
  APP_NAME,
  BUSINESS_HOURS,
  LEGAL_LAST_UPDATED,
  SERVICE_REGION,
  SUPPORT_EMAIL,
} from '@/config/site';

const SUBJECTS = [
  'Account help',
  'App or technical issue',
  'Privacy or data request',
  'General inquiry',
  'Other',
];

const QUICK_LINKS = [
  {
    to: '/account-deletion',
    title: 'Account & Data Deletion',
    body: 'Manage or delete your account and data.',
  },
  {
    to: '/privacy',
    title: 'Privacy Policy',
    body: 'Learn how we protect your information.',
  },
  {
    to: '/about',
    title: `About ${APP_NAME}`,
    body: 'Know more about our mission and team.',
  },
];

export function ContactPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 md:py-14">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Eyebrow icon={MessagesSquare}>Contact</Eyebrow>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Get in touch
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Last updated: {LEGAL_LAST_UPDATED}
          </p>
        </div>
        <HeaderArt icon={MessagesSquare} />
      </div>

      <p className="mt-6 max-w-2xl text-base text-foreground/90">
        We're happy to help patients, caregivers, and care teams using {APP_NAME}.
      </p>

      <div className="mt-10 grid gap-10 md:grid-cols-2">
        {/* Left: contact details */}
        <div className="space-y-8">
          <InfoRow icon={Mail} title="Support">
            <p>
              For help with your account, the app, or your data, email us. We aim to respond within a
              few business days.
            </p>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="mt-1 block font-medium text-primary hover:underline">
              {SUPPORT_EMAIL}
            </a>
          </InfoRow>

          <InfoRow icon={MessageCircle} title="General inquiries">
            <p>Have questions about {APP_NAME}? We'd love to hear from you.</p>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="mt-1 block font-medium text-primary hover:underline">
              {SUPPORT_EMAIL}
            </a>
          </InfoRow>

          <InfoRow icon={Clock} title="Business hours">
            <p>{BUSINESS_HOURS}</p>
          </InfoRow>

          <InfoRow icon={MapPin} title="We serve">
            <p>{SERVICE_REGION}</p>
          </InfoRow>
        </div>

        {/* Right: message form (visual only) */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-xl shadow-primary/5 md:p-8">
          <h2 className="text-lg font-semibold text-foreground">Send us a message</h2>
          <form className="mt-5 space-y-4" onSubmit={(e) => e.preventDefault()}>
            <Field label="Your name">
              <input type="text" placeholder="Enter your name" className={inputClass} />
            </Field>
            <Field label="Email address">
              <input type="email" placeholder="Enter your email" className={inputClass} />
            </Field>
            <Field label="Subject">
              <select className={inputClass} defaultValue="">
                <option value="" disabled>
                  Select a topic
                </option>
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Message">
              <textarea
                rows={4}
                placeholder="Type your message here…"
                className={`${inputClass} resize-none`}
              />
            </Field>
            <Button type="submit" className="w-full" size="lg">
              Send message
            </Button>
          </form>
        </div>
      </div>

      {/* Quick links */}
      <div className="mt-10 rounded-2xl border border-border bg-muted/30 p-6">
        <h2 className="font-semibold text-foreground">Looking for something specific?</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="group rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
            >
              <span className="flex items-center gap-1 font-medium text-primary">
                {link.title}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
              <p className="mt-1 text-sm text-muted-foreground">{link.body}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

const inputClass =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring';

function InfoRow({
  icon,
  title,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  children: ReactNode;
}) {
  const Icon = icon;
  return (
    <div className="flex gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-foreground">{title}</h3>
        <div className="mt-1 text-sm leading-relaxed text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}
