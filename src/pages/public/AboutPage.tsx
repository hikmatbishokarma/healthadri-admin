import {
  ArrowRight,
  Bell,
  Bot,
  ClipboardList,
  FileText,
  Heart,
  HeartHandshake,
  MessageSquare,
  Settings,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  User,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Blob,
  CtaBand,
  Eyebrow,
  FlowArrow,
  GooglePlayIcon,
  IconTile,
  Illustration,
  SectionTitle,
} from '@/components/public/marketing';
import { CareTeamScene, RobotMascot } from '@/components/public/illustrations';
import { APP_NAME, PLAY_STORE_URL, SERVICE_REGION } from '@/config/site';

const FLOW = [
  { icon: ClipboardList, title: 'You', items: ['Daily check-in', 'Upload reports', 'Chat anytime'] },
  { icon: Bot, title: 'AI Assistant', items: ['Watches symptoms', 'Extracts medicines', 'Finds appointments', 'Explains terms'] },
  { icon: Stethoscope, title: 'Care Guide', items: ['Raises alerts', 'Runs playbooks', 'Approves reminders', 'Responds in chat'] },
  { icon: Heart, title: 'You & Caregiver', items: ['Get reminders', 'Missed-dose alerts', 'Stay informed'] },
];

const ROLES = [
  {
    icon: User,
    title: 'Patient',
    items: ['Daily symptom check-ins', 'Upload prescriptions', 'Receive reminders', 'Ask AI to explain medical terms'],
  },
  {
    icon: Heart,
    title: 'Caregiver',
    items: ['Stay informed on status and appointments', 'Get missed-dose alerts', 'Message the Care Guide'],
  },
  {
    icon: Stethoscope,
    title: 'Care Guide (Navigator)',
    items: ['Review patient alerts', 'Run guided playbooks', 'Review & approve AI-extracted reminders', 'Track adherence'],
  },
  {
    icon: Settings,
    title: 'Admin',
    items: ['Configure symptoms and thresholds', 'Set up hospitals & doctors', 'Assign patients to Care Guides'],
  },
];

const HITL = [
  {
    icon: Bell,
    tint: 'bg-amber-100',
    color: 'text-amber-600',
    title: 'AI flags an alert',
    sub: 'Risk or important change detected.',
  },
  {
    icon: Stethoscope,
    tint: 'bg-primary/10',
    color: 'text-primary',
    title: 'Care Guide reviews',
    sub: 'Checks context, history and guidelines.',
  },
  {
    icon: ShieldCheck,
    tint: 'bg-emerald-100',
    color: 'text-emerald-600',
    title: 'Human decides',
    sub: 'Approves, edits or adds instructions.',
  },
  {
    icon: Users,
    tint: 'bg-primary/10',
    color: 'text-primary',
    title: 'You & caregiver informed',
    sub: 'Reminders and guidance shared.',
  },
];

const AI_WORKS = [
  {
    icon: Bot,
    lead: 'Watches daily check-ins',
    rest: ' and raises an alert the moment a symptom crosses a safe limit — so nothing is missed overnight or on a busy day.',
  },
  {
    icon: FileText,
    lead: 'Reads uploaded prescriptions and discharge reports',
    rest: ', pulling out medicines, lab tests, and appointments — each flagged with how confident it is.',
  },
  {
    icon: MessageSquare,
    lead: 'Explains confusing medical terms',
    rest: ' in plain, calm language whenever a patient or caregiver asks.',
  },
  {
    icon: ShieldCheck,
    lead: 'What our AI will never do',
    rest: ': diagnose, prescribe, or suggest treatment or dosage. Those decisions always belong to qualified humans.',
  },
];

