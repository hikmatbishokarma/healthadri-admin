import { useEffect, useState } from 'react';
import { CheckCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { PlaybookDrawer } from './PlaybookDrawer';

interface AlertItem {
  _id: string;
  type: string;
  severity: 'HIGH' | 'MED' | 'LOW';
  reason: string;
  status: string;
  createdAt: string;
  patientId: {
    _id: string;
    name: string;
    cancerType: string;
    cancerStage: string;
    patientCode: string;
  };
}

const SEVERITY_COLOR: Record<string, string> = {
  HIGH: 'bg-red-100 text-red-700 border-red-200',
  MED: 'bg-amber-100 text-amber-700 border-amber-200',
  LOW: 'bg-green-100 text-green-700 border-green-200',
};

export function NavAlertsPage() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?._id) return;
    fetchAlerts();
  }, [user?._id]);

  const fetchAlerts = async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      const r = await api.get(`/alerts/navigator/${user._id}`);
      setAlerts(r.data);
    } finally {
      setLoading(false);
    }
  };

  const resolve = async (alertId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await api.patch(`/alerts/${alertId}/resolve`);
    setAlerts((prev) => prev.filter((a) => a._id !== alertId));
  };

  const highCount = alerts.filter((a) => a.severity === 'HIGH').length;

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <p className="text-muted-foreground text-sm">Loading alerts…</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Alerts</h1>
          {highCount > 0 && (
            <p className="text-sm text-red-600 mt-0.5">{highCount} high priority</p>
          )}
        </div>
        <span className="text-sm text-muted-foreground">{alerts.length} pending</span>
      </div>

      {alerts.length === 0 && (
        <div className="text-center py-12">
          <CheckCheck className="w-10 h-10 text-green-500 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">All clear — no pending alerts</p>
        </div>
      )}

      <div className="space-y-2">
        {alerts.map((alert) => (
          <div
            key={alert._id}
            className="bg-card border border-border rounded-lg p-4 flex items-start gap-4 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => setSelectedPatientId(alert.patientId._id)}
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0">
              {alert.patientId.name?.charAt(0)?.toUpperCase() ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium text-foreground">{alert.patientId.name}</p>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded border ${SEVERITY_COLOR[alert.severity]}`}
                >
                  {alert.severity}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {alert.patientId.cancerType} · Stage {alert.patientId.cancerStage}
              </p>
              <p className="text-xs text-foreground mt-1">{alert.reason}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {new Date(alert.createdAt).toLocaleString()}
              </p>
            </div>
            <button
              onClick={(e) => resolve(alert._id, e)}
              className="flex-shrink-0 text-xs text-muted-foreground hover:text-foreground border border-border rounded px-2 py-1 transition-colors"
            >
              Resolve
            </button>
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
