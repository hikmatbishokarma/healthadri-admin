import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  HeartPulse,
  ShieldAlert,
  Activity,
  MessageSquare,
  FileBarChart,
  User,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { connectNavigatorSocket, disconnectNavigatorSocket } from '@/lib/socket';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/nav/home',              label: 'Dashboard',          icon: LayoutDashboard },
  { to: '/nav/patients',          label: 'Patients',            icon: Users },
  { to: '/nav/care-plan-updates', label: 'Care Plan Updates',   icon: ClipboardList },
  { to: '/nav/active-care-plans', label: 'Active Care Plans',   icon: HeartPulse },
  { to: '/nav/follow-up-alerts',  label: 'Follow-ups',          icon: ShieldAlert },
  { to: '/nav/adherence',         label: 'Adherence',           icon: Activity },
  { to: '/nav/messages',          label: 'Messages',            icon: MessageSquare },
  { to: '/nav/reports',           label: 'Reports',             icon: FileBarChart },
  { to: '/nav/profile',           label: 'Profile',             icon: User },
];

const BADGE_LABELS = new Set(['Care Plan Updates', 'Follow-ups', 'Messages']);

export function NavigatorShell() {
  const { user, signOut } = useAuth();
  const [badges, setBadges] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!user?._id) return;
    const socket = connectNavigatorSocket(user._id);

    socket.on('new_alert',          () => setBadges((b) => ({ ...b, 'Follow-up Alerts': (b['Follow-up Alerts'] ?? 0) + 1 })));
    socket.on('escalation_triggered', () => setBadges((b) => ({ ...b, 'Follow-up Alerts': (b['Follow-up Alerts'] ?? 0) + 1 })));
    socket.on('new_message',        () => setBadges((b) => ({ ...b, Messages: (b.Messages ?? 0) + 1 })));
    socket.on('review_batch_ready', () => setBadges((b) => ({ ...b, 'Care Plan Updates': (b['Care Plan Updates'] ?? 0) + 1 })));

    return () => { disconnectNavigatorSocket(); };
  }, [user?._id]);

  const clearBadge = (label: string) => {
    if (BADGE_LABELS.has(label)) {
      setBadges((b) => ({ ...b, [label]: 0 }));
    }
  };

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="hidden md:flex w-64 flex-col bg-card border-r border-border">
        <div className="h-16 px-6 flex items-center border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">HA</span>
            </div>
            <div>
              <span className="font-semibold text-foreground block leading-tight">Healthadri</span>
              <span className="text-xs text-muted-foreground">Navigator</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ to, label, icon: Icon }) => {
            const badge = badges[label] ?? 0;
            return (
              <NavLink
                key={to}
                to={to}
                onClick={() => clearBadge(label)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors relative',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 truncate">{label}</span>
                {badge > 0 && (
                  <span className="ml-auto bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border">
          <div className="px-3 py-2 mb-1">
            <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email || user?.phone}</p>
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