export function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/[0.07] via-background to-background">
        <Blob className="absolute -left-24 -top-24 h-72 w-72 bg-primary/15" />
        <Blob className="absolute right-0 top-32 h-72 w-72 bg-brand/15" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-2 md:py-20">
          <div>
            <Eyebrow icon={HeartHandshake}>About {APP_NAME}</Eyebrow>
            <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-foreground md:text-4xl lg:text-5xl">
              Built around the people who fight cancer — and those beside them.
            </h1>
            <p className="mt-5 text-lg text-muted-foreground">
              {APP_NAME} combines AI-assisted monitoring with trained Care Guides to support
              patients, caregivers and healthcare teams throughout treatment.
            </p>
          </div>
          <div className="relative">
            <Blob className="absolute -right-6 -top-6 -z-10 h-48 w-48 bg-primary/15" />
            <Illustration
              src="/about-care.jpg"
              alt="A caregiver supporting a cancer patient"
              className="aspect-[4/3] w-full rounded-3xl object-cover shadow-xl shadow-primary/10"
              fallback={
                <div className="flex aspect-[4/3] w-full items-center justify-center rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/15 via-brand/10 to-background p-8 shadow-xl shadow-primary/10">
                  <CareTeamScene className="h-full w-auto max-w-[280px]" />
                </div>
              }
            />
            <div className="absolute -bottom-5 left-5 hidden items-center gap-2.5 rounded-2xl border border-border bg-card/95 p-3 shadow-xl shadow-primary/5 backdrop-blur sm:flex">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Every decision</p>
                <p className="text-[11px] text-muted-foreground">human-reviewed</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-16">
        {/* Trust band */}
        <div className="relative grid items-center gap-8 overflow-hidden rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/[0.07] to-brand/[0.06] p-8 md:grid-cols-2 md:p-12">
          <Blob className="absolute -right-10 -top-10 h-48 w-48 bg-primary/10" />
          <div className="relative">
            <Eyebrow icon={HeartHandshake}>Our promise</Eyebrow>
            <h2 className="mt-4 text-2xl font-bold text-foreground md:text-3xl">
              Technology keeps watch. People provide care.
            </h2>
            <p className="mt-3 text-muted-foreground">
              We use AI to catch problems faster and explain things more clearly — but every
              important decision is reviewed by a trained Care Guide.
            </p>
          </div>
          <CareTeamScene className="relative mx-auto h-36 w-full max-w-[240px]" />
        </div>

        {/* How care works */}
        <div className="mt-20">
          <SectionTitle
            eyebrow="The flow"
            title={`How care works in ${APP_NAME}`}
            subtitle="AI assists. Care Guides decide. You're never alone."
          />
          <div className="mt-10 grid items-stretch gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr]">
            {FLOW.map((step, i) => (
              <div key={step.title} className="contents">
                <div className="rounded-2xl border border-border bg-card p-5 text-center transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                  <IconTile icon={step.icon} className="mx-auto h-12 w-12" />
                  <h3 className="mt-3 font-semibold text-foreground">{step.title}</h3>
                  <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                    {step.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                {i < FLOW.length - 1 ? <FlowArrow /> : null}
              </div>
            ))}
          </div>
        </div>

        {/* Four people */}
        <div className="mt-20">
          <SectionTitle eyebrow="Everyone, connected" title="The four people behind every patient" />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ROLES.map((role) => (
              <div
                key={role.title}
                className="rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="flex items-center gap-3">
                  <IconTile icon={role.icon} className="h-10 w-10" />
                  <h3 className="font-semibold text-foreground">{role.title}</h3>
                </div>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  {role.items.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* How our AI works — timeline (live text) + separate illustration image */}
        <div className="mt-10 grid items-center gap-8 rounded-3xl border border-violet-100 bg-violet-50 p-6 md:grid-cols-2">
          <div>
            <Eyebrow icon={Sparkles} className="border-violet-200 bg-violet-100/60 text-violet-700">
              Under the hood
            </Eyebrow>
            <h2 className="mt-3 text-2xl font-bold text-foreground">How our AI works</h2>
            <div className="mt-4">
              {AI_WORKS.map((item, i) => (
                <div key={item.lead} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100">
                      <item.icon className="h-5 w-5 text-violet-600" />
                    </div>
                    {i < AI_WORKS.length - 1 ? (
                      <div className="my-0.5 w-px flex-1 bg-violet-200" />
                    ) : null}
                  </div>
                  <p className="pb-3 pt-1 text-sm leading-relaxed text-muted-foreground">
                    <strong className="font-semibold text-foreground">{item.lead}</strong>
                    {item.rest}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <Illustration
            src="/illustrations/ai-flow.png"
            alt="An AI assistant reading check-ins, prescriptions and lab reports"
            className="mx-auto w-full max-w-md"
            fallback={<RobotMascot className="mx-auto h-40 w-auto" />}
          />
        </div>

        {/* Human in the loop — text left + live process flow right, in one row */}
        <div className="mt-6 rounded-3xl border border-amber-100 bg-amber-50 p-6">
          <div className="grid gap-6 lg:grid-cols-[0.85fr_2.15fr] lg:items-center">
            <div>
              <Eyebrow icon={ShieldCheck} className="border-amber-200 bg-amber-100/60 text-amber-700">
                Human in the loop
              </Eyebrow>
              <h2 className="mt-3 text-2xl font-bold text-foreground">Human in the loop</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                AI helps us catch problems faster and explain things more clearly — but every
                important decision passes through a human Care Guide. Patients are never left talking
                to a machine when it matters.
              </p>
            </div>

            <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr]">
              {HITL.map((step, i) => (
                <div key={step.title} className="contents">
                  <div className="flex flex-col items-center text-center">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-full ${step.tint}`}>
                      <step.icon className={`h-5 w-5 ${step.color}`} />
                    </div>
                    <h3 className="mt-2 text-sm font-semibold text-foreground">{step.title}</h3>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{step.sub}</p>
                  </div>
                  {i < HITL.length - 1 ? (
                    <div className="hidden items-center justify-center pt-6 text-amber-400 lg:flex">
                      <ArrowRight className="h-5 w-5" />
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-2xl border border-amber-100 bg-white/70 px-5 py-3 text-center">
            <Heart className="h-5 w-5 text-amber-500" />
            <span className="font-semibold text-foreground">AI assists. Humans decide.</span>
            <span className="text-muted-foreground">That's our promise.</span>
          </div>
        </div>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          {APP_NAME} supports patients and care teams across {SERVICE_REGION}.
        </p>
      </div>

      {/* Closing CTA */}
      <CtaBand
        title="Every patient deserves continuous care between hospital visits."
        subtitle="See how Healthadri keeps patients, caregivers and care teams connected."
      >
        <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer">
          <Button size="lg" className="bg-white text-primary hover:bg-white/90">
            <GooglePlayIcon className="h-4 w-4" />
            Get the app on Google Play
          </Button>
        </a>
      </CtaBand>
    </>
  );
}
