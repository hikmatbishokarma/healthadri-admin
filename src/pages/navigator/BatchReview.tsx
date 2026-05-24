import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle, XCircle, Pencil,
  Pill, FlaskConical, CalendarDays, Stethoscope,
  ChevronDown, ChevronUp, AlertTriangle, ClipboardCheck,
  FileText, Plus, Minus, RefreshCw, Info,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ExtractedData {
  medicineName?: string; dosage?: string; frequency?: string; timing?: string;
  duration?: string; testName?: string; labName?: string; scheduledDate?: string;
  scheduledDates?: string; doctorName?: string; specialty?: string; location?: string;
  procedureName?: string; notes?: string; [key: string]: unknown;
}

interface AiExtractedTask {
  _id: string;
  taskType: 'MEDICATION' | 'LAB_TEST' | 'APPOINTMENT' | 'PROCEDURE';
  confidence: number;
  sourceText: string;
  reviewStatus: string;
  extractedData: ExtractedData;
  navigatorEdits?: ExtractedData;
}

interface ReviewBatch {
  _id: string; status: string; taskCount: number;
  verifiedCount: number; rejectedCount: number;
  patientId: { _id: string; name: string; patientCode: string; cancerType?: string };
  documentId: { _id: string; fileName: string; category: string };
}

