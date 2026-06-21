import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Building2,
  Stethoscope,
  BookOpen,
  Activity,
  Pill,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/patients', label: 'Patients', icon: UserCheck },
  { to: '/admin/navigators', label: 'Navigators', icon: Users },
  { to: '/admin/hospitals', label: 'Hospitals', icon: Building2 },
  { to: '/admin/doctors', label: 'Doctors', icon: Stethoscope },
  { to: '/admin/playbooks', label: 'Playbooks', icon: BookOpen },
  { to: '/admin/symptoms', label: 'Symptoms', icon: Activity },
  { to: '/admin/medicines', label: 'Medicines', icon: Pill },
  { to: '/admin/roles', label: 'Roles', icon: ShieldCheck },
];

export function AppShell() {
  const { user, signOut } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <aside className="hidden md:flex w-64 flex-col bg-card border-r border-border">
        <div className="h-16 px-6 flex items-center border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">HA</span>
            </div>
            <span className="font-semibold text-foreground">Healthadri</span>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-border">
          <div className="px-3 py-2 mb-1">
            <p className="text-sm font-medium text-foreground truncate">
              {user?.name}
            </p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
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

      <main className="flex-1 min-w-0 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
