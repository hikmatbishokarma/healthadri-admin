import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Pill,
  FlaskConical,
  CalendarDays,
  Stethoscope,
  CheckCircle,
  Clock,
  History,
  Plus,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Send,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface CarePlanTask {
  _id: string;
  type: string;
  title: string;
  severity: string;
  status: string;
  startDate?: string;
  endDate?: string;
  instructions?: string;
  taskData: Record<string, unknown>;
}

interface CarePlanVersion {
  _id: string;
  versionNumber: number;
  status: string;
  publishedAt?: string;
  effectiveFrom?: string;
  notes?: string;
  sourceBatchId?: string;
}

interface PatientInfo {
  _id: string;
  name: string;
  patientCode: string;
  cancerType?: string;
  cancerStage?: string;
}

const TASK_ICONS: Record<string, React.ElementType> = {
  MEDICATION: Pill,
  LAB_TEST: FlaskConical,
  APPOINTMENT: CalendarDays,
  PROCEDURE: Stethoscope,
  VISIT: Stethoscope,
};

const SEVERITY_COLOR: Record<string, string> = {
  LOW: 'text-green-600 bg-green-50',
  MEDIUM: 'text-yellow-700 bg-yellow-50',
  HIGH: 'text-orange-700 bg-orange-50',
  CRITICAL: 'text-red-700 bg-red-50',
};

const STATUS_COLOR: Record<string, string> = {
  DRAFT: 'bg-yellow-100 text-yellow-800',
  ACTIVE: 'bg-green-100 text-green-800',
  SUPERSEDED: 'bg-gray-100 text-gray-500',
  ARCHIVED: 'bg-gray-100 text-gray-400',
};

