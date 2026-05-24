import { useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Check,
  Pencil,
  X,
  ExternalLink,
  Plus,
  ArrowUpRight,
  Pill,
  FlaskConical,
  Calendar,
  Stethoscope,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

export interface TaskDiff {
  changeType: 'ADDED' | 'CHANGED';
  previousValue: string | null;
}

export interface AiExtractedTask {
  _id: string;
  taskType: 'MEDICATION' | 'LAB_TEST' | 'APPOINTMENT' | 'PROCEDURE';
  confidence: number;
  sourceText: string;
  reviewStatus: string;
  extractedData: Record<string, unknown>;
  navigatorEdits?: Record<string, unknown>;
  diff: TaskDiff;
}

interface TaskReviewCardProps {
  task: AiExtractedTask;
  navigatorId: string;
  documentId: string;
  onTaskUpdated: (task: AiExtractedTask) => void;
  onViewDocument: () => void;
}

const TASK_TYPE_CONFIG = {
  MEDICATION:  { label: 'Medication', icon: Pill,         color: 'text-purple-600' },
  LAB_TEST:    { label: 'Lab Test',   icon: FlaskConical, color: 'text-blue-600' },
  APPOINTMENT: { label: 'Appointment',icon: Calendar,     color: 'text-green-600' },
  PROCEDURE:   { label: 'Procedure',  icon: Stethoscope,  color: 'text-slate-600' },
};

function ConfidenceBadge({ value }: { value: number }) {
  if (value >= 0.85) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
        <CheckCircle2 className="w-3 h-3" /> High confidence
      </span>
    );
  }
  if (value >= 0.65) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
        <AlertCircle className="w-3 h-3" /> Medium confidence
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">
      <AlertTriangle className="w-3 h-3" /> Low confidence
    </span>
  );
}

function ChangeTypeHeader({ diff, taskType }: { diff: TaskDiff; taskType: string }) {
  const cfg = TASK_TYPE_CONFIG[taskType as keyof typeof TASK_TYPE_CONFIG] ?? TASK_TYPE_CONFIG.PROCEDURE;
  const Icon = cfg.icon;

  if (diff.changeType === 'CHANGED') {
    return (
      <div className="flex items-center gap-1.5 text-amber-600 text-sm font-semibold">
        <ArrowUpRight className="w-4 h-4" />
        <Icon className="w-4 h-4" />
        {cfg.label} Changed
      </div>
    );
  }
  return (
    <div className={cn('flex items-center gap-1.5 text-sm font-semibold', cfg.color)}>
      <Plus className="w-4 h-4 text-green-600" />
      <Icon className="w-4 h-4" />
      {cfg.label} Added
    </div>
  );
}

function TaskTitle({ task }: { task: AiExtractedTask }) {
  const d = task.extractedData;
  switch (task.taskType) {
    case 'MEDICATION':
      return (
        <div>
          <div className="font-semibold text-foreground">{String(d.medicineName ?? 'Medication')}</div>
          {(d.dosage || d.frequency) && (
            <div className="text-sm text-muted-foreground mt-0.5">
              {[d.dosage, d.frequency].filter(Boolean).join(' · ')}
              {d.timing ? ` · ${String(d.timing).replace('_', ' ')}` : ''}
              {d.duration ? ` for ${d.duration}` : ''}
            </div>
          )}
          {task.diff.changeType === 'CHANGED' && task.diff.previousValue && (
            <div className="text-xs text-amber-600 mt-1 bg-amber-50 px-2 py-1 rounded border border-amber-200">
              Previously: {task.diff.previousValue}
            </div>
          )}
        </div>
      );
    case 'LAB_TEST':
      return (
        <div>
          <div className="font-semibold text-foreground">{String(d.testName ?? 'Lab Test')}</div>
          {(d.labName || d.scheduledDate) && (
            <div className="text-sm text-muted-foreground mt-0.5">
              {[d.labName, d.scheduledDate].filter(Boolean).join(' · ')}
            </div>
          )}
        </div>
      );
    case 'APPOINTMENT':
      return (
        <div>
          <div className="font-semibold text-foreground">
            {d.doctorName ? `Appointment with ${d.doctorName}` : String(d.specialty ?? 'Appointment')}
          </div>
          {(d.specialty || d.scheduledDate || d.location) && (
            <div className="text-sm text-muted-foreground mt-0.5">
              {[d.specialty, d.scheduledDate, d.location].filter(Boolean).join(' · ')}
            </div>
          )}
        </div>
      );
    case 'PROCEDURE':
      return (
        <div>
          <div className="font-semibold text-foreground">{String(d.procedureName ?? 'Procedure')}</div>
          {(d.scheduledDate || d.location) && (
            <div className="text-sm text-muted-foreground mt-0.5">
              {[d.scheduledDate, d.location].filter(Boolean).join(' · ')}
            </div>
          )}
        </div>
      );
  }
}

