import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Pill, FlaskConical, CalendarDays, Stethoscope,
  Building2, Clock, ChevronDown, ChevronUp, AlertTriangle,
  Send, CheckCircle2, CircleDot, MoreHorizontal, Plus, Minus,
  FileText, History, Eye, EyeOff,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

// ── Types ─────────────────────────────────────────────────────────────────────

interface VersionDiffEntry {
  title: string;
  changeType: 'ADDED' | 'CHANGED' | 'REMOVED';
  previousValue?: string;
  currentValue?: string;
}

interface CarePlanTask {
  _id: string;
  type: string;
  title: string;
  severity: string;
  status: string;
  startDate?: string | null;
  endDate?: string | null;
  instructions?: string;
  taskData: Record<string, string>;
  schedule?: { times?: string[]; intervalDays?: number } | null;
}

interface CarePlanVersion {
  _id: string;
  versionNumber: number;
  status: string;
  publishedAt?: string | null;
  updatedAt?: string;
  notes?: string;
  nextReviewDate?: string | null;
  visibleToPatient?: boolean;
  versionDiff?: VersionDiffEntry[] | null;
  sourceBatchId?: string | null;
}

interface PatientInfo {
  _id: string;
  name: string;
  patientCode: string;
  cancerType?: string;
  cancerStage?: string;
  gender?: string;
  age?: number;
  phone?: string;
  doctorName?: string;
  acuityScore?: number;
  treatmentStatus?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TASK_ICON: Record<string, React.ElementType> = {
  MEDICATION:  Pill,
  LAB_TEST:    FlaskConical,
  APPOINTMENT: CalendarDays,
  PROCEDURE:   Stethoscope,
  VISIT:       Building2,
};

const TASK_ICON_BG: Record<string, string> = {
  MEDICATION:  'bg-purple-100 text-purple-600',
  LAB_TEST:    'bg-blue-100 text-blue-600',
  APPOINTMENT: 'bg-green-100 text-green-600',
  PROCEDURE:   'bg-slate-100 text-slate-600',
  VISIT:       'bg-teal-100 text-teal-600',
};

const SEVERITY_BADGE: Record<string, string> = {
  LOW:      'bg-green-100 text-green-700',
  MEDIUM:   'bg-amber-100 text-amber-700',
  HIGH:     'bg-orange-100 text-orange-700',
  CRITICAL: 'bg-red-100 text-red-700',
};

const DIFF_CONFIG = {
  ADDED:   { icon: Plus,  color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
  CHANGED: { icon: Minus, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  REMOVED: { icon: Minus, color: 'text-red-600',   bg: 'bg-red-50',   border: 'border-red-200'   },
} as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

const now = new Date();

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

function fmtDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtDateTime(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

function daysOverdue(endDate: string) {
  return Math.floor((now.getTime() - new Date(endDate).getTime()) / 86400000);
}

function daysUntil(startDate: string) {
  const diff = Math.ceil((new Date(startDate).getTime() - now.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return `${diff} days`;
}

function taskSection(task: CarePlanTask): 'active' | 'upcoming' | 'missed' | 'completed' | 'archived' {
  if (task.status === 'COMPLETED') return 'completed';
  if (task.status === 'CANCELLED' || task.status === 'REPLACED' || task.status === 'EXPIRED') return 'archived';
  if (task.endDate && new Date(task.endDate) < now) return 'missed';
  if (task.startDate && new Date(task.startDate) > now) return 'upcoming';
  return 'active';
}

function scheduleLabel(task: CarePlanTask): string {
  const sched = task.schedule;
  if (!sched) return '';
  const times = sched.times ?? [];
  if (times.length === 0) return '';
  return times.map((t) => {
    const [h, m] = t.split(':').map(Number);
    const d = new Date(); d.setHours(h, m, 0, 0);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  }).join('  •  ');
}

function coveragePercent(tasks: CarePlanTask[]): number {
  const countable = tasks.filter((t) => t.status !== 'CANCELLED' && t.status !== 'REPLACED');
  if (countable.length === 0) return 0;
  const done = countable.filter((t) => t.status === 'COMPLETED').length;
  return Math.round((done / countable.length) * 100);
}

// ── Task card ─────────────────────────────────────────────────────────────────

function TaskCard({
  task, section,
}: {
  task: CarePlanTask;
  section: 'active' | 'upcoming' | 'missed' | 'completed' | 'archived';
}) {
  const [open, setOpen] = useState(false);
  const Icon = TASK_ICON[task.type] ?? Stethoscope;
  const iconBg = TASK_ICON_BG[task.type] ?? 'bg-gray-100 text-gray-500';
  const sched = scheduleLabel(task);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 group hover:border-gray-300 hover:shadow-sm transition-all">
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-900">{task.title}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SEVERITY_BADGE[task.severity] ?? SEVERITY_BADGE.MEDIUM}`}>
              {task.severity}
            </span>
            <span className="text-xs text-gray-400 capitalize">
              {task.type.replace('_', ' ').toLowerCase().replace('lab test', 'Test')}
            </span>
          </div>
          {task.instructions && (
            <p className="text-xs text-gray-500 mt-0.5 truncate">{task.instructions}</p>
          )}
          {(task.startDate || task.endDate) && (
            <p className="text-xs text-gray-400 mt-0.5">
              {task.startDate && fmtDate(task.startDate)}
              {task.startDate && task.endDate && ' – '}
              {task.endDate && fmtDate(task.endDate)}
            </p>
          )}
        </div>

        {/* Schedule / date column */}
        {section === 'active' && sched && (
          <div className="text-right flex-shrink-0 hidden sm:block">
            <p className="text-xs text-gray-400">Schedule</p>
            <p className="text-xs font-medium text-gray-700">{sched}</p>
          </div>
        )}
        {section === 'upcoming' && task.startDate && (
          <div className="text-right flex-shrink-0 hidden sm:block">
            <p className="text-xs text-gray-400">Due Date</p>
            <p className="text-xs font-medium text-amber-600">{fmtDate(task.startDate)}</p>
            <p className="text-xs text-gray-400">in {daysUntil(task.startDate)}</p>
          </div>
        )}
        {section === 'missed' && task.endDate && (
          <div className="text-right flex-shrink-0 hidden sm:block">
            <p className="text-xs text-gray-400">Due Date</p>
            <p className="text-xs font-semibold text-red-600">{fmtDate(task.endDate)}</p>
            <p className="text-xs text-red-500">{daysOverdue(task.endDate)} days overdue</p>
          </div>
        )}
        {section === 'upcoming' && (
          <div className="flex-shrink-0 hidden sm:block">
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-amber-100 text-amber-700">Scheduled</span>
          </div>
        )}
        {section === 'missed' && (
          <div className="flex-shrink-0 hidden sm:block">
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-red-100 text-red-700">Overdue</span>
          </div>
        )}
        {section === 'completed' && (
          <div className="flex-shrink-0 hidden sm:block">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          </div>
        )}

        {/* Expand / kebab */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {Object.keys(task.taskData).length > 0 && (
            <button
              onClick={() => setOpen((v) => !v)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
          <button className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded task data */}
      {open && (
        <dl className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-x-6 gap-y-2">
          {Object.entries(task.taskData).map(([k, v]) => {
            if (!v) return null;
            return (
              <div key={k}>
                <dt className="text-xs text-gray-400 capitalize">{k.replace(/([A-Z])/g, ' $1').toLowerCase()}</dt>
                <dd className="text-sm text-gray-800">{v}</dd>
              </div>
            );
          })}
          {task.instructions && (
            <div className="col-span-2">
              <dt className="text-xs text-gray-400">Instructions</dt>
              <dd className="text-sm text-gray-800">{task.instructions}</dd>
            </div>
          )}
        </dl>
      )}
    </div>
  );
}

// ── Section header ────────────────────────────────────────────────────────────

function SectionHeader({
  dot, label, count, collapsed, onToggle,
}: {
  dot: string; label: string; count: number; collapsed?: boolean; onToggle?: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-2 mb-3 w-full text-left group"
      disabled={!onToggle}
    >
      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dot}`} />
      <span className="text-xs font-bold tracking-widest text-gray-500 uppercase">{label}</span>
      <span className="text-xs text-gray-400">({count})</span>
      {onToggle && (collapsed
        ? <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-auto" />
        : <ChevronUp className="w-3.5 h-3.5 text-gray-400 ml-auto" />
      )}
    </button>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

type CategoryFilter = 'all' | 'MEDICATION' | 'LAB_TEST' | 'APPOINTMENT';
type StatusFilter   = 'all' | 'active' | 'upcoming' | 'completed' | 'missed';

export function NavCarePlanDetailPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [patient, setPatient]   = useState<PatientInfo | null>(null);
  const [active, setActive]     = useState<{ version: CarePlanVersion; tasks: CarePlanTask[] } | null>(null);
  const [draft, setDraft]       = useState<{ version: CarePlanVersion; tasks: CarePlanTask[] } | null>(null);
  const [versions, setVersions] = useState<CarePlanVersion[]>([]);
  const [loading, setLoading]   = useState(true);
  const [publishing, setPublishing] = useState(false);

  const [catFilter, setCatFilter]       = useState<CategoryFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showCompleted, setShowCompleted] = useState(false);
  const [showArchived, setShowArchived]   = useState(false);
  const [showMoreInfo, setShowMoreInfo]   = useState(false);

  const fetchAll = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    try {
      const [patRes, actRes, draftRes, verRes] = await Promise.allSettled([
        api.get(`/users/${patientId}`),
        api.get(`/care-plan/patient/${patientId}/active`),
        api.get(`/care-plan/patient/${patientId}/draft`),
        api.get(`/care-plan/patient/${patientId}`),
      ]);

      if (patRes.status === 'fulfilled')  setPatient(patRes.value.data);
      if (actRes.status === 'fulfilled')  setActive(actRes.value.data);
      if (verRes.status === 'fulfilled')  setVersions(verRes.value.data ?? []);

      if (draftRes.status === 'fulfilled' && draftRes.value.data) {
        const draftVer: CarePlanVersion = draftRes.value.data;
        const tasksRes = await api.get(`/care-plan/version/${draftVer._id}`);
        setDraft(tasksRes.data);
      }
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function publishDraft() {
    if (!draft || !user?._id) return;
    setPublishing(true);
    try {
      await api.post(`/care-plan/version/${draft.version._id}/publish`, {
        navigatorId: user._id,
        effectiveFrom: new Date().toISOString(),
      });
      await fetchAll();
    } finally {
      setPublishing(false);
    }
  }

  // ── Derived ──────────────────────────────────────────────────────────────────

  const allTasks = active?.tasks ?? [];

  const sectioned = useMemo(() => {
    const cat = catFilter === 'all' ? allTasks : allTasks.filter((t) => t.type === catFilter);
    return {
      active:    cat.filter((t) => taskSection(t) === 'active'),
      upcoming:  cat.filter((t) => taskSection(t) === 'upcoming'),
      missed:    cat.filter((t) => taskSection(t) === 'missed'),
      completed: cat.filter((t) => taskSection(t) === 'completed'),
      archived:  cat.filter((t) => taskSection(t) === 'archived'),
    };
  }, [allTasks, catFilter]);

  const visibleSections = useMemo(() => {
    if (statusFilter === 'all') return sectioned;
    const empty = { active: [], upcoming: [], missed: [], completed: [], archived: [] };
    return { ...empty, [statusFilter]: sectioned[statusFilter as keyof typeof sectioned] ?? [] };
  }, [sectioned, statusFilter]);

  const coverage = coveragePercent(allTasks);
  const ver = active?.version;

  const statCards = [
    { label: 'Active',          sub: 'Currently ongoing', value: sectioned.active.length,    color: 'text-green-600', bg: 'bg-green-50',  border: 'border-green-200'  },
    { label: 'Upcoming',        sub: 'Next 30 days',      value: sectioned.upcoming.length,  color: 'text-amber-600', bg: 'bg-amber-50',  border: 'border-amber-200'  },
    { label: 'Completed',       sub: 'Past tasks',        value: sectioned.completed.length, color: 'text-blue-600',  bg: 'bg-blue-50',   border: 'border-blue-200'   },
    { label: 'Missed / Overdue',sub: 'Needs attention',   value: sectioned.missed.length,    color: 'text-red-600',   bg: 'bg-red-50',    border: 'border-red-200',
      alert: sectioned.missed.length > 0 },
  ];

  const CAT_TABS: { id: CategoryFilter; label: string }[] = [
    { id: 'all',         label: 'All'          },
    { id: 'MEDICATION',  label: 'Medications'  },
    { id: 'LAB_TEST',    label: 'Tests & Scans'},
    { id: 'APPOINTMENT', label: 'Appointments' },
  ];
  const STATUS_TABS: { id: StatusFilter; label: string }[] = [
    { id: 'all',       label: 'Active'    },
    { id: 'upcoming',  label: 'Upcoming'  },
    { id: 'completed', label: 'Completed' },
    { id: 'missed',    label: 'Missed'    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <p className="text-sm text-gray-400">Loading care plan…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">

      {/* ── Patient header bar ─────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 flex-shrink-0">
        {/* Back nav */}
        <div className="px-6 pt-3 pb-2 flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Patients
          </button>
        </div>

        {/* Patient info row */}
        <div className="px-6 pb-4 flex items-center gap-5 flex-wrap">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
            {patient ? initials(patient.name) : '?'}
          </div>

          {/* Name / code / tags */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">{patient?.name ?? '—'}</h1>
              {ver?.status === 'ACTIVE' && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">Active</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 flex-wrap mt-0.5">
              <span>{patient?.patientCode}</span>
              {patient?.cancerType && <><span className="text-gray-300">·</span><span>{patient.cancerType}</span></>}
              {patient?.cancerStage && <><span className="text-gray-300">·</span><span>Stage {patient.cancerStage}</span></>}
              {patient?.gender && <><span className="text-gray-300">·</span><span className="capitalize">{patient.gender}</span></>}
              {patient?.age && <><span className="text-gray-300">·</span><span>{patient.age} yrs</span></>}
            </div>
          </div>

          {/* Doctor + phone */}
          {patient?.doctorName && (
            <div className="hidden md:block text-sm">
              <p className="text-xs text-gray-400">Primary Oncologist</p>
              <p className="font-medium text-gray-800">{patient.doctorName}</p>
            </div>
          )}
          {patient?.phone && (
            <div className="hidden md:block text-sm">
              <p className="text-xs text-gray-400">Phone</p>
              <p className="font-medium text-gray-800">+91 {patient.phone}</p>
            </div>
          )}
          <button
            onClick={() => setShowMoreInfo((v) => !v)}
            className="hidden md:flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50"
          >
            More
            {showMoreInfo ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {/* Right: version + actions */}
          <div className="flex items-center gap-4 ml-auto flex-shrink-0">
            {ver && (
              <div className="text-right">
                <p className="text-xs text-gray-400">Active Plan</p>
                <p className="text-2xl font-black text-blue-700">v{ver.versionNumber}</p>
              </div>
            )}
            {ver?.publishedAt && (
              <div className="text-right hidden lg:block">
                <p className="text-xs text-gray-400">Published on</p>
                <p className="text-sm font-medium text-gray-700">{fmtDateTime(ver.publishedAt)}</p>
              </div>
            )}
            <div className="relative">
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                Plan Actions
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stat cards + filter row ────────────────────────────────────────── */}
      <div className="px-6 py-4 flex-shrink-0 space-y-4">
        {/* Draft banner */}
        {draft && (
          <div className="border-2 border-amber-300 rounded-xl bg-amber-50 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-amber-700" />
                <span className="text-sm font-semibold text-amber-800">
                  Draft — v{draft.version.versionNumber}
                </span>
                <span className="text-xs text-amber-600">({draft.tasks.length} tasks)</span>
              </div>
              <button
                disabled={publishing}
                onClick={publishDraft}
                className="flex items-center gap-1.5 text-sm font-semibold bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                {publishing ? 'Publishing…' : 'Publish'}
              </button>
            </div>
            <div className="px-5 pb-4 space-y-1">
              <div className="flex items-start gap-2 p-3 bg-amber-100/70 rounded-lg">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-700 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-800">
                  Publishing this draft will activate it as the patient's care plan and supersede any currently active version.
                </p>
              </div>
              {draft.tasks.length === 0 && (
                <p className="text-sm text-amber-700 text-center py-3">No tasks in this draft.</p>
              )}
            </div>
          </div>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-4">
          {statCards.map(({ label, sub, value, color, bg, border, alert }) => (
            <div key={label} className={`bg-white rounded-xl border p-4 flex items-center gap-4 shadow-sm ${alert ? 'border-red-200' : 'border-gray-100'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${bg} ${border} border`}>
                {alert
                  ? <AlertTriangle className={`w-5 h-5 ${color}`} />
                  : <CircleDot className={`w-5 h-5 ${color}`} />
                }
              </div>
              <div>
                <p className={`text-2xl font-black leading-none ${color}`}>{value}</p>
                <p className="text-sm font-medium text-gray-700 mt-0.5">{label}</p>
                <p className="text-xs text-gray-400">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-2.5 flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-1">
            {CAT_TABS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setCatFilter(id)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  catFilter === id
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="w-px h-5 bg-gray-200" />
          <div className="flex items-center gap-1">
            {STATUS_TABS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setStatusFilter(statusFilter === id ? 'all' : id)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  statusFilter === id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content: timeline + sidebar ────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden px-6 pb-4 gap-5">

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-1">
          {!active && !draft && (
            <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-gray-100">
              <FileText className="w-10 h-10 text-gray-300 mb-3" />
              <p className="text-sm font-medium text-gray-600">No care plan yet</p>
              <p className="text-xs text-gray-400 mt-1">Upload a document to create a care plan.</p>
            </div>
          )}

          {/* ACTIVE NOW */}
          {visibleSections.active.length > 0 && (
            <section>
              <SectionHeader dot="bg-green-500" label="Active Now" count={visibleSections.active.length} />
              <div className="space-y-3">
                {visibleSections.active.map((t) => <TaskCard key={t._id} task={t} section="active" />)}
              </div>
            </section>
          )}

          {/* UPCOMING */}
          {visibleSections.upcoming.length > 0 && (
            <section>
              <SectionHeader dot="bg-amber-500" label="Upcoming" count={visibleSections.upcoming.length} />
              <div className="space-y-3">
                {visibleSections.upcoming.map((t) => <TaskCard key={t._id} task={t} section="upcoming" />)}
              </div>
            </section>
          )}

          {/* MISSED / OVERDUE */}
          {visibleSections.missed.length > 0 && (
            <section>
              <SectionHeader dot="bg-red-500" label="Missed / Overdue" count={visibleSections.missed.length} />
              <div className="space-y-3">
                {visibleSections.missed.map((t) => <TaskCard key={t._id} task={t} section="missed" />)}
              </div>
            </section>
          )}

          {/* COMPLETED */}
          {sectioned.completed.length > 0 && (statusFilter === 'all' || statusFilter === 'completed') && (
            <section>
              <SectionHeader
                dot="bg-blue-400" label="Completed" count={sectioned.completed.length}
                collapsed={!showCompleted} onToggle={() => setShowCompleted((v) => !v)}
              />
              {showCompleted && (
                <div className="space-y-3">
                  {sectioned.completed.map((t) => <TaskCard key={t._id} task={t} section="completed" />)}
                </div>
              )}
            </section>
          )}

          {/* ARCHIVED */}
          {sectioned.archived.length > 0 && statusFilter === 'all' && (
            <section>
              <SectionHeader
                dot="bg-gray-300" label="Archived" count={sectioned.archived.length}
                collapsed={!showArchived} onToggle={() => setShowArchived((v) => !v)}
              />
              {showArchived && (
                <div className="space-y-3">
                  {sectioned.archived.map((t) => <TaskCard key={t._id} task={t} section="archived" />)}
                </div>
              )}
            </section>
          )}
        </div>

        {/* ── Right sidebar ─────────────────────────────────────────────────── */}
        <aside className="w-72 flex-shrink-0 overflow-y-auto space-y-4 pb-2">

          {/* Care Plan Coverage */}
          {allTasks.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Care Plan Coverage</h3>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-3xl font-black ${coverage >= 75 ? 'text-green-600' : coverage >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                  {coverage}%
                </span>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  coverage >= 75 ? 'bg-green-100 text-green-700' : coverage >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                }`}>
                  {coverage >= 75 ? 'On track' : coverage >= 50 ? 'At risk' : 'Off track'}
                </span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${coverage >= 75 ? 'bg-green-500' : coverage >= 50 ? 'bg-amber-400' : 'bg-red-500'}`}
                  style={{ width: `${coverage}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1.5">
                <span>{sectioned.completed.length} completed</span>
                <span>{allTasks.filter((t) => t.status !== 'CANCELLED').length} total</span>
              </div>
            </div>
          )}

          {/* Care Plan Summary */}
          {ver && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Care Plan Summary</h3>
              <div className="space-y-2.5">
                {[
                  { label: 'Plan Status',      value: ver.status,                     valueClass: ver.status === 'ACTIVE' ? 'text-green-600 font-semibold' : 'text-gray-700' },
                  { label: 'Current Version',  value: `v${ver.versionNumber}`,         valueClass: 'text-blue-700 font-bold' },
                  { label: 'Published On',     value: fmtDateTime(ver.publishedAt),   valueClass: 'text-gray-700' },
                  { label: 'Last Updated',     value: fmtDate(ver.updatedAt),         valueClass: 'text-gray-700' },
                  { label: 'Next Review',      value: fmtDate(ver.nextReviewDate),    valueClass: 'text-gray-700' },
                ].map(({ label, value, valueClass }) => (
                  <div key={label} className="flex items-start justify-between gap-2">
                    <span className="text-xs text-gray-400 flex-shrink-0">{label}</span>
                    <span className={`text-xs text-right ${valueClass}`}>{value}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-400">Visible to Patient</span>
                  <div className="flex items-center gap-1.5">
                    {ver.visibleToPatient
                      ? <><Eye className="w-3.5 h-3.5 text-green-600" /><span className="text-xs font-semibold text-green-600">Yes</span></>
                      : <><EyeOff className="w-3.5 h-3.5 text-gray-400" /><span className="text-xs text-gray-500">No</span></>
                    }
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Latest Updates (versionDiff) */}
          {ver?.versionDiff && ver.versionDiff.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">
                Latest Updates
                {ver.versionNumber > 1 && (
                  <span className="normal-case font-normal text-gray-400 ml-1">
                    (from v{ver.versionNumber - 1} to v{ver.versionNumber})
                  </span>
                )}
              </h3>
              <div className="space-y-2.5">
                {ver.versionDiff.map((entry, i) => {
                  const cfg = DIFF_CONFIG[entry.changeType];
                  const DiffIcon = cfg.icon;
                  return (
                    <div key={i} className={`flex items-start gap-2.5 p-2 rounded-lg ${cfg.bg} border ${cfg.border}`}>
                      <DiffIcon className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${cfg.color}`} />
                      <div className="min-w-0">
                        <p className={`text-xs font-medium ${cfg.color}`}>{entry.title}</p>
                        {entry.changeType === 'CHANGED' && entry.previousValue && entry.currentValue && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {entry.previousValue} → {entry.currentValue}
                          </p>
                        )}
                        {entry.currentValue && entry.changeType !== 'CHANGED' && (
                          <p className="text-xs text-gray-500 mt-0.5">{entry.currentValue}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Prescription History (version timeline) */}
          {versions.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Prescription History</h3>
                <button className="text-xs text-blue-600 hover:underline">View full history</button>
              </div>
              <div className="space-y-3">
                {versions.slice(0, 4).map((v, i) => (
                  <div key={v._id} className="flex items-start gap-3">
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className={`w-3 h-3 rounded-full mt-0.5 ${i === 0 ? 'bg-green-500' : i === 1 ? 'bg-blue-400' : 'bg-gray-300'}`} />
                      {i < Math.min(versions.length, 4) - 1 && <div className="w-px h-6 bg-gray-200 mt-1" />}
                    </div>
                    <div className="flex-1 min-w-0 pb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{fmtDate(v.publishedAt)}</span>
                        <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                          v{v.versionNumber}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <History className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <p className="text-xs text-gray-700 truncate">{v.notes || `Care plan v${v.versionNumber}`}</p>
                      </div>
                      <button
                        onClick={() => navigate(`/nav/care-plans/${patientId}/version/${v._id}`)}
                        className="mt-1 text-xs text-blue-600 hover:underline"
                      >
                        View →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
