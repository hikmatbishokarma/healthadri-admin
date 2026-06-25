import { type ComponentType, type ReactNode, useState } from 'react';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  ChevronRight,
  CreditCard,
  Heart,
  Home,
  MessageCircle,
  ShieldCheck,
  Stethoscope,
  User,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type IconType = ComponentType<{ className?: string }>;

// Google Play mark (colorful folded play triangle) for app-download CTAs.
export function GooglePlayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <polygon points="3,3 3,12 13.5,12" fill="#34A853" />
      <polygon points="3,12 3,21 13.5,12" fill="#4285F4" />
      <polygon points="3,3 13.5,12 21,12" fill="#EA4335" />
      <polygon points="3,21 21,12 13.5,12" fill="#FBBC04" />
    </svg>
  );
}

// Soft blurred blob — the recurring "background feel" behind hero art and
// page-header icons in the design.
export function Blob({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('rounded-full blur-3xl', className)} />;
}

// Faint dot grid used as a decorative accent next to illustrations. Drive size
// and color from the className, e.g. "h-12 w-16 text-primary/25".
export function DotPattern({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'bg-[radial-gradient(currentColor_1.5px,transparent_1.5px)] [background-size:11px_11px]',
        className,
      )}
    />
  );
}

// Circular icon badge — the recurring motif across the site (the design uses
// soft circles, not squares).
export function IconTile({
  icon: Icon,
  className,
  iconClassName,
}: {
  icon: IconType;
  className?: string;
  iconClassName?: string;
}) {
  return (
    <div
      className={cn(
        'flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10',
        className,
      )}
    >
      <Icon className={cn('h-5 w-5 text-primary', iconClassName)} />
    </div>
  );
}

// Decorative icon for page headers (Privacy shield, Contact envelope): the icon
// sits on a soft blob with a dot accent to match the design's hero corner art.
export function HeaderArt({ icon: Icon }: { icon: IconType }) {
  return (
    <div className="relative hidden h-20 w-20 shrink-0 sm:block">
      <Blob className="absolute -right-3 -top-3 h-24 w-24 bg-primary/15" />
      <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10">
        <Icon className="h-9 w-9 text-primary" />
      </div>
    </div>
  );
}

// Loads a downloaded illustration from /public; until one is added it renders
// the supplied fallback (a box-less SVG illustration), so nothing shows the
// boxed-placeholder look. Drop a file at `src` to swap in a real image.
export function Illustration({
  src,
  alt,
  fallback,
  className,
}: {
  src: string;
  alt: string;
  fallback: ReactNode;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return <>{fallback}</>;
  return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />;
}

// Small pill label that sits above section titles.
export function Eyebrow({
  icon: Icon,
  children,
  className,
}: {
  icon?: IconType;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary',
        className,
      )}
    >
      {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
      {children}
    </span>
  );
}

