// Central place for public-site constants. Swap SITE_URL and PLAY_STORE_URL
// here once the domain and Play Store listing are live — nothing else needs editing.

export const SITE_URL = 'https://healthadri.com';
export const SUPPORT_EMAIL = 'care.healthadri@gmail.com';

export const APP_NAME = 'Healthadri';
export const APP_TAGLINE = 'Cancer care, coordinated.';

// Placeholder until the app is published — update with the real listing URL.
export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.healthadri.app';

// Shown as the "Last updated" line on legal pages.
export const LEGAL_LAST_UPDATED = 'June 21, 2026';

// Marketing copy + contact details reused across public pages.
export const APP_HERO_TITLE = 'Daily cancer care that never sleeps.';
export const APP_HERO_SUBTITLE =
  'AI watches for warning signs every day. A real Care Guide is always the one who decides and reaches out.';
export const BRAND_PROMISE = 'AI assists. Humans decide.';
export const BUSINESS_HOURS = 'Mon – Fri · 9:00 AM – 6:00 PM (IST)';
export const SERVICE_REGION = 'Telangana and Andhra Pradesh, India';

export const LEGAL_LINKS = [
  { to: '/privacy', label: 'Privacy Policy' },
  { to: '/terms', label: 'Terms of Service' },
  { to: '/disclaimer', label: 'Medical Disclaimer' },
  { to: '/account-deletion', label: 'Account & Data Deletion' },
] as const;
