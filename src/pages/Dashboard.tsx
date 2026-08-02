import { useEffect, useState } from 'react';
import {
  Users,
  Building2,
  Stethoscope,
  BookOpen,
  Activity,
  UserCheck,
  Pill,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/PageHeader';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

type Counts = {
  patients: number;
  navigators: number;
  hospitals: number;
  doctors: number;
  playbooks: number;
  symptoms: number;
  medicines: number;
};

const STATS: Array<{
  key: keyof Counts;
  label: string;
  icon: LucideIcon;
  tint: string;
}> = [
  { key: 'patients',   label: 'Patients',   icon: UserCheck,   tint: 'text-sky-600 bg-sky-50' },
  { key: 'navigators', label: 'Navigators', icon: Users,       tint: 'text-emerald-600 bg-emerald-50' },
  { key: 'hospitals',  label: 'Hospitals',  icon: Building2,   tint: 'text-blue-600 bg-blue-50' },
  { key: 'doctors',    label: 'Doctors',    icon: Stethoscope, tint: 'text-violet-600 bg-violet-50' },
  { key: 'playbooks',  label: 'Playbooks',  icon: BookOpen,    tint: 'text-amber-600 bg-amber-50' },
  { key: 'symptoms',   label: 'Symptoms',   icon: Activity,    tint: 'text-rose-600 bg-rose-50' },
  { key: 'medicines',  label: 'Medicines',  icon: Pill,        tint: 'text-teal-600 bg-teal-50' },
];

export function DashboardPage() {
  const { user } = useAuth();
  const [counts, setCounts] = useState<Counts | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [patients, navigators, hospitals, doctors, playbooks, symptoms, medicines] = await Promise.all([
          api.get('/users/patients'),
          api.get('/users/navigators'),
          api.get('/hospitals'),
          api.get('/doctors'),
          api.get('/playbooks'),
          api.get('/symptoms'),
          api.get('/medicines'),
        ]);
        if (cancelled) return;
        setCounts({
          patients:   patients.data?.total ?? 0,
          navigators: navigators.data?.total ?? 0,
          hospitals:  hospitals.data?.total ?? 0,
          doctors:    doctors.data?.total ?? 0,
          playbooks:  playbooks.data?.total ?? 0,
          symptoms:   symptoms.data?.total ?? 0,
          medicines:  medicines.data?.total ?? 0,
        });
      } catch {
        if (!cancelled) setCounts({ patients: 0, navigators: 0, hospitals: 0, doctors: 0, playbooks: 0, symptoms: 0, medicines: 0 });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <PageHeader
        title={`Welcome back, ${user?.name ?? 'Admin'}`}
        description="Overview of the Healthadri system."
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
        {STATS.map(({ key, label, icon: Icon, tint }) => (
          <Card key={key}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="text-3xl font-semibold mt-2 tracking-tight">
                    {loading ? '—' : (counts?.[key] ?? 0)}
                  </p>
                </div>
                <div className={`w-9 h-9 rounded-md flex items-center justify-center ${tint}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardContent className="pt-6">
          <h2 className="text-base font-semibold text-foreground">Getting started</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Use the sidebar to onboard navigators, hospitals, and doctors, or to configure
            playbooks and symptom thresholds. Changes take effect immediately for the
            mobile app.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
