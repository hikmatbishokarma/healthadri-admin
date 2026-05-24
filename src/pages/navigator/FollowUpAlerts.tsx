import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, CheckCircle, ChevronUp, Clock,
  User, XCircle, Bell, ShieldAlert,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

// ── Types ─────────────────────────────────────────────────────────────────────

interface PatientRef {
  _id: string; name: string; patientCode: string; cancerType?: string;
}

interface Escalation {
  _id: string; trigger: string; level: string; status: string;
  missedCount: number; createdAt: string; resolvedAt?: string; resolutionNote?: string;
  navigatorNotifiedAt?: string; patientId: PatientRef;
}

interface Alert {
  _id: string; type: string; severity: string; reason: string;
  status: string; createdAt: string;
  patientId: PatientRef | string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TRIGGER_LABEL: Record<string, string> = {
  MISSED_REMINDERS: 'Missed Reminders',
  MISSED_APPOINTMENT: 'Missed Appointment',
  HIGH_ALERT: 'Critical Alert',
  MANUAL: 'Manual',
};

const TRIGGER_COLOR: Record<string, string> = {
  MISSED_REMINDERS: 'bg-orange-100 text-orange-700',
  MISSED_APPOINTMENT: 'bg-red-100 text-red-700',
  HIGH_ALERT: 'bg-red-100 text-red-700',
  MANUAL: 'bg-blue-100 text-blue-700',
};

const SEVERITY_COLOR: Record<string, string> = {
  HIGH: 'bg-red-100 text-red-700',
  MED: 'bg-amber-100 text-amber-700',
  LOW: 'bg-green-100 text-green-700',
};

function timeAgo(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(ms / 3600000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// ── Escalation card ───────────────────────────────────────────────────────────

function EscalationCard({
  escalation, navigatorId, onResolve, onEscalate,
}: {
  escalation: Escalation;
  navigatorId: string;
  onResolve: (id: string, note: string) => Promise<void>;
  onEscalate: (id: string) => Promise<void>;
}) {
  const [resolving, setResolving] = useState(false);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const isResolved = escalation.status === 'RESOLVED';
  const needsAction = escalation.status === 'ESCALATED_TO_NAVIGATOR';

  const handleResolve = async () => {
    setLoading(true);
    try { await onResolve(escalation._id, note); } finally { setLoading(false); }
  };
  const handleEscalate = async () => {
    setLoading(true);
    try { await onEscalate(escalation._id); } finally { setLoading(false); }
  };

  return (
    <div className={`bg-card border rounded-lg p-4 space-y-3 ${needsAction ? 'border-red-300' : 'border-border'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${needsAction ? 'text-red-500' : 'text-amber-500'}`} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-foreground">
                {escalation.patientId?.name ?? 'Unknown'}
              </span>
              <span className="text-xs text-muted-foreground">{escalation.patientId?.patientCode}</span>
              {escalation.patientId?.cancerType && (
                <span className="text-xs text-muted-foreground hidden sm:inline">· {escalation.patientId.cancerType}</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TRIGGER_COLOR[escalation.trigger] ?? 'bg-gray-100 text-gray-600'}`}>
                {TRIGGER_LABEL[escalation.trigger] ?? escalation.trigger}
              </span>
              {escalation.missedCount > 0 && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <XCircle className="w-3 h-3 text-red-400" />
                  {escalation.missedCount} missed
                </span>
              )}
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {timeAgo(escalation.createdAt)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 flex items-center gap-2">
          {escalation.level === 'CAREGIVER' && !isResolved && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium flex items-center gap-1">
              <User className="w-3 h-3" />Caregiver
            </span>
          )}
          {(escalation.level === 'NAVIGATOR' || needsAction) && !isResolved && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium flex items-center gap-1">
              <ChevronUp className="w-3 h-3" />Navigator
            </span>
          )}
          {isResolved && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />Resolved
            </span>
          )}
        </div>
      </div>

      {isResolved && escalation.resolutionNote && (
        <p className="text-xs text-muted-foreground italic border-t border-border pt-2">
          "{escalation.resolutionNote}"
        </p>
      )}

      {!isResolved && (
        <div className="border-t border-border pt-3">
          {resolving ? (
            <div className="space-y-2">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Resolution note (optional)…"
                className="w-full text-xs border border-border rounded px-2 py-1.5 bg-background text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                rows={2}
              />
              <div className="flex gap-2">
                <button disabled={loading} onClick={handleResolve}
                  className="text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity disabled:opacity-50">
                  Confirm Resolve
                </button>
                <button onClick={() => setResolving(false)}
                  className="text-xs px-3 py-1.5 border border-border rounded text-muted-foreground hover:bg-muted transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={() => setResolving(true)}
                className="text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity">
                Resolve
              </button>
              {escalation.level === 'CAREGIVER' && (
                <button disabled={loading} onClick={handleEscalate}
                  className="text-xs px-3 py-1.5 border border-border rounded text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50">
                  Escalate to Navigator
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Alert card ────────────────────────────────────────────────────────────────

function AlertCard({ alert, onResolve }: {
  alert: Alert;
  onResolve: (id: string) => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const patient = typeof alert.patientId === 'object' ? alert.patientId : null;
  const isPending = alert.status === 'pending';

  const handleResolve = async () => {
    setLoading(true);
    try { await onResolve(alert._id); } finally { setLoading(false); }
  };

  return (
    <div className={`bg-card border rounded-lg p-4 space-y-2 ${alert.severity === 'HIGH' ? 'border-red-300' : 'border-border'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <Bell className={`w-4 h-4 mt-0.5 flex-shrink-0 ${alert.severity === 'HIGH' ? 'text-red-500' : alert.severity === 'MED' ? 'text-amber-500' : 'text-green-500'}`} />
          <div className="min-w-0 flex-1">
            {patient && (
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-sm font-medium text-foreground cursor-pointer hover:text-primary"
                  onClick={() => navigate(`/nav/patients`)}
                >
                  {patient.name}
                </span>
                <span className="text-xs text-muted-foreground">{patient.patientCode}</span>
                {patient.cancerType && (
                  <span className="text-xs text-muted-foreground hidden sm:inline">· {patient.cancerType}</span>
                )}
              </div>
            )}
            <p className="text-sm text-foreground">{alert.reason}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SEVERITY_COLOR[alert.severity] ?? 'bg-gray-100 text-gray-600'}`}>
                {alert.severity}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {timeAgo(alert.createdAt)}
              </span>
            </div>
          </div>
        </div>
        {!isPending && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium flex-shrink-0">
            Resolved
          </span>
        )}
      </div>
      {isPending && (
        <div className="border-t border-border pt-2">
          <button disabled={loading} onClick={handleResolve}
            className="text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity disabled:opacity-50">
            Mark Resolved
          </button>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type Tab = 'escalations' | 'alerts';

export function NavFollowUpAlertsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('escalations');
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!user?._id) return;
    fetchAll();
  }, [user?._id, showAll]);

  const fetchAll = async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      const [eRes, dRes] = await Promise.all([
        api.get(showAll ? `/escalations/navigator/${user._id}/all` : `/escalations/navigator/${user._id}`),
        api.get(`/navigator/dashboard/${user._id}`),
      ]);
      setEscalations(eRes.data ?? []);
      // Extract alerts from dashboard patients list — each patient carries their top alert
      const dashPatients: Array<{ _id: string; name: string; cancerType?: string; patientCode?: string; alertType?: string; topSymptom?: string; priority?: string; lastUpdatedAt?: string }> = dRes.data?.patients ?? [];
      const syntheticAlerts: Alert[] = dashPatients
        .filter((p) => p.alertType)
        .map((p) => ({
          _id: p._id,
          type: p.alertType!,
          severity: p.priority === 'HIGH' ? 'HIGH' : p.priority === 'MED' ? 'MED' : 'LOW',
          reason: p.topSymptom ?? p.alertType!,
          status: 'pending',
          createdAt: p.lastUpdatedAt ?? new Date().toISOString(),
          patientId: {
            _id: p._id,
            name: p.name,
            patientCode: p.patientCode ?? '',
            cancerType: p.cancerType,
          },
        }));
      setAlerts(syntheticAlerts);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveEscalation = async (id: string, note: string) => {
    await api.post(`/escalations/${id}/resolve`, { resolvedById: user?._id, note: note || undefined });
    await fetchAll();
  };

  const handleEscalateToNavigator = async (id: string) => {
    await api.post(`/escalations/${id}/escalate`);
    await fetchAll();
  };

  const handleResolveAlert = async (_id: string) => {
    // Mark the specific alert resolved (using the alerts API if available)
    // For now update locally since there's no dedicated endpoint per alert in nav context
    setAlerts((prev) => prev.map((a) => a._id === _id ? { ...a, status: 'resolved' } : a));
  };

  const needsAction = escalations.filter((e) => e.status === 'ESCALATED_TO_NAVIGATOR');
  const monitoring = escalations.filter((e) => e.status === 'OPEN');
  const resolved = escalations.filter((e) => e.status === 'RESOLVED');
  const highAlerts = alerts.filter((a) => a.severity === 'HIGH');
  const otherAlerts = alerts.filter((a) => a.severity !== 'HIGH');

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Follow-up Alerts</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Escalations and active alerts requiring your attention
          </p>
        </div>
        <button
          onClick={() => setShowAll((v) => !v)}
          className="text-xs text-muted-foreground border border-border rounded px-3 py-1.5 hover:bg-muted transition-colors"
        >
          {showAll ? 'Open only' : 'Show all'}
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-border">
        {([
          { key: 'escalations', label: 'Escalations', icon: ShieldAlert, count: needsAction.length + monitoring.length },
          { key: 'alerts',      label: 'Alerts',       icon: Bell,        count: highAlerts.length },
        ] as { key: Tab; label: string; icon: React.ElementType; count: number }[]).map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === key
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
            {count > 0 && (
              <span className={`text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium ${
                tab === key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                {count > 9 ? '9+' : count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Escalations tab */}
      {tab === 'escalations' && (
        <div className="space-y-6">
          {escalations.length === 0 && (
            <div className="text-center py-16">
              <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground">No active escalations</p>
            </div>
          )}

          {needsAction.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-foreground">Needs Action</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
                  {needsAction.length}
                </span>
              </div>
              {needsAction.map((e) => (
                <EscalationCard
                  key={e._id} escalation={e} navigatorId={user?._id ?? ''}
                  onResolve={handleResolveEscalation} onEscalate={handleEscalateToNavigator}
                />
              ))}
            </section>
          )}

          {monitoring.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-foreground">Monitoring</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">
                  {monitoring.length}
                </span>
                <span className="text-xs text-muted-foreground">(awaiting caregiver — auto-escalates in 6h)</span>
              </div>
              {monitoring.map((e) => (
                <EscalationCard
                  key={e._id} escalation={e} navigatorId={user?._id ?? ''}
                  onResolve={handleResolveEscalation} onEscalate={handleEscalateToNavigator}
                />
              ))}
            </section>
          )}

          {showAll && resolved.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground">Resolved</h2>
              {resolved.map((e) => (
                <EscalationCard
                  key={e._id} escalation={e} navigatorId={user?._id ?? ''}
                  onResolve={handleResolveEscalation} onEscalate={handleEscalateToNavigator}
                />
              ))}
            </section>
          )}
        </div>
      )}

      {/* Alerts tab */}
      {tab === 'alerts' && (
        <div className="space-y-6">
          {alerts.length === 0 && (
            <div className="text-center py-16">
              <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground">No active alerts</p>
            </div>
          )}

          {highAlerts.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-foreground">Critical</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">{highAlerts.length}</span>
              </div>
              {highAlerts.map((a) => (
                <AlertCard key={a._id} alert={a} onResolve={handleResolveAlert} />
              ))}
            </section>
          )}

          {otherAlerts.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-foreground">Other Alerts</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">{otherAlerts.length}</span>
              </div>
              {otherAlerts.map((a) => (
                <AlertCard key={a._id} alert={a} onResolve={handleResolveAlert} />
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