export function SectionTitle({
  eyebrow,
  eyebrowIcon,
  title,
  subtitle,
  align = 'center',
  className,
}: {
  eyebrow?: ReactNode;
  eyebrowIcon?: IconType;
  title: ReactNode;
  subtitle?: ReactNode;
  align?: 'center' | 'left';
  className?: string;
}) {
  const centered = align === 'center';
  return (
    <div className={cn(centered ? 'text-center' : 'text-left', className)}>
      {eyebrow ? (
        <Eyebrow icon={eyebrowIcon} className={centered ? 'mx-auto' : ''}>
          {eyebrow}
        </Eyebrow>
      ) : null}
      <h2
        className={cn(
          'text-2xl font-bold tracking-tight text-foreground md:text-3xl',
          eyebrow && 'mt-4',
        )}
      >
        {title}
      </h2>
      {subtitle ? (
        <p className={cn('mt-3 text-muted-foreground', centered && 'mx-auto max-w-2xl')}>
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

// Full-width gradient call-to-action band used to close pages.
export function CtaBand({
  title,
  subtitle,
  children,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-14">
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand via-primary to-primary-darker px-6 py-14 text-center shadow-2xl shadow-primary/20 ring-1 ring-white/10 md:px-12 md:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.22),transparent_55%)]" />
        <Blob className="absolute -right-16 -top-16 h-60 w-60 bg-white/15" />
        <Blob className="absolute -bottom-20 -left-14 h-60 w-60 bg-cyan-300/20" />
        <DotPattern className="absolute right-8 top-8 hidden h-16 w-24 text-white/25 sm:block" />
        <DotPattern className="absolute bottom-8 left-8 hidden h-12 w-20 text-white/15 sm:block" />
        <div className="relative">
          <h2 className="mx-auto max-w-2xl text-2xl font-bold tracking-tight text-white md:text-4xl">
            {title}
          </h2>
          {subtitle ? (
            <p className="mx-auto mt-4 max-w-xl text-base text-white/85">{subtitle}</p>
          ) : null}
          {children ? <div className="mt-8 flex justify-center">{children}</div> : null}
        </div>
      </div>
    </section>
  );
}

// Horizontal arrow between flow steps — hidden on small screens where steps stack.
export function FlowArrow() {
  return (
    <div className="hidden items-center justify-center text-primary/40 md:flex">
      <ArrowRight className="h-5 w-5" />
    </div>
  );
}

// Phone mockup for the hero, sitting on a soft blob + dot backdrop. Drops in
// /public/app-preview.png when present; otherwise renders a styled placeholder
// mirroring the real check-in screen.
export function PhoneFrame({ className }: { className?: string }) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div className={cn('relative mx-auto w-[240px] max-w-full', className)}>
      <Blob className="absolute -inset-6 -z-10 bg-primary/15" />
      <div className="rounded-[2.5rem] border-[10px] border-slate-900 bg-slate-900 shadow-2xl">
        <div className="relative overflow-hidden rounded-[1.8rem] bg-background">
          <div className="absolute left-1/2 top-0 z-10 h-5 w-24 -translate-x-1/2 rounded-b-2xl bg-slate-900" />
          {imgFailed ? (
            <AppPreviewFallback />
          ) : (
            <img
              src="/app-preview.png"
              alt="Healthadri mobile app preview"
              className="h-[520px] w-full object-cover object-top"
              onError={() => setImgFailed(true)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Mirrors the real app home screen so the hero looks authentic before the
// screenshot at /public/app-preview.png is added.
function AppPreviewFallback() {
  return (
    <div className="flex h-[520px] flex-col bg-slate-50 text-left">
      {/* Top bar */}
      <div className="flex items-center justify-between bg-white px-3 py-2.5">
        <div className="flex items-center gap-1.5">
          <img src="/logo.svg" alt="" className="h-6 w-6 object-contain" />
          <div>
            <p className="text-[8px] leading-none text-muted-foreground">Good afternoon,</p>
            <p className="text-[11px] font-bold leading-tight text-foreground">Ravi Kumar</p>
          </div>
        </div>
        <Bell className="h-3.5 w-3.5 text-muted-foreground" />
      </div>

      <div className="relative flex-1 space-y-2 overflow-hidden px-3 py-2">
        {/* Check-in card */}
        <div className="relative overflow-hidden rounded-2xl bg-emerald-50 p-3">
          <p className="text-[8px] text-muted-foreground">How you're feeling today?</p>
          <p className="mt-0.5 text-sm font-bold leading-tight text-foreground">Tap to check in</p>
          <p className="mt-0.5 text-[8px] text-muted-foreground">
            Log your symptoms to get started.
          </p>
          <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-primary px-2 py-1 text-[8px] font-semibold text-primary">
            Log Symptoms <ChevronRight className="h-2.5 w-2.5" />
          </div>
          <Heart className="absolute -right-3 -top-3 h-16 w-16 fill-emerald-200/60 text-emerald-200/60" />
        </div>

        {/* Weekly report */}
        <div className="flex items-center gap-2 rounded-xl border border-border bg-white p-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
            <BarChart3 className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-[9px] font-bold leading-tight text-foreground">See your weekly report</p>
            <p className="text-[7px] text-muted-foreground">Track your health progress</p>
          </div>
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
        </div>

        <p className="pt-0.5 text-[7px] font-semibold tracking-wide text-muted-foreground">
          QUICK ACTIONS
        </p>
        <div className="grid grid-cols-4 gap-1.5">
          <MiniAction icon={Stethoscope} label="Check Symptoms" tint="bg-sky-100" color="text-sky-600" />
          <MiniAction icon={MessageCircle} label="Message Team" tint="bg-violet-100" color="text-violet-600" />
          <MiniAction icon={Bell} label="Reminders" tint="bg-rose-100" color="text-rose-500" />
          <MiniAction icon={CreditCard} label="Insurance Help" tint="bg-amber-100" color="text-amber-600" />
          <MiniAction icon={ShieldCheck} label="My Wellbeing" tint="bg-emerald-100" color="text-emerald-600" />
          <MiniAction icon={BookOpen} label="Learn" tint="bg-indigo-100" color="text-indigo-600" />
          <MiniAction icon={Users} label="Caregiver" tint="bg-orange-100" color="text-orange-600" />
        </div>

        {/* Robot mascot */}
        <div className="absolute bottom-1 right-2 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 ring-2 ring-white">
          <Bot className="h-6 w-6 text-emerald-600" />
        </div>
      </div>

      {/* Bottom tabs */}
      <div className="flex items-center justify-around border-t border-border bg-white py-1.5 text-[7px] text-muted-foreground">
        <TabItem icon={Home} label="Home" active />
        <TabItem icon={Activity} label="Check In" />
        <TabItem icon={Bell} label="Reminders" />
        <TabItem icon={MessageCircle} label="Messages" />
        <TabItem icon={User} label="Profile" />
      </div>
    </div>
  );
}

function MiniAction({
  icon: Icon,
  label,
  tint,
  color,
}: {
  icon: IconType;
  label: string;
  tint: string;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-border bg-white p-1.5 text-center">
      <div className={cn('flex h-7 w-7 items-center justify-center rounded-full', tint)}>
        <Icon className={cn('h-3.5 w-3.5', color)} />
      </div>
      <span className="text-[6.5px] font-medium leading-tight text-foreground">{label}</span>
    </div>
  );
}

function TabItem({ icon: Icon, label, active }: { icon: IconType; label: string; active?: boolean }) {
  return (
    <div className={cn('flex flex-col items-center gap-0.5', active && 'text-primary')}>
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </div>
  );
}