export function TaskReviewCard({
  task,
  navigatorId,
  documentId,
  onTaskUpdated,
  onViewDocument,
}: TaskReviewCardProps) {
  const [action, setAction] = useState<'idle' | 'verifying' | 'rejecting' | 'editing'>('idle');
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [editOpen, setEditOpen] = useState(false);

  const isActioned = ['VERIFIED', 'EDITED', 'REJECTED', 'PUBLISHED'].includes(task.reviewStatus);
  const isRejected = task.reviewStatus === 'REJECTED';

  async function handleVerify() {
    setAction('verifying');
    try {
      const res = await api.patch(`/review-queue/task/${task._id}/verify`, { navigatorId });
      onTaskUpdated(res.data);
    } finally {
      setAction('idle');
    }
  }

  async function handleReject() {
    setAction('rejecting');
    try {
      const res = await api.patch(`/review-queue/task/${task._id}/reject`, { navigatorId });
      onTaskUpdated(res.data);
    } finally {
      setAction('idle');
    }
  }

  async function handleSaveEdit() {
    setAction('editing');
    try {
      const res = await api.patch(`/review-queue/task/${task._id}/edit`, {
        navigatorId,
        edits: editValues,
      });
      onTaskUpdated(res.data);
      setEditOpen(false);
    } finally {
      setAction('idle');
    }
  }

  return (
    <div
      className={cn(
        'rounded-lg border p-4 space-y-3 transition-opacity',
        isRejected && 'opacity-50 bg-red-50 border-red-200',
        !isRejected && 'bg-white border-border',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <ChangeTypeHeader diff={task.diff} taskType={task.taskType} />
        <ConfidenceBadge value={task.confidence} />
      </div>

      <TaskTitle task={task} />

      {task.sourceText && (
        <div className="text-xs text-muted-foreground italic bg-slate-50 px-2.5 py-2 rounded border border-slate-200">
          Source: {task.sourceText}
        </div>
      )}

      <button
        onClick={onViewDocument}
        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
      >
        <ExternalLink className="w-3 h-3" /> View in document
      </button>

      {/* Inline edit fields */}
      {editOpen && (
        <div className="space-y-2 pt-2 border-t border-border">
          {Object.entries(task.extractedData).map(([key, val]) => (
            <div key={key} className="flex items-center gap-2">
              <label className="w-24 text-xs text-muted-foreground capitalize flex-shrink-0">
                {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
              </label>
              <input
                className="flex-1 text-xs border border-border rounded px-2 py-1 bg-white"
                defaultValue={String(val ?? '')}
                onChange={(e) =>
                  setEditValues((prev) => ({ ...prev, [key]: e.target.value }))
                }
              />
            </div>
          ))}
          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={handleSaveEdit} disabled={action === 'editing'} className="h-7 text-xs">
              Save
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditOpen(false)}
              className="h-7 text-xs"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Action buttons — hidden once actioned */}
      {!isActioned && !editOpen && (
        <div className="flex gap-2 pt-1">
          <button
            onClick={handleVerify}
            disabled={action !== 'idle'}
            className="flex-1 inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-md border border-green-300 text-green-700 bg-green-50 hover:bg-green-100 text-xs font-medium transition-colors disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" /> Verify
          </button>
          <button
            onClick={() => setEditOpen(true)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-md border border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100 text-xs font-medium transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" /> Edit
          </button>
          <button
            onClick={handleReject}
            disabled={action !== 'idle'}
            className="flex-1 inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-md border border-red-300 text-red-700 bg-red-50 hover:bg-red-100 text-xs font-medium transition-colors disabled:opacity-50"
          >
            <X className="w-3.5 h-3.5" /> Reject
          </button>
        </div>
      )}

      {isActioned && !isRejected && (
        <div className="flex items-center gap-1.5 text-xs text-green-700 font-medium pt-1">
          <CheckCircle2 className="w-4 h-4" />
          {task.reviewStatus === 'EDITED' ? 'Edited and verified' : 'Verified'}
        </div>
      )}
      {isRejected && (
        <div className="flex items-center gap-1.5 text-xs text-red-600 font-medium pt-1">
          <X className="w-4 h-4" /> Rejected
        </div>
      )}
    </div>
  );
}
