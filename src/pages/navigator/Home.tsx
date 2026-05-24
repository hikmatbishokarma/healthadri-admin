import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, ShieldAlert, ClipboardList, TrendingUp,
  ChevronRight, Clock, CheckCircle2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface DashboardSummary {
  summary: {
    totalPatients: number;
    highPriority: number;
    alerts: number;
    followupsDue: number;
  };
  highPriorityPatients: Array<{
    _id: string; name: string; cancerType: string; stage: string;
    severity: string; reason: string;
  }>;
}

interface Escalation {
  _id: string;
  trigger: string;
  level: string;
  status: string;
  missedCount: number;
  createdAt: string;
  patientId: { _id: string; name: string; patientCode: string; cancerType?: string };
}

interface ReviewBatch {
  _id: string;
  status: string;
  taskCount: number;
  verifiedCount: number;
  createdAt: string;
  patientId: { _id: string; name: string; patientCode: string; cancerType?: string };
  documentId: { _id: string; fileName: string };
}

const SEVERITY_RING: Record<string, string> = {
  HIGH: 'border-l-4 border-l-red-500',
  MED: 'border-l-4 border-l-amber-400',
  LOW: 'border-l-4 border-l-green-400',
};

const TRIGGER_LABEL: Record<string, string> = {
  MISSED_REMINDERS: 'Missed reminders',
  MISSED_APPOINTMENT: 'Missed appointment',
  HIGH_ALERT: 'Critical alert',
  MANUAL: 'Manual escalation',
};

function timeAgo(dateStr: string) {
  const ms = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(ms / 3600000);
  if (h < 1) return 'Just now';
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function NavHomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dash, setDash] = useState<DashboardSummary | null>(null);
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [batches, setBatches] = useState<ReviewBatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?._id) return;
    Promise.all([
      api.get(`/navigator/dashboard/${user._id}`),
      api.get(`/escalations/navigator/${user._id}`),
      api.get(`/review-queue/navigator/${user._id}`),
    ]).then(([dRes, eRes, bRes]) => {
      setDash(dRes.data);
      setEscalations(eRes.data ?? []);
      setBatches(bRes.data ?? []);
    }).finally(() => setLoading(false));
  }, [user?._id]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <p className="text-muted-foreground text-sm">Loading dashboard…</p>
      </div>
    );
  }

  const needsAction = escalations.filter((e) => e.status === 'ESCALATED_TO_NAVIGATOR');
  const monitoring = escalations.filter((e) => e.status === 'OPEN');
  const pendingBatches = batches.filter((b) => b.status === 'PENDING' || b.status === 'IN_REVIEW');
  const totalPatients = dash?.summary?.totalPatients ?? 0;
  const activeAlerts = dash?.summary?.alerts ?? 0;

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Patients',    value: totalPatients,             icon: Users,         color: 'text-blue-600',   bg: 'bg-blue-50' },
          { label: 'Needs Action',      value: needsAction.length,        icon: ShieldAlert,   color: 'text-red-600',    bg: 'bg-red-50' },
          { label: 'Pending Reviews',   value: pendingBatches.length,     icon: ClipboardList, color: 'text-amber-600',  bg: 'bg-amber-50' },
          { label: 'Active Alerts',     value: activeAlerts,              icon: TrendingUp,    color: 'text-violet-600', bg: 'bg-violet-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">{label}</p>
              <div className={`w-7 h-7 rounded-md ${bg} flex items-center justify-center`}>
                <Icon className={`w-3.5 h-3.5 ${color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
          </div>
        ))}
      </div>

      {/* Needs immediate action */}
      {needsAction.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Needs Immediate Action
            </h2>
            <button
              onClick={() => navigate('/nav/follow-up-alerts')}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              View all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {needsAction.slice(0, 3).map((e) => (
              <div
                key={e._id}
                onClick={() => navigate('/nav/follow-up-alerts')}
                className={`bg-card border rounded-lg p-3 cursor-pointer hover:bg-muted/30 transition-colors ${SEVERITY_RING.HIGH}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {e.patientId?.name}
                      <span className="ml-2 text-xs text-muted-foreground font-normal">
                        {e.patientId?.patientCode}
                        {e.patientId?.cancerType && ` · ${e.patientId.cancerType}`}
                      </span>
                    </p>
                    <p className="text-xs text-red-600 mt-0.5">
                      {TRIGGER_LABEL[e.trigger] ?? e.trigger}
                      {e.missedCount > 0 && ` — ${e.missedCount} missed`}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {timeAgo(e.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Monitoring (OPEN caregiver escalations) */}
      {monitoring.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              Monitoring
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                ({monitoring.length} caregiver-level)
              </span>
            </h2>
            <button
              onClick={() => navigate('/nav/follow-up-alerts')}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              View all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {monitoring.slice(0, 2).map((e) => (
              <div
                key={e._id}
                onClick={() => navigate('/nav/follow-up-alerts')}
                className="bg-card border border-border rounded-lg p-3 cursor-pointer hover:bg-muted/30 transition-colors border-l-4 border-l-amber-400"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {e.patientId?.name}
                      <span className="ml-2 text-xs text-muted-foreground font-normal">{e.patientId?.patientCode}</span>
                    </p>
                    <p className="text-xs text-amber-600 mt-0.5">
                      {TRIGGER_LABEL[e.trigger] ?? e.trigger}
                      {e.missedCount > 0 && ` — ${e.missedCount} missed`}
                      <span className="text-muted-foreground ml-1">· awaiting caregiver</span>
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {timeAgo(e.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* High priority alerts */}
      {(dash?.highPriorityPatients?.length ?? 0) > 0 && (
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">High Priority Alerts</h2>
            <button
              onClick={() => navigate('/nav/follow-up-alerts')}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              View all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {dash!.highPriorityPatients.slice(0, 3).map((p) => (
              <div
                key={p._id}
                onClick={() => navigate('/nav/follow-up-alerts')}
                className={`bg-card border rounded-lg p-3 cursor-pointer hover:bg-muted/30 transition-colors ${SEVERITY_RING[p.severity] ?? ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0">
                    {p.name?.charAt(0)?.toUpperCase() ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {p.cancerType}
                      {p.reason && ` · ${p.reason}`}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                    p.severity === 'HIGH' ? 'bg-red-100 text-red-700'
                    : p.severity === 'MED' ? 'bg-amber-100 text-amber-700'
                    : 'bg-green-100 text-green-700'
                  }`}>
                    {p.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Pending review queue */}
      {pendingBatches.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              Pending Reviews
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                ({pendingBatches.length} batches need attention)
              </span>
            </h2>
            <button
              onClick={() => navigate('/nav/review-queue')}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              Open queue <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {pendingBatches.slice(0, 2).map((b) => (
              <div
                key={b._id}
                onClick={() => navigate(`/nav/review-queue/${b._id}`)}
                className="bg-card border border-border rounded-lg p-3 cursor-pointer hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {b.documentId?.fileName ?? 'Document'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {b.patientId?.name}
                      {b.patientId?.cancerType && ` · ${b.patientId.cancerType}`}
                      {' · '}
                      {b.verifiedCount}/{b.taskCount} verified
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                    b.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {b.status === 'PENDING' ? 'Pending' : 'In Review'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* All clear state */}
      {needsAction.length === 0 && monitoring.length === 0 && pendingBatches.length === 0 && (
        <div className="text-center py-12">
          <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">All clear</p>
          <p className="text-xs text-muted-foreground mt-1">No escalations or pending reviews right now.</p>
        </div>
      )}
    </div>
  );
}
