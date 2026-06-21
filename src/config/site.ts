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

export const LEGAL_LINKS = [
  { to: '/privacy', label: 'Privacy Policy' },
  { to: '/terms', label: 'Terms of Service' },
  { to: '/disclaimer', label: 'Medical Disclaimer' },
  { to: '/account-deletion', label: 'Account & Data Deletion' },
] as const;
