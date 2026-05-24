import { useEffect, useState } from 'react';
import { X, CheckCircle, Circle } from 'lucide-react';
import { api } from '@/lib/api';

interface PlaybookStep {
  step: number;
  action: string;
  completed?: boolean;
}

interface PlaybookData {
  patient: {
    _id: string;
    name: string;
    cancerType: string;
    cancerStage: string;
    patientCode: string;
  };
  latestAlert: {
    type: string;
    severity: string;
    reason: string;
  } | null;
  triggeredPlaybook: {
    title: string;
    steps: PlaybookStep[];
  } | null;
  otherPlaybooks: Array<{ title: string }>;
}

interface Props {
  patientId: string;
  onClose: () => void;
}

const SEVERITY_COLOR: Record<string, string> = {
  HIGH: 'bg-red-100 text-red-700',
  MED: 'bg-amber-100 text-amber-700',
  LOW: 'bg-green-100 text-green-700',
};

export function PlaybookDrawer({ patientId, onClose }: Props) {
  const [data, setData] = useState<PlaybookData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/navigator/playbook-run/${patientId}`)
      .then((r) => setData(r.data))
      .finally(() => setLoading(false));
  }, [patientId]);

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-md bg-background border-l border-border h-full overflow-y-auto flex flex-col">
        <div className="h-14 px-4 flex items-center justify-between border-b border-border flex-shrink-0">
          <h2 className="text-sm font-semibold text-foreground">Patient Detail</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Loading…</p>
          </div>
        ) : !data ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">No data found.</p>
          </div>
        ) : (
          <div className="p-4 space-y-5">
            {/* Patient header */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                {data.patient.name?.charAt(0)?.toUpperCase() ?? '?'}
              </div>
              <div>
                <p className="font-semibold text-foreground">{data.patient.name}</p>
                <p className="text-xs text-muted-foreground">
                  {data.patient.cancerType} · Stage {data.patient.cancerStage}
                </p>
                <p className="text-xs text-muted-foreground">{data.patient.patientCode}</p>
              </div>
            </div>

            {/* Latest alert */}
            {data.latestAlert && (
              <div className="rounded-lg border border-border p-3 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold text-foreground">Latest Alert</p>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${SEVERITY_COLOR[data.latestAlert.severity] ?? ''}`}>
                    {data.latestAlert.severity}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{data.latestAlert.reason}</p>
              </div>
            )}

            {/* Triggered playbook */}
            {data.triggeredPlaybook && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-foreground">{data.triggeredPlaybook.title}</p>
                <div className="space-y-1.5">
                  {data.triggeredPlaybook.steps.map((step, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      {step.completed ? (
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      )}
                      <p className="text-xs text-foreground">{step.action}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Other active playbooks */}
            {data.otherPlaybooks && data.otherPlaybooks.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1.5">Other Active Playbooks</p>
                <div className="space-y-1">
                  {data.otherPlaybooks.map((pb, i) => (
                    <p key={i} className="text-xs text-foreground bg-muted rounded px-2 py-1">{pb.title}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
