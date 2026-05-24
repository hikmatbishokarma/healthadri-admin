import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface Patient {
  _id: string;
  name: string;
  patientCode: string;
  cancerType?: string;
}

interface AdherenceSummary {
  total: number;
  confirmed: number;
  missed: number;
  pending: number;
  adherenceRate: number;
  upcoming: ReminderEvent[];
}

interface ReminderEvent {
  _id: string;
  taskTitle: string;
  taskType: string;
  scheduledAt: string;
  status: string;
}

const TASK_TYPE_LABEL: Record<string, string> = {
  MEDICATION: 'Medication',
  LAB_TEST: 'Lab Test',
  APPOINTMENT: 'Appointment',
  PROCEDURE: 'Procedure',
  VISIT: 'Visit',
};

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'Pending', className: 'bg-yellow-100 text-yellow-700' },
  SENT: { label: 'Sent', className: 'bg-blue-100 text-blue-700' },
  PATIENT_CONFIRMED: { label: 'Confirmed', className: 'bg-green-100 text-green-700' },
  CAREGIVER_CONFIRMED: { label: 'Caregiver Confirmed', className: 'bg-green-100 text-green-700' },
  MISSED: { label: 'Missed', className: 'bg-red-100 text-red-700' },
  SNOOZED: { label: 'Snoozed', className: 'bg-orange-100 text-orange-700' },
};

function AdherenceBar({ rate }: { rate: number }) {
  const color =
    rate >= 80 ? 'bg-green-500' : rate >= 50 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${rate}%` }} />
    </div>
  );
}

function PatientReminderCard({ patient }: { patient: Patient }) {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<AdherenceSummary | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.get(`/reminders/summary/${patient._id}`).then((r) => {
      if (!cancelled) setSummary(r.data);
    });
    return () => { cancelled = true; };
  }, [patient._id]);

  const handleExpand = async () => {
    if (!expanded && !loading) {
      setLoading(false);
    }
    setExpanded((v) => !v);
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <button
        onClick={handleExpand}
        className="w-full text-left p-4 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">{patient.name}</span>
              <span className="text-xs text-muted-foreground">{patient.patientCode}</span>
              {patient.cancerType && (
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  · {patient.cancerType}
                </span>
              )}
            </div>

            {summary ? (
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    {summary.confirmed} confirmed
                  </span>
                  <span className="flex items-center gap-1">
                    <XCircle className="w-3 h-3 text-red-500" />
                    {summary.missed} missed
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-yellow-500" />
                    {summary.pending} upcoming
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <AdherenceBar rate={summary.adherenceRate} />
                  <span
                    className={`text-xs font-medium flex-shrink-0 ${
                      summary.adherenceRate >= 80
                        ? 'text-green-600'
                        : summary.adherenceRate >= 50
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`}
                  >
                    {summary.adherenceRate}%
                  </span>
                </div>
              </div>
            ) : (
              <div className="mt-2 h-4 w-48 bg-muted animate-pulse rounded" />
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {summary && summary.missed > 0 && (
              <AlertTriangle className="w-4 h-4 text-red-500" />
            )}
            {expanded ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </button>

      {expanded && summary && (
        <div className="border-t border-border px-4 pb-4 pt-3 space-y-3">
          {summary.upcoming.length === 0 ? (
            <p className="text-xs text-muted-foreground">No upcoming reminders in the next 7 days.</p>
          ) : (
            <>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Upcoming
              </p>
              <div className="space-y-2">
                {summary.upcoming.map((r) => {
                  const cfg = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.PENDING;
                  return (
                    <div
                      key={r._id}
                      className="flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Bell className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        <span className="truncate text-foreground">{r.taskTitle}</span>
                        <span className="text-muted-foreground flex-shrink-0">
                          {TASK_TYPE_LABEL[r.taskType] ?? r.taskType}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-muted-foreground">
                          {new Date(r.scheduledAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}{' '}
                          {new Date(r.scheduledAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${cfg.className}`}>
                          {cfg.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <button
            onClick={() => navigate(`/nav/care-plans/${patient._id}`)}
            className="text-xs text-primary hover:underline"
          >
            View care plan →
          </button>
        </div>
      )}
    </div>
  );
}

export function NavRemindersPage() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?._id) return;
    api.get(`/navigator/patients/${user._id}`)
      .then((r) => setPatients(r.data))
      .finally(() => setLoading(false));
  }, [user?._id]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <p className="text-muted-foreground text-sm">Loading reminders…</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Reminders</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Adherence tracking across your patient panel
        </p>
      </div>

      {patients.length === 0 ? (
        <div className="text-center py-16">
          <Bell className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">No patients assigned</p>
          <p className="text-xs text-muted-foreground mt-1">
            Patients will appear here once they are assigned to you.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {patients.map((patient) => (
            <PatientReminderCard key={patient._id} patient={patient} />
          ))}
        </div>
      )}
    </div>
  );
}
