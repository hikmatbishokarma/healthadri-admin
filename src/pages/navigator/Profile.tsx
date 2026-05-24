import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface NavStats {
  totalPatients: number;
  highPriorityCount: number;
  activeAlertsCount: number;
}

export function NavProfilePage() {
  const { user, signOut } = useAuth();
  const [stats, setStats] = useState<NavStats | null>(null);

  useEffect(() => {
    if (!user?._id) return;
    api.get(`/navigator/dashboard/${user._id}`)
      .then((r) =>
        setStats({
          totalPatients: r.data.totalPatients,
          highPriorityCount: r.data.highPriorityCount,
          activeAlertsCount: r.data.activeAlertsCount,
        }),
      )
      .catch(() => {});
  }, [user?._id]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold text-foreground">Profile</h1>

      {/* Avatar + info */}
      <div className="bg-card border border-border rounded-lg p-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
          {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
        </div>
        <div>
          <p className="font-semibold text-foreground text-lg">{user?.name}</p>
          <span className="inline-block text-xs font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded mt-1">
            Navigator
          </span>
          {user?.email && (
            <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
          )}
          {user?.phone && (
            <p className="text-sm text-muted-foreground mt-0.5">{user.phone}</p>
          )}
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Patients', value: stats.totalPatients },
            { label: 'High Priority', value: stats.highPriorityCount },
            { label: 'Active Alerts', value: stats.activeAlertsCount },
          ].map(({ label, value }) => (
            <div key={label} className="bg-card border border-border rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Sign out */}
      <button
        onClick={signOut}
        className="w-full py-2.5 text-sm font-medium border border-border rounded-lg text-muted-foreground hover:bg-muted transition-colors"
      >
        Sign out
      </button>
    </div>
  );
}
