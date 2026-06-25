import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { type ComponentType } from 'react';
import { Heart, Menu, Play, X } from 'lucide-react';
import { Logo } from '@/components/public/Logo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  APP_NAME,
  BRAND_PROMISE,
  BUSINESS_HOURS,
  PLAY_STORE_URL,
  SUPPORT_EMAIL,
} from '@/config/site';

const NAV = [
  { to: '/', label: 'Home', end: true },
  { to: '/about', label: 'About' },
  { to: '/privacy', label: 'Privacy' },
  { to: '/contact', label: 'Contact' },
];

const FOOTER_COLUMNS = [
  {
    title: 'Product',
    links: [
      { to: '/', label: 'Home' },
      { to: '/about', label: 'About' },
      { to: '/privacy', label: 'Privacy' },
      { to: '/contact', label: 'Contact' },
    ],
  },
  {
    title: 'Care',
    links: [
      { to: '/about', label: 'Patients' },
      { to: '/about', label: 'Caregivers' },
      { to: '/about', label: 'Care Guides' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { to: '/privacy', label: 'Privacy Policy' },
      { to: '/disclaimer', label: 'Medical Disclaimer' },
      { to: '/account-deletion', label: 'Account & Data Deletion' },
    ],
  },
];

// lucide-react no longer ships brand marks, so the social glyphs are inline SVGs.
const FacebookIcon: ComponentType<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z" />
  </svg>
);

const InstagramIcon: ComponentType<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37Z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const LinkedinIcon: ComponentType<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
  </svg>
);

const SOCIALS = [
  { label: 'Facebook', href: 'https://facebook.com', icon: FacebookIcon },
  { label: 'Instagram', href: 'https://instagram.com', icon: InstagramIcon },
  { label: 'LinkedIn', href: 'https://linkedin.com', icon: LinkedinIcon },
];

export function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="shrink-0">
            <Logo />
          </Link>

          <div className="flex items-center gap-2">
            <nav className="hidden items-center gap-1 md:flex">
              {NAV.map(({ to, label, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    cn(
                      'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                    )
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>

            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex"
            >
              <Button size="sm">
                <Play className="h-4 w-4" />
                Get the app
              </Button>
            </a>

            <button
              className="p-2 text-muted-foreground md:hidden"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {menuOpen ? (
          <nav className="space-y-1 border-t border-border bg-card px-4 py-2 md:hidden">
            {NAV.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'block rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )
                }
              >
                {label}
              </NavLink>
            ))}
            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2"
            >
              <Button size="sm" className="w-full">
                <Play className="h-4 w-4" />
                Get the app
              </Button>
            </a>
          </nav>
        ) : null}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-border bg-muted/30">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-5">
          <div className="space-y-3 md:col-span-1">
            <Logo />
            <p className="max-w-xs text-sm text-muted-foreground">
              AI-assisted cancer care coordination supporting patients and caregivers across
              Telangana and Andhra Pradesh.
            </p>
            <div className="flex items-center gap-2 pt-1">
              {SOCIALS.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title} className="space-y-2.5">
              <h3 className="text-sm font-semibold text-foreground">{col.title}</h3>
              <ul className="space-y-2">
                {col.links.map((link, i) => (
                  <li key={`${link.to}-${link.label}-${i}`}>
                    <Link
                      to={link.to}
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="space-y-2.5">
            <h3 className="text-sm font-semibold text-foreground">Support</h3>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="block text-sm text-primary hover:underline"
            >
              {SUPPORT_EMAIL}
            </a>
            <p className="text-sm text-muted-foreground">{BUSINESS_HOURS}</p>
          </div>
        </div>

        <div className="border-t border-border">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground sm:flex-row">
            <span>
              © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
            </span>
            <span className="inline-flex items-center gap-1">
              {BRAND_PROMISE}
              <Heart className="h-3.5 w-3.5 text-primary" />
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
