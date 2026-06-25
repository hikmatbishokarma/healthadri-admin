import {
  Activity,
  Bell,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  FileText,
  Heart,
  HeartHandshake,
  MapPin,
  Play,
  Settings,
  Sparkles,
  Stethoscope,
  User,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Blob,
  CtaBand,
  DotPattern,
  Eyebrow,
  IconTile,
  PhoneFrame,
  SectionTitle,
} from '@/components/public/marketing';
import { AiCareScene } from '@/components/public/illustrations';
import {
  APP_HERO_SUBTITLE,
  APP_NAME,
  PLAY_STORE_URL,
  SERVICE_REGION,
} from '@/config/site';

const HERO_POINTS = ['Daily monitoring', 'Human-reviewed', 'Built for cancer care'];

const STEPS = [
  {
    icon: ClipboardList,
    title: 'Check in daily',
    body: 'Share how you feel in about two minutes from the app.',
  },
  {
    icon: Sparkles,
    title: 'AI flags what matters',
    body: 'Risky symptoms and report details surface instantly.',
  },
  {
    icon: Stethoscope,
    title: 'Your Care Guide steps in',
    body: 'A trained person reviews, approves and reaches out.',
  },
];

const AI_CHIPS = ['Scores daily symptoms', 'Reads your reports', 'Explains medical terms'];

const VALUES = [
  {
    icon: Activity,
    title: 'Continuous monitoring',
    body: 'Daily check-ins catch warning signs early — even overnight or on a busy day.',
  },
  {
    icon: HeartHandshake,
    title: 'Human in the loop',
    body: 'A trained Care Guide reviews and approves before anything reaches you.',
  },
  {
    icon: CalendarCheck,
    title: 'Care between visits',
    body: 'Reminders, reports and chat keep care going between hospital appointments.',
  },
];

const ROLES = [
  { icon: User, title: 'Patient', body: 'Check in daily, get reminders and stay on track.' },
  { icon: Heart, title: 'Caregiver', body: 'Stay informed and get missed-dose alerts.' },
  { icon: Stethoscope, title: 'Care Guide', body: 'Monitor alerts, run playbooks, guide care.' },
  { icon: Settings, title: 'Admin', body: 'Set up care teams, rules and keep it safe.' },
];

