import { useEffect, useState } from 'react';
import { X, CheckCircle, Circle, Phone, Building2, Stethoscope, HeartHandshake } from 'lucide-react';
import { api } from '@/lib/api';

interface PlaybookData {
  patient: {
    _id: string;
    name: string;
    cancerType: string;
    cancerStage: string;
    patientCode: string;
    phone?: string;
    emergencyContactPhone?: string;
    caregiverName?: string;
    caregiverPhone?: string;
    caregiverRelationship?: string;
    hospitalName?: string;
    hospitalId?: { name?: string; city?: string } | null;
    doctorName?: string;
  };
  alert: {
    type: string;
    severity: string;
    reason: string;
  } | null;
  playbook: {
    title: string;
    steps: string[];
    autoCompletedCount: number;
  } | null;
  otherActive: Array<{
    patientId: string;
    patientName: string;
    severity: string;
    type: string;
    title: string;
  }>;
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

  const hospitalLabel = data?.patient.hospitalId?.name || data?.patient.hospitalName;

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
                  {data.patient.cancerType}
                  {data.patient.cancerStage && ` · ${data.patient.cancerStage}`}
                </p>
                <p className="text-xs text-muted-foreground">{data.patient.patientCode}</p>
              </div>
            </div>

            {/* Contact & care team */}
            <div className="rounded-lg border border-border divide-y divide-border">
              {data.patient.phone && (
                <div className="flex items-center gap-2.5 p-2.5">
                  <Phone className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  <p className="text-xs text-foreground">{data.patient.phone}</p>
                </div>
              )}
              {hospitalLabel && (
                <div className="flex items-center gap-2.5 p-2.5">
                  <Building2 className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  <p className="text-xs text-foreground">{hospitalLabel}</p>
                </div>
              )}
              {data.patient.doctorName && (
                <div className="flex items-center gap-2.5 p-2.5">
                  <Stethoscope className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  <p className="text-xs text-foreground">Dr. {data.patient.doctorName}</p>
                </div>
              )}
              {data.patient.caregiverName && (
                <div className="flex items-center gap-2.5 p-2.5">
                  <HeartHandshake className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  <p className="text-xs text-foreground">
                    {data.patient.caregiverName}
                    {data.patient.caregiverRelationship && ` (${data.patient.caregiverRelationship})`}
                    {data.patient.caregiverPhone && ` · ${data.patient.caregiverPhone}`}
                  </p>
                </div>
              )}
              {data.patient.emergencyContactPhone && (
                <div className="flex items-center gap-2.5 p-2.5">
                  <Phone className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                  <p className="text-xs text-foreground">
                    Emergency contact · {data.patient.emergencyContactPhone}
                  </p>
                </div>
              )}
              {!data.patient.phone && !hospitalLabel && !data.patient.doctorName &&
                !data.patient.caregiverName && !data.patient.emergencyContactPhone && (
                <p className="text-xs text-muted-foreground p-2.5">No contact details on file yet.</p>
              )}
            </div>

            {/* Latest alert */}
            {data.alert && (
              <div className="rounded-lg border border-border p-3 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold text-foreground">Latest Alert</p>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${SEVERITY_COLOR[data.alert.severity] ?? ''}`}>
                    {data.alert.severity}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{data.alert.reason}</p>
              </div>
            )}

            {/* Triggered playbook */}
            {data.playbook && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-foreground">{data.playbook.title}</p>
                <div className="space-y-1.5">
                  {data.playbook.steps.map((step, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      {i < data.playbook!.autoCompletedCount ? (
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      )}
                      <p className="text-xs text-foreground">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Other patients also needing attention */}
            {data.otherActive && data.otherActive.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1.5">Other Patients Needing Attention</p>
                <div className="space-y-1">
                  {data.otherActive.map((o, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 bg-muted rounded px-2 py-1.5">
                      <p className="text-xs text-foreground truncate">{o.patientName} · {o.title}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${SEVERITY_COLOR[o.severity] ?? ''}`}>
                        {o.severity}
                      </span>
                    </div>
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
