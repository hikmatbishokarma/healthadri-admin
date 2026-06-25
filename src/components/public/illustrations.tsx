import { cn } from '@/lib/utils';

// Hand-drawn flat SVG illustrations in the brand palette, so the marketing
// pages match the reference design without depending on external image assets.

const BLUE = '#1789c0';
const BLUE_LIGHT = '#d6ecf8';
const SKIN = '#f3cda4';
const HAIR = '#3f3f46';

// Friendly AI robot mascot.
export function RobotMascot({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 130" fill="none" className={className} role="img" aria-label="AI robot">
      <line x1="60" y1="18" x2="60" y2="30" stroke={BLUE} strokeWidth="5" strokeLinecap="round" />
      <circle cx="60" cy="12" r="6" fill={BLUE} />
      <rect x="24" y="30" width="72" height="56" rx="18" fill={BLUE_LIGHT} stroke={BLUE} strokeWidth="5" />
      <circle cx="46" cy="58" r="8" fill={BLUE} />
      <circle cx="74" cy="58" r="8" fill={BLUE} />
      <rect x="46" y="72" width="28" height="5" rx="2.5" fill={BLUE} opacity="0.4" />
      <rect x="14" y="48" width="10" height="20" rx="5" fill={BLUE} />
      <rect x="96" y="48" width="10" height="20" rx="5" fill={BLUE} />
      <rect x="34" y="90" width="52" height="34" rx="12" fill={BLUE_LIGHT} stroke={BLUE} strokeWidth="5" />
      <circle cx="60" cy="107" r="6" fill={BLUE} />
    </svg>
  );
}

// A Care Guide: person with a headset holding a tablet.
export function CareGuide({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 152" fill="none" className={className} role="img" aria-label="Care Guide">
      {/* uniform / shoulders */}
      <path d="M20 152 v-16 a40 40 0 0 1 80 0 v16 Z" fill={BLUE} />
      <path d="M50 112 l10 12 l10 -12" stroke="#fff" strokeWidth="5" fill="none" strokeLinejoin="round" />
      {/* head */}
      <circle cx="60" cy="66" r="28" fill={SKIN} />
      {/* hair */}
      <path d="M32 66 a28 28 0 0 1 56 0 Z" fill={HAIR} />
      {/* face */}
      <circle cx="50" cy="70" r="3" fill={HAIR} />
      <circle cx="70" cy="70" r="3" fill={HAIR} />
      <path d="M52 80 q8 6 16 0" stroke={HAIR} strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* headset */}
      <path d="M30 62 a30 30 0 0 1 60 0" stroke={BLUE} strokeWidth="6" fill="none" />
      <rect x="25" y="58" width="11" height="18" rx="5.5" fill={BLUE} />
      <rect x="84" y="58" width="11" height="18" rx="5.5" fill={BLUE} />
      <path d="M89 70 q5 16 -12 18" stroke={BLUE} strokeWidth="5" fill="none" strokeLinecap="round" />
      {/* tablet */}
      <rect x="62" y="116" width="36" height="26" rx="4" fill="#fff" stroke={BLUE} strokeWidth="4" />
      <rect x="68" y="123" width="24" height="3.5" rx="1.75" fill={BLUE} opacity="0.4" />
      <rect x="68" y="131" width="15" height="3.5" rx="1.75" fill={BLUE} opacity="0.4" />
    </svg>
  );
}

// Home "AI keeps watch" band: robot + Care Guide side by side, connected by a
// heart — AI assists, a human decides.
export function AiCareScene({ className }: { className?: string }) {
  return (
    <div className={cn('relative flex items-end justify-center gap-3', className)}>
      <div
        aria-hidden="true"
        className="absolute inset-x-4 bottom-2 top-6 -z-10 rounded-full bg-primary/10 blur-2xl"
      />
      <HeartPlus className="absolute left-1/2 top-0 h-9 w-9 -translate-x-1/2" />
      <RobotMascot className="h-28 w-auto sm:h-32" />
      <CareGuide className="h-32 w-auto sm:h-36" />
    </div>
  );
}

// About trust band: a heart with a pulse line, flanked by two care figures.
export function CareTeamScene({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 140" fill="none" className={className} role="img" aria-label="Care team">
      <path
        d="M100 126 C 38 84, 46 34, 80 34 C 96 34, 100 50, 100 50 C 100 50, 104 34, 120 34 C 154 34, 162 84, 100 126 Z"
        fill={BLUE_LIGHT}
      />
      <path
        d="M56 82 h16 l7 -16 l10 32 l8 -18 h20"
        stroke={BLUE}
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="44" cy="44" r="12" fill={BLUE} />
      <path d="M28 74 a16 16 0 0 1 32 0 Z" fill={BLUE} />
      <circle cx="156" cy="44" r="12" fill={BLUE} />
      <path d="M140 74 a16 16 0 0 1 32 0 Z" fill={BLUE} />
    </svg>
  );
}

function HeartPlus({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
      <circle cx="18" cy="18" r="18" fill="#fff" />
      <path
        d="M18 27 C 8 20, 10 11, 15 11 C 17.5 11, 18 14, 18 14 C 18 14, 18.5 11, 21 11 C 26 11, 28 20, 18 27 Z"
        fill={BLUE}
      />
      <path d="M18 16 v6 M15 19 h6" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