export function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/[0.07] via-background to-background">
        <Blob className="absolute -left-24 -top-24 h-72 w-72 bg-primary/15" />
        <Blob className="absolute right-0 top-40 h-80 w-80 bg-brand/15" />
        <DotPattern className="absolute left-1/3 top-12 hidden h-20 w-28 text-primary/15 lg:block" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-2 md:py-20">
          <div>
            <Eyebrow icon={Sparkles}>AI + human care</Eyebrow>
            <h1 className="mt-4 text-4xl font-bold leading-[1.1] tracking-tight text-foreground md:text-5xl lg:text-6xl">
              Daily cancer care that{' '}
              <span className="bg-gradient-to-r from-primary to-brand bg-clip-text text-transparent">
                never sleeps.
              </span>
            </h1>
            <p className="mt-5 max-w-md text-lg text-muted-foreground">{APP_HERO_SUBTITLE}</p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer">
                <Button size="lg">
                  <Play className="h-4 w-4" />
                  Get the app on Google Play
                </Button>
              </a>
              <Link to="/about">
                <Button size="lg" variant="outline">
                  See how it works
                </Button>
              </Link>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2">
              {HERO_POINTS.map((point) => (
                <span key={point} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  {point}
                </span>
              ))}
            </div>
          </div>

          {/* Phone with floating accent cards */}
          <div className="relative mx-auto">
            <PhoneFrame />
            <FloatingCard
              className="-left-4 top-20 hidden lg:flex"
              icon={CheckCircle2}
              tint="bg-emerald-100"
              color="text-emerald-600"
              title="Alert reviewed"
              sub="by your Care Guide"
            />
            <FloatingCard
              className="-right-2 bottom-28 hidden lg:flex"
              icon={Bell}
              tint="bg-primary/10"
              color="text-primary"
              title="Medicine reminder"
              sub="Today · 8:00 AM"
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <SectionTitle
          eyebrow="How it works"
          title="From check-in to care, in three steps"
          subtitle="The app does the watching. A real person does the deciding."
        />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <div
              key={step.title}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
            >
              <span className="pointer-events-none absolute -right-1 -top-3 text-6xl font-black text-primary/5">
                {`0${i + 1}`}
              </span>
              <IconTile icon={step.icon} className="h-12 w-12" />
              <h3 className="mt-4 font-semibold text-foreground">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* AI + human band */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="relative grid items-center gap-8 overflow-hidden rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/[0.07] to-brand/[0.06] p-8 md:grid-cols-2 md:p-12">
          <Blob className="absolute -right-10 -bottom-10 h-48 w-48 bg-primary/10" />
          <div className="relative">
            <AiCareScene className="mx-auto h-44 w-full max-w-sm" />
          </div>
          <div className="relative">
            <Eyebrow icon={Sparkles}>AI, kept in check</Eyebrow>
            <h2 className="mt-4 text-2xl font-bold leading-snug text-foreground md:text-3xl">
              AI keeps watch every day. A trained Care Guide makes every decision.
            </h2>
            <p className="mt-3 text-muted-foreground">
              Our AI reviews daily check-ins and reads uploaded reports to flag risks and pull out
              medicines and appointments — but it never acts alone. A Care Guide reviews and approves
              before anything reaches you.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {AI_CHIPS.map((chip) => (
                <span
                  key={chip}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground"
                >
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  {chip}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why Healthadri */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <SectionTitle eyebrow="Why Healthadri" title="Care that doesn't fall through the cracks" />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {VALUES.map((value) => (
            <div
              key={value.title}
              className="rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5"
            >
              <IconTile icon={value.icon} className="h-12 w-12" />
              <h3 className="mt-4 font-semibold text-foreground">{value.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{value.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Four people, one patient */}
      <section className="mx-auto max-w-5xl px-4 pb-16">
        <SectionTitle
          eyebrow="Everyone, connected"
          title="Four people, one patient"
          subtitle="Care that brings everyone together."
        />
        <div className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ROLES.map((role) => (
            <div
              key={role.title}
              className="group flex flex-col items-center rounded-2xl border border-border bg-card p-5 text-center transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
            >
              <IconTile
                icon={role.icon}
                className="h-12 w-12 transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
                iconClassName="transition-colors group-hover:text-primary-foreground"
              />
              <h3 className="mt-3 text-sm font-semibold text-foreground">{role.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{role.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Region strip */}
      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-4 py-10 sm:flex-row sm:items-center">
          <IconTile icon={MapPin} className="h-12 w-12" />
          <div className="flex-1">
            <h2 className="text-lg font-bold text-foreground md:text-xl">
              Built for cancer patients across {SERVICE_REGION.replace(', India', '')}.
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {APP_NAME} is here to support you and your family at every step.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4 text-primary" />
            Reports &amp; reminders in one place
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <div className="pt-16">
        <CtaBand
          title="Care that continues between hospital visits."
          subtitle="Join patients and care teams using Healthadri to stay connected, every day."
        >
          <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90">
              <Play className="h-4 w-4" />
              Get the app on Google Play
            </Button>
          </a>
        </CtaBand>
      </div>
    </>
  );
}

function FloatingCard({
  className,
  icon: Icon,
  tint,
  color,
  title,
  sub,
}: {
  className?: string;
  icon: typeof Bell;
  tint: string;
  color: string;
  title: string;
  sub: string;
}) {
  return (
    <div
      className={`absolute z-10 items-center gap-2.5 rounded-2xl border border-border bg-card/95 p-3 shadow-xl shadow-primary/5 backdrop-blur ${className}`}
    >
      <div className={`flex h-9 w-9 items-center justify-center rounded-full ${tint}`}>
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <div>
        <p className="text-xs font-semibold text-foreground">{title}</p>
        <p className="text-[11px] text-muted-foreground">{sub}</p>
      </div>
    </div>
  );
}