function TaskCard({ task }: { task: CarePlanTask }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = TASK_ICONS[task.type] ?? Stethoscope;
  const severityStyle = SEVERITY_COLOR[task.severity] ?? SEVERITY_COLOR.MEDIUM;

  return (
    <div className="bg-card border border-border rounded-lg p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-foreground">{task.title}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${severityStyle}`}>
                {task.severity}
              </span>
            </div>
            <span className="text-xs text-muted-foreground capitalize mt-0.5 block">
              {task.type.replace('_', ' ').toLowerCase()}
            </span>
            {(task.startDate || task.endDate) && (
              <span className="text-xs text-muted-foreground mt-0.5 block">
                {task.startDate && new Date(task.startDate).toLocaleDateString('en-IN')}
                {task.startDate && task.endDate && ' – '}
                {task.endDate && new Date(task.endDate).toLocaleDateString('en-IN')}
              </span>
            )}
          </div>
        </div>
        {Object.keys(task.taskData).length > 0 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>

      {expanded && (
        <dl className="mt-3 pt-3 border-t border-border grid grid-cols-2 gap-x-4 gap-y-1.5">
          {Object.entries(task.taskData).map(([k, v]) => {
            if (v == null || v === '') return null;
            return (
              <div key={k}>
                <dt className="text-xs text-muted-foreground capitalize">{k.replace(/_/g, ' ')}</dt>
                <dd className="text-sm text-foreground">{String(v)}</dd>
              </div>
            );
          })}
          {task.instructions && (
            <div className="col-span-2">
              <dt className="text-xs text-muted-foreground">Instructions</dt>
              <dd className="text-sm text-foreground">{task.instructions}</dd>
            </div>
          )}
        </dl>
      )}
    </div>
  );
}

export function NavCarePlanDetailPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [patient, setPatient] = useState<PatientInfo | null>(null);
  const [activePlan, setActivePlan] = useState<{ version: CarePlanVersion; tasks: CarePlanTask[] } | null>(null);
  const [draftPlan, setDraftPlan] = useState<{ version: CarePlanVersion; tasks: CarePlanTask[] } | null>(null);
  const [versions, setVersions] = useState<CarePlanVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    try {
      const [patientRes, activeRes, draftRes, versionsRes] = await Promise.allSettled([
        api.get(`/users/${patientId}`),
        api.get(`/care-plan/patient/${patientId}/active`),
        api.get(`/care-plan/patient/${patientId}/draft`),
        api.get(`/care-plan/patient/${patientId}`),
      ]);

      if (patientRes.status === 'fulfilled') setPatient(patientRes.value.data);
      if (activeRes.status === 'fulfilled') setActivePlan(activeRes.value.data);
      if (draftRes.status === 'fulfilled' && draftRes.value.data) {
        const draft = draftRes.value.data;
        const tasksRes = await api.get(`/care-plan/version/${draft._id}`);
        setDraftPlan(tasksRes.data);
      }
      if (versionsRes.status === 'fulfilled') setVersions(versionsRes.value.data);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const publishDraft = async () => {
    if (!draftPlan || !user?._id) return;
    setPublishing(true);
    try {
      await api.post(`/care-plan/version/${draftPlan.version._id}/publish`, {
        navigatorId: user._id,
        effectiveFrom: new Date().toISOString(),
      });
      await fetchAll();
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <p className="text-muted-foreground text-sm">Loading care plan…</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold text-foreground">
            {patient?.name ?? 'Care Plan'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {patient?.patientCode}
            {patient?.cancerType && ` · ${patient.cancerType}`}
            {patient?.cancerStage && ` · Stage ${patient.cancerStage}`}
          </p>
        </div>
      </div>

      {/* Draft plan — requires publish action */}
      {draftPlan && (
        <div className="border-2 border-yellow-300 rounded-lg bg-yellow-50/50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-yellow-100/70 border-b border-yellow-200">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-700" />
              <span className="text-sm font-semibold text-yellow-800">
                Draft — v{draftPlan.version.versionNumber}
              </span>
              <span className="text-xs text-yellow-700">({draftPlan.tasks.length} tasks)</span>
            </div>
            <button
              disabled={publishing}
              onClick={publishDraft}
              className="flex items-center gap-1.5 text-sm font-medium bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              {publishing ? 'Publishing…' : 'Publish'}
            </button>
          </div>

          <div className="p-4">
            <div className="flex items-start gap-2 mb-3 p-2.5 bg-yellow-100 rounded-md">
              <AlertTriangle className="w-3.5 h-3.5 text-yellow-700 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-yellow-800">
                Publishing this draft will activate it as the patient's care plan and supersede any currently active version.
              </p>
            </div>
            <div className="space-y-2.5">
              {draftPlan.tasks.map((task) => (
                <TaskCard key={task._id} task={task} />
              ))}
              {draftPlan.tasks.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No tasks in this draft.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Active plan */}
      {activePlan ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm font-semibold text-foreground">
                Active Plan — v{activePlan.version.versionNumber}
              </span>
              {activePlan.version.publishedAt && (
                <span className="text-xs text-muted-foreground">
                  Published {new Date(activePlan.version.publishedAt).toLocaleDateString('en-IN')}
                </span>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {activePlan.tasks.length} tasks
            </span>
          </div>

          <div className="space-y-2.5">
            {activePlan.tasks.map((task) => (
              <TaskCard key={task._id} task={task} />
            ))}
            {activePlan.tasks.length === 0 && (
              <div className="text-center py-8 bg-card border border-border rounded-lg">
                <p className="text-sm text-muted-foreground">No active tasks in this care plan.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        !draftPlan && (
          <div className="text-center py-12 bg-card border border-border rounded-lg">
            <Plus className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">No care plan yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Upload a document and review the extracted tasks to create a care plan.
            </p>
          </div>
        )
      )}

      {/* Version history */}
      {versions.length > 0 && (
        <div>
          <button
            onClick={() => setShowHistory((v) => !v)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <History className="w-4 h-4" />
            Version history ({versions.length})
            {showHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showHistory && (
            <div className="mt-3 space-y-2">
              {versions.map((v) => (
                <div
                  key={v._id}
                  className="flex items-center justify-between px-3 py-2.5 bg-card border border-border rounded-md"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-foreground">v{v.versionNumber}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[v.status] ?? 'bg-gray-100 text-gray-600'}`}
                    >
                      {v.status}
                    </span>
                    {v.notes && (
                      <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {v.notes}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {v.publishedAt && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(v.publishedAt).toLocaleDateString('en-IN')}
                      </span>
                    )}
                    <button
                      onClick={() => navigate(`/nav/care-plans/${patientId}/version/${v._id}`)}
                      className="text-xs text-primary hover:underline"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
