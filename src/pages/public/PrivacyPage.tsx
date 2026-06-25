import { type ComponentType, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  Baby,
  CheckCircle2,
  ClipboardList,
  KeyRound,
  ListChecks,
  Lock,
  Mail,
  RefreshCw,
  Server,
  Share2,
  ShieldCheck,
  Target,
  Users,
} from 'lucide-react';
import { Blob, Eyebrow, HeaderArt } from '@/components/public/marketing';
import { APP_NAME, LEGAL_LAST_UPDATED, SUPPORT_EMAIL } from '@/config/site';

const COLLECT = [
  {
    title: 'Account and identity',
    items: ['Name, phone number, email', 'Used to create and secure your account'],
  },
  {
    title: 'App usage',
    items: [
      'Check-ins, reminders, uploaded documents, and device information',
      'Helps us improve your experience',
    ],
  },
  {
    title: 'Health information',
    items: [
      'Symptoms, diagnoses, medications, test results, and notes',
      'Shared only with your care team',
    ],
  },
  {
    title: 'Care team information',
    items: ['Doctors, nurses, and caregivers involved in your care'],
  },
];

export function PrivacyPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-primary/[0.07] via-background to-background">
        <Blob className="absolute -left-24 -top-24 h-72 w-72 bg-primary/15" />
        <Blob className="absolute right-0 top-24 h-64 w-64 bg-brand/15" />
        <div className="relative mx-auto max-w-4xl px-4 py-14 md:py-16">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Eyebrow icon={ShieldCheck}>Privacy</Eyebrow>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                Privacy Policy
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">Last updated: {LEGAL_LAST_UPDATED}</p>
            </div>
            <HeaderArt icon={ShieldCheck} />
          </div>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-foreground/90">
            {APP_NAME} helps cancer patients and their caregivers coordinate care with a dedicated
            care team. Because we handle sensitive health information, we want to be clear about what
            we collect, why, and who can see it.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-14">
        <div className="grid gap-4 sm:grid-cols-2">
          <SectionCard icon={Target} title="Who we are" wide>
            <p>
              {APP_NAME} is a cancer patient care-coordination service operating in Telangana and
              Andhra Pradesh, India. If you have any questions about this policy or your data, contact
              us at{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
            </p>
          </SectionCard>

          <SectionCard icon={ClipboardList} title="Information we collect" wide>
            <p>
              We collect the information you and your care team provide so we can support your
              treatment.
            </p>
            <div className="mt-4 grid gap-4 rounded-2xl border border-border bg-muted/40 p-4 sm:grid-cols-2">
              {COLLECT.map((group) => (
                <div key={group.title}>
                  <h3 className="text-sm font-semibold text-foreground">{group.title}</h3>
                  <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-muted-foreground">
                    {group.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard icon={CheckCircle2} title="How we use your information">
            <p>
              To coordinate your care, provide reminders, improve our app, and keep you and your care
              team connected.
            </p>
          </SectionCard>

          <SectionCard icon={Users} title="Who can see your information">
            <p>
              Your information is shared only with your care team and caregivers you invite. We never
              sell your data.
            </p>
          </SectionCard>

          <SectionCard icon={Lock} title="Data security">
            <p>
              We use industry-standard security measures to protect your data. However, no system is
              100% secure.
            </p>
          </SectionCard>

          <SectionCard icon={ListChecks} title="Your choices">
            <p>
              You can update your information, download your data, or request deletion at any time.
              See our <Link to="/account-deletion">Account &amp; Data Deletion</Link> page for
              details.
            </p>
          </SectionCard>

          <SectionCard icon={RefreshCw} title="Changes to this policy" wide>
            <p>
              We may update this policy from time to time. We'll post the new version here with the
              updated date.
            </p>
          </SectionCard>
        </div>

        {/* In more detail */}
        <h2 className="mb-6 mt-14 text-xl font-bold tracking-tight text-foreground">In more detail</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <SectionCard icon={Share2} title="Third-party services" wide>
            <p>We share limited data with service providers that help us run the app:</p>
            <ul>
              <li>
                <strong>Sarvam AI</strong> — when you upload a prescription or discharge summary, we
                send the document text to Sarvam AI to read it (OCR) and extract structured items
                such as medicines, lab tests, and appointment details. Used only to support your
                care, not for advertising.
              </li>
              <li>
                <strong>Google Firebase</strong> — used for push notifications (Cloud Messaging) and,
                where enabled, phone-number verification (OTP/SMS).
              </li>
              <li>
                <strong>Expo</strong> — used to deliver push notifications to your device in some
                builds of the app.
              </li>
            </ul>
            <p>
              These providers process data on our behalf under their own terms. We do not currently
              use third-party analytics or crash-reporting services.
            </p>
          </SectionCard>

          <SectionCard icon={Server} title="How we store and protect your data">
            <p>
              Your medical documents and records are stored in our own database. Sensitive
              credentials are hashed, and data is transmitted over secure connections.
            </p>
          </SectionCard>

          <SectionCard icon={ListChecks} title="Data retention and deletion">
            <p>
              We keep your information for as long as your account is active or as needed to support
              your care. You can request deletion any time — see{' '}
              <Link to="/account-deletion">Account &amp; Data Deletion</Link>.
            </p>
          </SectionCard>

          <SectionCard icon={KeyRound} title="Permissions the app requests">
            <ul>
              <li>
                <strong>Notifications</strong> — to send medication and appointment reminders.
              </li>
              <li>
                <strong>File access</strong> — to let you choose and upload medical documents.
              </li>
            </ul>
            <p>The app does not request access to your camera, microphone, or location.</p>
          </SectionCard>

          <SectionCard icon={Baby} title="Children">
            <p>
              {APP_NAME} is intended for use by patients and caregivers managing cancer care and is
              not directed at children.
            </p>
          </SectionCard>

          <SectionCard icon={Mail} title="Contact us" wide>
            <p>
              Questions about your privacy? Email{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
            </p>
          </SectionCard>
        </div>

        {/* Trust band */}
        <div className="mt-10 flex items-center gap-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100">
            <ShieldCheck className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <h2 className="font-bold text-foreground">Your trust matters to us.</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              We will always be transparent about your data.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

function SectionCard({
  icon: Icon,
  title,
  children,
  wide,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <section
      className={`rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/20 ${
        wide ? 'sm:col-span-2' : ''
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      </div>
      <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground [&_a]:font-medium [&_a]:text-primary [&_a]:hover:underline [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}
