import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  ChevronUp,
  Clock,
  User,
  XCircle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface Patient {
  _id: string;
  name: string;
  patientCode: string;
  cancerType?: string;
}

interface Escalation {
  _id: string;
  trigger: string;
  level: string;
  status: string;
  missedCount: number;
  createdAt: string;
  resolvedAt?: string;
  resolutionNote?: string;
  navigatorNotifiedAt?: string;
  patientId: Patient;
}

const TRIGGER_LABEL: Record<string, string> = {
  MISSED_REMINDERS: 'Missed Reminders',
  MISSED_APPOINTMENT: 'Missed Appointment',
  HIGH_ALERT: 'High Alert',
  MANUAL: 'Manual',
};

const TRIGGER_COLOR: Record<string, string> = {
  MISSED_REMINDERS: 'bg-orange-100 text-orange-700',
  MISSED_APPOINTMENT: 'bg-red-100 text-red-700',
  HIGH_ALERT: 'bg-red-100 text-red-700',
  MANUAL: 'bg-blue-100 text-blue-700',
};

function timeAgo(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(ms / (1000 * 60 * 60));
  if (hours < 1) return 'Less than 1h ago';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function EscalationCard({
  escalation,
  onResolve,
  onEscalate,
}: {
  escalation: Escalation;
  onResolve: (id: string, note: string) => void;
  onEscalate: (id: string) => void;
}) {
  const [resolving, setResolving] = useState(false);
  const [note, setNote] = useState('');
  const isResolved = escalation.status === 'RESOLVED';
  const needsAction = escalation.status === 'ESCALATED_TO_NAVIGATOR';

  return (
    <div
      className={`bg-card border rounded-lg p-4 space-y-3 ${
        needsAction ? 'border-red-300' : 'border-border'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <AlertTriangle
            className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
              needsAction ? 'text-red-500' : 'text-yellow-500'
            }`}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-foreground">
                {escalation.patientId?.name ?? 'Unknown Patient'}
              </span>
              <span className="text-xs text-muted-foreground">
                {escalation.patientId?.patientCode}
              </span>
              {escalation.patientId?.cancerType && (
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  · {escalation.patientId.cancerType}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  TRIGGER_COLOR[escalation.trigger] ?? 'bg-gray-100 text-gray-600'
                }`}
              >
                {TRIGGER_LABEL[escalation.trigger] ?? escalation.trigger}
              </span>

              {escalation.trigger === 'MISSED_REMINDERS' && escalation.missedCount > 0 && (
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
              <User className="w-3 h-3" />
              Caregiver
            </span>
          )}
          {(escalation.level === 'NAVIGATOR' || needsAction) && !isResolved && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium flex items-center gap-1">
              <ChevronUp className="w-3 h-3" />
              Navigator
            </span>
          )}
          {isResolved && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Resolved
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
        <div className="border-t border-border pt-3 space-y-2">
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
                <button
                  onClick={() => onResolve(escalation._id, note)}
                  className="text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity"
                >
                  Confirm Resolve
                </button>
                <button
                  onClick={() => setResolving(false)}
                  className="text-xs px-3 py-1.5 border border-border rounded text-muted-foreground hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setResolving(true)}
                className="text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity"
              >
                Resolve
              </button>
              {escalation.level === 'CAREGIVER' && (
                <button
                  onClick={() => onEscalate(escalation._id)}
                  className="text-xs px-3 py-1.5 border border-border rounded text-muted-foreground hover:bg-muted transition-colors"
                >
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

export function NavEscalationsPage() {
  const { user } = useAuth();
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!user?._id) return;
    fetchEscalations();
  }, [user?._id, showAll]);

  const fetchEscalations = async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      const endpoint = showAll
        ? `/escalations/navigator/${user._id}/all`
        : `/escalations/navigator/${user._id}`;
      const r = await api.get(endpoint);
      setEscalations(r.data);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id: string, note: string) => {
    await api.post(`/escalations/${id}/resolve`, {
      resolvedById: user?._id,
      note: note || undefined,
    });
    await fetchEscalations();
  };

  const handleEscalate = async (id: string) => {
    await api.post(`/escalations/${id}/escalate`);
    await fetchEscalations();
  };

  const needsAction = escalations.filter((e) => e.status === 'ESCALATED_TO_NAVIGATOR');
  const monitoring = escalations.filter((e) => e.status === 'OPEN');
  const resolved = escalations.filter((e) => e.status === 'RESOLVED');

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <p className="text-muted-foreground text-sm">Loading escalations…</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Escalations</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Patients requiring follow-up based on missed care plan items
          </p>
        </div>
        <button
          onClick={() => setShowAll((v) => !v)}
          className="text-xs text-muted-foreground border border-border rounded px-3 py-1.5 hover:bg-muted transition-colors"
        >
          {showAll ? 'Open only' : 'Show all'}
        </button>
      </div>

      {escalations.length === 0 ? (
        <div className="text-center py-16">
          <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">No active escalations</p>
          <p className="text-xs text-muted-foreground mt-1">
            Escalations appear when patients miss 3+ reminders in 48 hours.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
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
                  key={e._id}
                  escalation={e}
                  onResolve={handleResolve}
                  onEscalate={handleEscalate}
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
                <span className="text-xs text-muted-foreground">
                  (awaiting caregiver — auto-escalates in 6h)
                </span>
              </div>
              {monitoring.map((e) => (
                <EscalationCard
                  key={e._id}
                  escalation={e}
                  onResolve={handleResolve}
                  onEscalate={handleEscalate}
                />
              ))}
            </section>
          )}

          {showAll && resolved.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground">Resolved</h2>
              {resolved.map((e) => (
                <EscalationCard
                  key={e._id}
                  escalation={e}
                  onResolve={handleResolve}
                  onEscalate={handleEscalate}
                />
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
