import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { PlaybookDrawer } from './PlaybookDrawer';

interface Patient {
  _id: string;
  name: string;
  patientCode: string;
  cancerType: string;
  stage: string;
  acuityScore: number;
  priority: 'HIGH' | 'MED' | 'LOW';
  topSymptom: string | null;
  lastUpdatedAt: string | null;
}

const SEVERITY_COLOR: Record<string, string> = {
  HIGH: 'bg-red-100 text-red-700 border-red-200',
  MED: 'bg-amber-100 text-amber-700 border-amber-200',
  LOW: 'bg-green-100 text-green-700 border-green-200',
};

const FILTERS = ['All', 'High', 'Med', 'Low'] as const;

export function NavPatientsPage() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?._id) return;
    api.get(`/navigator/patients/${user._id}`)
      .then((r) => setPatients(r.data))
      .finally(() => setLoading(false));
  }, [user?._id]);

  const filtered = patients.filter((p) => {
    const matchSearch =
      !search ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.patientCode?.toLowerCase().includes(search.toLowerCase());

    const matchFilter =
      filter === 'All' ||
      (filter === 'High' && p.priority === 'HIGH') ||
      (filter === 'Med' && p.priority === 'MED') ||
      (filter === 'Low' && p.priority === 'LOW');

    return matchSearch && matchFilter;
  });

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <p className="text-muted-foreground text-sm">Loading patients…</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Patients</h1>
        <span className="text-sm text-muted-foreground">{patients.length} assigned</span>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or ID…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div className="flex gap-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                filter === f
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:bg-muted'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Patient list */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No patients match this filter.</p>
        )}
        {filtered.map((patient) => (
          <div
            key={patient._id}
            className="bg-card border border-border rounded-lg p-4 flex items-center gap-4 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => setSelectedPatientId(patient._id)}
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0">
              {patient.name?.charAt(0)?.toUpperCase() ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground truncate">{patient.name}</p>
                <span className="text-xs text-muted-foreground">{patient.patientCode}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {patient.cancerType || '—'}
                {patient.stage && ` · ${patient.stage}`}
              </p>
              {patient.topSymptom && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{patient.topSymptom}</p>
              )}
            </div>
            {patient.topSymptom && (
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded border flex-shrink-0 ${
                  SEVERITY_COLOR[patient.priority] ?? 'bg-muted text-muted-foreground border-border'
                }`}
              >
                {patient.priority}
              </span>
            )}
          </div>
        ))}
      </div>

      {selectedPatientId && (
        <PlaybookDrawer
          patientId={selectedPatientId}
          onClose={() => setSelectedPatientId(null)}
        />
      )}
    </div>
  );
}