interface ActiveTask {
  _id: string; type: string; title: string; severity: string;
  startDate?: string; endDate?: string; instructions?: string;
  taskData?: Record<string, unknown>;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TASK_ICONS: Record<string, React.ElementType> = {
  MEDICATION: Pill, LAB_TEST: FlaskConical, APPOINTMENT: CalendarDays, PROCEDURE: Stethoscope,
};

const STATUS_STYLE: Record<string, string> = {
  AI_GENERATED: 'border-border bg-card',
  UNDER_REVIEW: 'border-blue-300 bg-blue-50',
  VERIFIED: 'border-green-300 bg-green-50',
  EDITED: 'border-green-300 bg-green-50',
  REJECTED: 'border-red-200 bg-red-50 opacity-60',
};

const TYPE_LABEL: Record<string, string> = {
  MEDICATION: 'Medication', LAB_TEST: 'Lab Test',
  APPOINTMENT: 'Appointment', PROCEDURE: 'Procedure',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function ConfidenceBadge({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 80 ? 'text-green-700 bg-green-100' : pct >= 60 ? 'text-amber-700 bg-amber-100' : 'text-red-700 bg-red-100';
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${color}`}>
      {pct}%
    </span>
  );
}

function DataField({ label, value }: { label: string; value: unknown }) {
  if (value == null || value === '') return null;
  return (
    <div>
      <dt className="text-xs text-muted-foreground capitalize">{label.replace(/_/g, ' ')}</dt>
      <dd className="text-xs text-foreground font-medium leading-snug">{String(value)}</dd>
    </div>
  );
}

// ── Change detection ──────────────────────────────────────────────────────────

type ChangeKind = 'ADDED' | 'MODIFIED' | 'REMOVED';

interface DetectedChange {
  kind: ChangeKind;
  taskType: string;
  label: string;
  detail?: string;
  oldValue?: string;
  newValue?: string;
}

function detectChanges(extracted: AiExtractedTask[], existing: ActiveTask[]): DetectedChange[] {
  const changes: DetectedChange[] = [];

  for (const ai of extracted) {
    if (ai.reviewStatus === 'REJECTED') continue;
    const data = ai.navigatorEdits ? { ...ai.extractedData, ...ai.navigatorEdits } : ai.extractedData;

    // Try to find a matching existing task by type + key name
    const keyName =
      ai.taskType === 'MEDICATION' ? (data.medicineName as string ?? '')
      : ai.taskType === 'LAB_TEST' ? (data.testName as string ?? '')
      : ai.taskType === 'APPOINTMENT' ? ((data.specialty ?? data.doctorName) as string ?? '')
      : (data.procedureName as string ?? '');

    const match = existing.find((t) => {
      const td = t.taskData ?? {};
      const tName =
        t.type === 'MEDICATION' ? String(td.medicineName ?? t.title ?? '')
        : t.type === 'LAB_TEST' ? String(td.testName ?? t.title ?? '')
        : t.type === 'APPOINTMENT' ? String(td.specialty ?? td.doctorName ?? t.title ?? '')
        : t.title ?? '';
      return (
        t.type === ai.taskType &&
        keyName &&
        tName.toLowerCase().includes(keyName.toLowerCase().split(' ')[0].toLowerCase())
      );
    });

    if (!match) {
      changes.push({
        kind: 'ADDED',
        taskType: ai.taskType,
        label: keyName || TYPE_LABEL[ai.taskType],
        detail: data.dosage ? String(data.dosage) : data.notes ? String(data.notes) : undefined,
      });
    } else {
      // Check for dosage / frequency changes
      const td = match.taskData ?? {};
      const oldDosage = String(td.dosage ?? '');
      const newDosage = String(data.dosage ?? '');
      if (oldDosage && newDosage && oldDosage !== newDosage) {
        changes.push({
          kind: 'MODIFIED',
          taskType: ai.taskType,
          label: keyName || match.title,
          detail: 'Dosage change',
          oldValue: oldDosage,
          newValue: newDosage,
        });
      }
      const oldFreq = String(td.frequency ?? '');
      const newFreq = String(data.frequency ?? '');
      if (oldFreq && newFreq && oldFreq !== newFreq) {
        changes.push({
          kind: 'MODIFIED',
          taskType: ai.taskType,
          label: keyName || match.title,
          detail: 'Frequency change',
          oldValue: oldFreq,
          newValue: newFreq,
        });
      }
    }
  }

  // Detect removals: existing HIGH tasks that have no counterpart in extracted
  for (const t of existing.filter((x) => x.severity === 'HIGH')) {
    const td = t.taskData ?? {};
    const tName = String(
      td.medicineName ?? td.testName ?? td.specialty ?? td.doctorName ?? t.title ?? '',
    );
    const covered = extracted.some((ai) => {
      if (ai.reviewStatus === 'REJECTED') return true; // rejected = intentionally not carried
      const d = ai.navigatorEdits ? { ...ai.extractedData, ...ai.navigatorEdits } : ai.extractedData;
      const kn = String(d.medicineName ?? d.testName ?? d.specialty ?? d.doctorName ?? '');
      return ai.taskType === t.type && kn && tName.toLowerCase().includes(kn.toLowerCase().split(' ')[0]);
    });
    if (!covered) {
      changes.push({
        kind: 'REMOVED',
        taskType: t.type,
        label: tName,
        detail: 'Not mentioned in new document',
      });
    }
  }

  return changes;
}

// ── Task card ─────────────────────────────────────────────────────────────────

function TaskCard({
  task, navigatorId, onUpdate,
}: {
  task: AiExtractedTask;
  navigatorId: string;
  onUpdate: (updated: AiExtractedTask) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<ExtractedData>({ ...task.extractedData });
  const [sourceExpanded, setSourceExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  const Icon = TASK_ICONS[task.taskType] ?? Stethoscope;
  const isReviewed = ['VERIFIED', 'EDITED', 'REJECTED'].includes(task.reviewStatus);

  const verify = async () => {
    setLoading(true);
    try {
      const r = await api.patch(`/review-queue/task/${task._id}/verify`, { navigatorId });
      onUpdate(r.data);
    } finally { setLoading(false); }
  };

  const reject = async () => {
    setLoading(true);
    try {
      const r = await api.patch(`/review-queue/task/${task._id}/reject`, { navigatorId });
      onUpdate(r.data);
    } finally { setLoading(false); }
  };

  const saveEdit = async () => {
    setLoading(true);
    try {
      const r = await api.patch(`/review-queue/task/${task._id}/edit`, { navigatorId, edits: editData });
      onUpdate(r.data);
      setEditing(false);
    } finally { setLoading(false); }
  };

  const displayData = task.navigatorEdits
    ? { ...task.extractedData, ...task.navigatorEdits }
    : task.extractedData;

  return (
    <div className={`border rounded-lg p-3 transition-colors ${STATUS_STYLE[task.reviewStatus] ?? STATUS_STYLE.AI_GENERATED}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Icon className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap mb-1">
              <span className="text-xs font-semibold text-foreground capitalize">
                {TYPE_LABEL[task.taskType]}
              </span>
              <ConfidenceBadge value={task.confidence} />
              {task.reviewStatus !== 'AI_GENERATED' && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                  task.reviewStatus === 'VERIFIED' || task.reviewStatus === 'EDITED'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {task.reviewStatus === 'EDITED' ? 'Verified (edited)' : task.reviewStatus.charAt(0) + task.reviewStatus.slice(1).toLowerCase()}
                </span>
              )}
            </div>

            {!editing && (
              <dl className="grid grid-cols-1 gap-y-1">
                {Object.entries(displayData).map(([k, v]) => (
                  <DataField key={k} label={k} value={v} />
                ))}
              </dl>
            )}

            {editing && (
              <div className="space-y-1.5">
                {Object.entries(editData).map(([k, v]) => (
                  <div key={k}>
                    <label className="text-xs text-muted-foreground capitalize block mb-0.5">
                      {k.replace(/_/g, ' ')}
                    </label>
                    <input
                      value={v == null ? '' : String(v)}
                      onChange={(e) => setEditData((prev) => ({ ...prev, [k]: e.target.value }))}
                      className="w-full px-2 py-1 text-xs border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setSourceExpanded((v) => !v)}
              className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {sourceExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              Source
            </button>
            {sourceExpanded && (
              <p className="mt-1 text-xs text-muted-foreground italic border-l-2 border-muted pl-2">
                "{task.sourceText}"
              </p>
            )}

            {task.confidence < 0.6 && (
              <div className="mt-1.5 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-500" />
                <span className="text-xs text-amber-700">Low confidence — verify carefully</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {!isReviewed && (
          <div className="flex items-center gap-1 flex-shrink-0">
            {editing ? (
              <>
                <button disabled={loading} onClick={() => setEditing(false)}
                  className="text-xs border border-border rounded px-1.5 py-1 text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50">
                  ✕
                </button>
                <button disabled={loading} onClick={saveEdit}
                  className="text-xs bg-primary text-primary-foreground rounded px-1.5 py-1 hover:opacity-90 disabled:opacity-50">
                  Save
                </button>
              </>
            ) : (
              <>
                <button disabled={loading} onClick={() => setEditing(true)}
                  className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted"
                  title="Edit">
                  <Pencil className="w-3 h-3" />
                </button>
                <button disabled={loading} onClick={verify}
                  className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-green-600 hover:bg-green-50"
                  title="Verify">
                  <CheckCircle className="w-3.5 h-3.5" />
                </button>
                <button disabled={loading} onClick={reject}
                  className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-red-50"
                  title="Reject">
                  <XCircle className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        )}
        {isReviewed && task.reviewStatus !== 'REJECTED' && (
          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
        )}
        {task.reviewStatus === 'REJECTED' && (
          <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
        )}
      </div>
    </div>
  );
}

// ── Change pill ───────────────────────────────────────────────────────────────

function ChangePill({ change }: { change: DetectedChange }) {
  const Icon = TASK_ICONS[change.taskType] ?? Stethoscope;
  const config =
    change.kind === 'ADDED'    ? { bg: 'bg-green-50 border-green-200',  text: 'text-green-800',  dot: 'bg-green-500', icon: Plus }
    : change.kind === 'REMOVED'  ? { bg: 'bg-red-50 border-red-200',    text: 'text-red-800',    dot: 'bg-red-500',   icon: Minus }
    :                              { bg: 'bg-blue-50 border-blue-200',   text: 'text-blue-800',   dot: 'bg-blue-500',  icon: RefreshCw };

  const KindIcon = config.icon;

  return (
    <div className={`rounded-lg border p-3 ${config.bg}`}>
      <div className="flex items-start gap-2">
        <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
          <KindIcon className={`w-3.5 h-3.5 ${config.text}`} />
          <Icon className={`w-3.5 h-3.5 ${config.text} opacity-70`} />
        </div>
        <div className="min-w-0">
          <p className={`text-xs font-semibold ${config.text}`}>
            {change.kind === 'ADDED' ? 'New' : change.kind === 'REMOVED' ? 'Removed' : 'Modified'}
            {' '}
            <span className="font-normal">{change.label}</span>
          </p>
          {change.detail && !change.oldValue && (
            <p className={`text-xs ${config.text} opacity-80 mt-0.5`}>{change.detail}</p>
          )}
          {change.oldValue && (
            <div className="mt-0.5 space-y-0.5">
              <p className="text-xs text-red-700 line-through opacity-70">{change.oldValue}</p>
              <p className="text-xs text-green-700 font-medium">{change.newValue}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function NavBatchReviewPage() {
  const { batchId } = useParams<{ batchId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [batch, setBatch] = useState<ReviewBatch | null>(null);
  const [tasks, setTasks] = useState<AiExtractedTask[]>([]);
  const [existingTasks, setExistingTasks] = useState<ActiveTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const centerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!batchId) return;
    fetchBatch();
  }, [batchId]);

  const fetchBatch = async () => {
    setLoading(true);
    try {
      const r = await api.get(`/review-queue/batch/${batchId}`);
      const batchData: ReviewBatch = r.data.batch;
      setBatch(batchData);
      setTasks(r.data.tasks);

      if (batchData.status === 'PENDING') {
        await api.patch(`/review-queue/batch/${batchId}/in-review`).catch(() => {});
      }

      // Fetch existing active care plan for diff panel
      if (batchData.patientId?._id) {
        api.get(`/care-plan/patient/${batchData.patientId._id}/active`)
          .then((cp) => setExistingTasks(cp.data?.tasks ?? []))
          .catch(() => {});
      }
    } finally {
      setLoading(false);
    }
  };

  const updateTask = (updated: AiExtractedTask) => {
    setTasks((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground text-sm">Loading batch…</p>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="p-6">
        <p className="text-sm text-destructive">Batch not found.</p>
      </div>
    );
  }

  const reviewedCount = tasks.filter((t) => ['VERIFIED', 'EDITED', 'REJECTED'].includes(t.reviewStatus)).length;
  const verifiedTasks = tasks.filter((t) => ['VERIFIED', 'EDITED'].includes(t.reviewStatus));
  const allReviewed = reviewedCount === tasks.length && tasks.length > 0;
  const progress = tasks.length > 0 ? (reviewedCount / tasks.length) * 100 : 0;
  const changes = detectChanges(tasks, existingTasks);

  const categoryLabel: Record<string, string> = {
    lab: 'Lab Report', discharge: 'Discharge Summary', scan: 'Scan Report',
    prescription: 'Prescription', other: 'Document',
  };

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">

      {/* ── LEFT PANEL: Document info ──────────────────────────────────────── */}
      <div className="w-72 flex-shrink-0 bg-card border-r border-border flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-14 px-4 flex items-center gap-3 border-b border-border flex-shrink-0">
          <button
            onClick={() => navigate('/nav/review-queue')}
            className="w-7 h-7 rounded flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">Document Review</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Document card */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground truncate">
                  {batch.documentId?.fileName ?? 'Document'}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {categoryLabel[batch.documentId?.category] ?? 'Document'}
                </p>
              </div>
            </div>
          </div>

          {/* Patient info */}
          <div className="space-y-1.5 border rounded-lg p-3 bg-muted/30">
            <p className="text-xs font-medium text-foreground uppercase tracking-wide">Patient</p>
            <p className="text-sm font-semibold text-foreground">{batch.patientId?.name}</p>
            <p className="text-xs text-muted-foreground">{batch.patientId?.patientCode}</p>
            {batch.patientId?.cancerType && (
              <p className="text-xs text-muted-foreground">{batch.patientId.cancerType}</p>
            )}
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-foreground">Review Progress</p>
              <p className="text-xs text-muted-foreground">{reviewedCount}/{tasks.length}</p>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{verifiedTasks.length} verified</span>
              <span>{tasks.length - reviewedCount} remaining</span>
            </div>
          </div>

          {/* Source texts */}
          {tasks.filter((t) => t.sourceText).length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-foreground uppercase tracking-wide">Source Excerpts</p>
              <div className="space-y-2">
                {tasks.map((t) => t.sourceText ? (
                  <blockquote
                    key={t._id}
                    className={`text-xs italic border-l-2 pl-2 py-0.5 ${
                      ['VERIFIED', 'EDITED'].includes(t.reviewStatus) ? 'border-green-400 text-muted-foreground'
                      : t.reviewStatus === 'REJECTED' ? 'border-red-300 text-muted-foreground/50 line-through'
                      : 'border-muted text-muted-foreground'
                    }`}
                  >
                    {t.sourceText.length > 120 ? t.sourceText.slice(0, 120) + '…' : t.sourceText}
                  </blockquote>
                ) : null)}
              </div>
            </div>
          )}

          {/* Safety notice */}
          <div className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-md">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-800">
              AI output — verify against original document before publishing. Never auto-activated.
            </p>
          </div>
        </div>
      </div>

      {/* ── CENTER PANEL: Task cards ───────────────────────────────────────── */}
      <div ref={centerRef} className="flex-1 min-w-0 overflow-y-auto">
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              AI-Extracted Tasks
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                ({tasks.length} found)
              </span>
            </h2>
          </div>

          <div className="space-y-3">
            {tasks.map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                navigatorId={user?._id ?? ''}
                onUpdate={updateTask}
              />
            ))}
            {tasks.length === 0 && (
              <div className="text-center py-12">
                <Info className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No tasks extracted from this document.</p>
              </div>
            )}
          </div>

          {/* Publish area */}
          {allReviewed && verifiedTasks.length > 0 && batch?.status !== 'PUBLISHED' && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
              <p className="text-sm font-medium text-green-800">
                All tasks reviewed — {verifiedTasks.length} verified, {tasks.length - verifiedTasks.length} rejected
              </p>
              <button
                disabled={publishing}
                onClick={async () => {
                  if (!user?._id || !batchId) return;
                  setPublishing(true);
                  try {
                    await api.post(`/review-queue/batch/${batchId}/publish`, { navigatorId: user._id });
                    navigate(`/nav/care-plans/${batch.patientId?._id}`);
                  } catch (e: unknown) {
                    const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
                    alert(msg || 'Failed to create care plan draft');
                  } finally {
                    setPublishing(false);
                  }
                }}
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground text-sm font-medium py-2.5 rounded-md hover:opacity-90 disabled:opacity-50"
              >
                <ClipboardCheck className="w-4 h-4" />
                {publishing ? 'Creating draft…' : 'Create Care Plan Draft'}
              </button>
            </div>
          )}

          {batch?.status === 'PUBLISHED' && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
              <p className="text-sm font-medium text-blue-800">Draft care plan created</p>
              <button
                onClick={() => batch?.patientId?._id && navigate(`/nav/care-plans/${batch.patientId._id}`)}
                className="text-xs text-primary hover:underline"
              >
                View care plan →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL: Detected changes ─────────────────────────────────── */}
      <div className="w-72 flex-shrink-0 bg-card border-l border-border flex flex-col overflow-hidden">
        <div className="h-14 px-4 flex items-center border-b border-border flex-shrink-0">
          <div>
            <p className="text-sm font-semibold text-foreground">Changes Detected</p>
            <p className="text-xs text-muted-foreground">vs. current active plan</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {existingTasks.length === 0 && (
            <div className="text-center py-8 space-y-2">
              <Info className="w-7 h-7 text-muted-foreground mx-auto" />
              <p className="text-xs text-muted-foreground">No active care plan found — all tasks will be additions.</p>
            </div>
          )}

          {changes.length === 0 && existingTasks.length > 0 && (
            <div className="text-center py-8 space-y-2">
              <CheckCircle className="w-7 h-7 text-green-400 mx-auto" />
              <p className="text-xs text-muted-foreground">No changes detected compared to current plan.</p>
            </div>
          )}

          {changes.filter((c) => c.kind === 'ADDED').length > 0 && (
            <section className="space-y-2">
              <p className="text-xs font-semibold text-green-700 uppercase tracking-wide flex items-center gap-1">
                <Plus className="w-3 h-3" />
                Added ({changes.filter((c) => c.kind === 'ADDED').length})
              </p>
              {changes.filter((c) => c.kind === 'ADDED').map((c, i) => (
                <ChangePill key={i} change={c} />
              ))}
            </section>
          )}

          {changes.filter((c) => c.kind === 'MODIFIED').length > 0 && (
            <section className="space-y-2">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide flex items-center gap-1">
                <RefreshCw className="w-3 h-3" />
                Modified ({changes.filter((c) => c.kind === 'MODIFIED').length})
              </p>
              {changes.filter((c) => c.kind === 'MODIFIED').map((c, i) => (
                <ChangePill key={i} change={c} />
              ))}
            </section>
          )}

          {changes.filter((c) => c.kind === 'REMOVED').length > 0 && (
            <section className="space-y-2">
              <p className="text-xs font-semibold text-red-700 uppercase tracking-wide flex items-center gap-1">
                <Minus className="w-3 h-3" />
                Not in new doc ({changes.filter((c) => c.kind === 'REMOVED').length})
              </p>
              {changes.filter((c) => c.kind === 'REMOVED').map((c, i) => (
                <ChangePill key={i} change={c} />
              ))}
              <p className="text-xs text-muted-foreground">These HIGH-severity tasks were not mentioned in this document. Review before removing from care plan.</p>
            </section>
          )}

          {/* Current plan summary */}
          {existingTasks.length > 0 && (
            <div className="border-t border-border pt-4 space-y-2">
              <p className="text-xs font-medium text-foreground uppercase tracking-wide">Current Plan</p>
              <div className="space-y-1.5">
                {existingTasks.slice(0, 6).map((t) => {
                  const Icon = TASK_ICONS[t.type] ?? Stethoscope;
                  return (
                    <div key={t._id} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Icon className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{t.title}</span>
                    </div>
                  );
                })}
                {existingTasks.length > 6 && (
                  <p className="text-xs text-muted-foreground">+{existingTasks.length - 6} more tasks</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
