import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Pill, FlaskConical, CalendarDays, Stethoscope,
  Building2, ChevronDown, ChevronUp, CheckCircle2, CircleAlert,
  MoreHorizontal, Plus, Minus, FileText, History, Eye, EyeOff,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
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
  ADDED:   { Icon: Plus,  colorClass: 'text-green-600', bg: 'bg-green-50 border-green-200'  },
  CHANGED: { Icon: Minus, colorClass: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
  REMOVED: { Icon: Minus, colorClass: 'text-red-600',   bg: 'bg-red-50 border-red-200'     },
} as const;

type Section = 'active' | 'upcoming' | 'missed' | 'completed' | 'archived';
type CategoryFilter = 'all' | 'MEDICATION' | 'LAB_TEST' | 'APPOINTMENT';
type StatusFilter   = 'all' | 'active' | 'upcoming' | 'completed' | 'missed';

// ── Helpers ───────────────────────────────────────────────────────────────────

const NOW = new Date();

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

function fmtDate(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtDateTime(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

function todayLabel() {
  return NOW.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function daysOverdue(endDate: string) {
  return Math.floor((NOW.getTime() - new Date(endDate).getTime()) / 86400000);
}

function daysUntilLabel(startDate: string) {
  const d = Math.ceil((new Date(startDate).getTime() - NOW.getTime()) / 86400000);
  if (d <= 0) return 'Today';
  if (d === 1) return 'Tomorrow';
  return `in ${d} days`;
}

function taskSection(t: CarePlanTask): Section {
  if (t.status === 'COMPLETED') return 'completed';
  if (['CANCELLED', 'REPLACED', 'EXPIRED'].includes(t.status)) return 'archived';
  if (t.endDate && new Date(t.endDate) < NOW) return 'missed';
  if (t.startDate && new Date(t.startDate) > NOW) return 'upcoming';
  return 'active';
}

function scheduleLabel(task: CarePlanTask) {
  const times = task.schedule?.times ?? [];
  return times.map((t) => {
    const [h, m] = t.split(':').map(Number);
    const d = new Date(); d.setHours(h, m, 0, 0);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  }).join('  ·  ');
}

function coveragePct(tasks: CarePlanTask[]) {
  const countable = tasks.filter((t) => !['CANCELLED', 'REPLACED'].includes(t.status));
  if (!countable.length) return 0;
  return Math.round((countable.filter((t) => t.status === 'COMPLETED').length / countable.length) * 100);
}

// ── Task card ─────────────────────────────────────────────────────────────────

function TaskCard({ task, section }: { task: CarePlanTask; section: Section }) {
  const [open, setOpen] = useState(false);
  const Icon  = TASK_ICON[task.type] ?? Stethoscope;
  const iconBg = TASK_ICON_BG[task.type] ?? 'bg-muted text-muted-foreground';
  const sched  = scheduleLabel(task);
  const hasData = Object.values(task.taskData).some(Boolean);

  return (
    <div className="bg-white border border-border rounded-lg p-4 group hover:border-primary/30 transition-colors">
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className={cn('w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0', iconBg)}>
          <Icon className="w-5 h-5" />
        </div>

        {/* Main */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground">{task.title}</span>
            <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', SEVERITY_BADGE[task.severity] ?? SEVERITY_BADGE.MEDIUM)}>
              {task.severity}
            </span>
            <span className="text-xs text-muted-foreground capitalize">
              {task.type.replace(/_/g, ' ').toLowerCase()}
            </span>
          </div>
          {task.instructions && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{task.instructions}</p>
          )}
          {(task.startDate || task.endDate) && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {fmtDate(task.startDate)}{task.startDate && task.endDate && ' – '}{fmtDate(task.endDate)}
            </p>
          )}
        </div>

        {/* Right column: schedule / status */}
        {section === 'active' && sched && (
          <div className="text-right flex-shrink-0 hidden sm:block">
            <p className="text-xs text-muted-foreground">Schedule</p>
            <p className="text-xs font-medium text-foreground">{sched}</p>
          </div>
        )}
        {section === 'upcoming' && task.startDate && (
          <div className="text-right flex-shrink-0 hidden sm:block">
            <p className="text-xs text-muted-foreground">Due Date</p>
            <p className="text-xs font-semibold text-amber-600">{fmtDate(task.startDate)}</p>
            <p className="text-xs text-muted-foreground">{daysUntilLabel(task.startDate)}</p>
          </div>
        )}
        {section === 'missed' && task.endDate && (
          <div className="text-right flex-shrink-0 hidden sm:block">
            <p className="text-xs text-muted-foreground">Due Date</p>
            <p className="text-xs font-semibold text-destructive">{fmtDate(task.endDate)}</p>
            <p className="text-xs text-destructive">{daysOverdue(task.endDate)} days overdue</p>
          </div>
        )}

        {section === 'upcoming' && (
          <span className="flex-shrink-0 text-xs font-medium px-2 py-1 rounded-full bg-amber-100 text-amber-700 hidden sm:inline">
            Scheduled
          </span>
        )}
        {section === 'missed' && (
          <span className="flex-shrink-0 text-xs font-medium px-2 py-1 rounded-full bg-red-100 text-red-700 hidden sm:inline">
            Overdue
          </span>
        )}
        {section === 'completed' && (
          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 hidden sm:block" />
        )}

        {/* Expand / kebab */}
        <div className="flex items-center gap-1 flex-shrink-0 ml-1">
          {hasData && (
            <button
              onClick={() => setOpen((v) => !v)}
              className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
          <button className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors opacity-0 group-hover:opacity-100">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {open && (
        <dl className="mt-3 pt-3 border-t border-border grid grid-cols-2 gap-x-6 gap-y-2">
          {Object.entries(task.taskData).map(([k, v]) => {
            if (!v) return null;
            return (
              <div key={k}>
                <dt className="text-xs text-muted-foreground capitalize">{k.replace(/([A-Z])/g, ' $1').toLowerCase()}</dt>
                <dd className="text-sm text-foreground">{v}</dd>
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

// ── Collapsible section row (Completed / Archived) ────────────────────────────

function CollapsibleRow({
  icon: Icon, label, count, open, onToggle, children,
}: {
  icon: React.ElementType; label: string; count: number;
  open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-border rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Icon className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">{label} ({count})</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>View all {label.toLowerCase()} tasks</span>
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>
      {open && <div className="border-t border-border p-4 space-y-3">{children}</div>}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function NavCarePlanDetailPage() {
  const { patientId, versionId } = useParams<{ patientId: string; versionId?: string }>();
  const { user: _user } = useAuth();
  const navigate = useNavigate();

  const [patient, setPatient]   = useState<PatientInfo | null>(null);
  const [active, setActive]     = useState<{ version: CarePlanVersion; tasks: CarePlanTask[] } | null>(null);
  const [versions, setVersions] = useState<CarePlanVersion[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showAllVersions, setShowAllVersions] = useState(false);

  const [catFilter, setCatFilter]       = useState<CategoryFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showCompleted, setShowCompleted] = useState(false);
  const [showArchived, setShowArchived]   = useState(false);

  const isHistorical = Boolean(versionId);

  const fetchAll = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    try {
      const planEndpoint = versionId
        ? `/care-plan/version/${versionId}`
        : `/care-plan/patient/${patientId}/active`;
      const [patRes, actRes, verRes] = await Promise.allSettled([
        api.get(`/users/${patientId}`),
        api.get(planEndpoint),
        api.get(`/care-plan/patient/${patientId}`),
      ]);
      if (patRes.status === 'fulfilled') setPatient(patRes.value.data);
      if (actRes.status === 'fulfilled') setActive(actRes.value.data);
      if (verRes.status === 'fulfilled') setVersions(verRes.value.data ?? []);
    } finally {
      setLoading(false);
    }
  }, [patientId, versionId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Derived ───────────────────────────────────────────────────────────────

  const allTasks = active?.tasks ?? [];

  const sectioned = useMemo(() => {
    const base = catFilter === 'all' ? allTasks : allTasks.filter((t) => t.type === catFilter);
    return {
      active:    base.filter((t) => taskSection(t) === 'active'),
      upcoming:  base.filter((t) => taskSection(t) === 'upcoming'),
      missed:    base.filter((t) => taskSection(t) === 'missed'),
      completed: base.filter((t) => taskSection(t) === 'completed'),
      archived:  base.filter((t) => taskSection(t) === 'archived'),
    };
  }, [allTasks, catFilter]);

  const visible = useMemo(() => {
    if (statusFilter === 'all') return sectioned;
    const empty = { active: [], upcoming: [], missed: [], completed: [], archived: [] };
    return { ...empty, [statusFilter]: sectioned[statusFilter as keyof typeof sectioned] };
  }, [sectioned, statusFilter]);

  const coverage = coveragePct(allTasks);
  const ver = active?.version;

  const CAT_TABS: { id: CategoryFilter; label: string }[] = [
    { id: 'all',         label: 'All'           },
    { id: 'MEDICATION',  label: 'Medications'   },
    { id: 'LAB_TEST',    label: 'Tests & Scans' },
    { id: 'APPOINTMENT', label: 'Appointments'  },
  ];
  const STATUS_TABS: { id: StatusFilter; label: string }[] = [
    { id: 'all',       label: 'Active'    },
    { id: 'upcoming',  label: 'Upcoming'  },
    { id: 'completed', label: 'Completed' },
    { id: 'missed',    label: 'Missed'    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <p className="text-sm text-muted-foreground">Loading care plan…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC] overflow-hidden">

      {/* ── Patient header ─────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-border flex-shrink-0">
        {/* Back nav */}
        <div className="px-6 pt-3 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Patients
          </button>
          {isHistorical && (
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
                Historical version — read only
              </span>
              <button
                onClick={() => navigate(`/nav/care-plans/${patientId}`)}
                className="text-xs text-primary hover:underline font-medium"
              >
                View current plan →
              </button>
            </div>
          )}
        </div>

        {/* Patient info */}
        <div className="px-6 py-4 flex items-center gap-5 flex-wrap">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold flex-shrink-0">
            {patient ? initials(patient.name) : '?'}
          </div>

          {/* Name / meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-semibold text-foreground">{patient?.name ?? '—'}</h1>
              {ver?.status === 'ACTIVE' && (
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-green-100 text-green-700">Active</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap mt-0.5">
              {patient?.patientCode && <span>{patient.patientCode}</span>}
              {patient?.cancerType  && <><span className="text-border">·</span><span>{patient.cancerType}</span></>}
              {patient?.cancerStage && <><span className="text-border">·</span><span>Stage {patient.cancerStage}</span></>}
              {patient?.gender      && <><span className="text-border">·</span><span className="capitalize">{patient.gender}</span></>}
              {patient?.age         && <><span className="text-border">·</span><span>{patient.age} yrs</span></>}
            </div>
          </div>

          {/* Doctor */}
          {patient?.doctorName && (
            <div className="hidden md:block">
              <p className="text-xs text-muted-foreground">Primary Oncologist</p>
              <p className="text-sm font-medium text-foreground">{patient.doctorName}</p>
            </div>
          )}

          {/* Phone */}
          {patient?.phone && (
            <div className="hidden md:block">
              <p className="text-xs text-muted-foreground">Phone</p>
              <p className="text-sm font-medium text-foreground">+91 {patient.phone}</p>
            </div>
          )}

          {/* Right: version info */}
          <div className="flex items-center gap-5 ml-auto flex-shrink-0">
            {ver && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Active Plan</p>
                <p className="text-2xl font-bold text-primary">v{ver.versionNumber}</p>
              </div>
            )}
            {ver?.publishedAt && (
              <div className="text-right hidden lg:block">
                <p className="text-xs text-muted-foreground">Published on</p>
                <p className="text-sm font-medium text-foreground">{fmtDateTime(ver.publishedAt)}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Stat cards ────────────────────────────────────────────────────── */}
      <div className="px-6 py-4 flex-shrink-0 space-y-3">
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Active',          sub: 'Currently ongoing', value: sectioned.active.length,    numColor: 'text-green-600',  Icon: CheckCircle2, iconBg: 'bg-green-100 text-green-600'  },
            { label: 'Upcoming',        sub: 'Next 30 days',      value: sectioned.upcoming.length,  numColor: 'text-amber-600',  Icon: CalendarDays, iconBg: 'bg-amber-100 text-amber-600'  },
            { label: 'Completed',       sub: 'Past tasks',        value: sectioned.completed.length, numColor: 'text-blue-600',   Icon: CheckCircle2, iconBg: 'bg-blue-100 text-blue-600'    },
            { label: 'Missed / Overdue',sub: 'Needs attention',   value: sectioned.missed.length,    numColor: 'text-destructive',Icon: CircleAlert,  iconBg: 'bg-red-100 text-destructive'   },
          ].map(({ label, sub, value, numColor, Icon, iconBg }) => (
            <div key={label} className="bg-white rounded-lg border border-border p-4 flex items-center gap-4">
              <div className={cn('w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0', iconBg)}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className={cn('text-2xl font-bold leading-none', numColor)}>{value}</p>
                <p className="text-sm font-medium text-foreground mt-0.5">{label}</p>
                <p className="text-xs text-muted-foreground">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filter row */}
        <div className="bg-white rounded-lg border border-border px-4 py-2.5 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1">
            {CAT_TABS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setCatFilter(id)}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                  catFilter === id ? 'bg-[#0D4035] text-white' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="w-px h-5 bg-border" />
          <div className="flex items-center gap-1">
            {STATUS_TABS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setStatusFilter(statusFilter === id ? 'all' : id)}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                  statusFilter === id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Timeline + sidebar ─────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden px-6 pb-4 gap-5">

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto">
          {/* Timeline header */}
          {allTasks.length > 0 && (
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Care Plan Timeline</span>
              <div className="flex items-center gap-1.5 bg-[#0D4035] text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                <span>TODAY</span>
              </div>
              <span className="text-sm text-muted-foreground">{todayLabel()}</span>
            </div>
          )}

          {!active && (
            <div className="flex flex-col items-center justify-center h-48 bg-white rounded-lg border border-border">
              <FileText className="w-10 h-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-foreground">No active care plan</p>
              <p className="text-xs text-muted-foreground mt-1">Upload a document in Care Plan Updates to create one.</p>
            </div>
          )}

          <div className="space-y-6">
            {/* ACTIVE NOW */}
            {visible.active.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Active Now</span>
                  <span className="text-xs text-muted-foreground">({visible.active.length})</span>
                </div>
                <div className="space-y-2.5 pl-5 border-l-2 border-green-200">
                  {visible.active.map((t) => <TaskCard key={t._id} task={t} section="active" />)}
                </div>
              </section>
            )}

            {/* UPCOMING */}
            {visible.upcoming.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Upcoming</span>
                  <span className="text-xs text-muted-foreground">({visible.upcoming.length})</span>
                </div>
                <div className="space-y-2.5 pl-5 border-l-2 border-amber-200">
                  {visible.upcoming.map((t) => <TaskCard key={t._id} task={t} section="upcoming" />)}
                </div>
              </section>
            )}

            {/* MISSED / OVERDUE */}
            {visible.missed.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-destructive" />
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Missed / Overdue</span>
                  <span className="text-xs text-muted-foreground">({visible.missed.length})</span>
                </div>
                <div className="space-y-2.5 pl-5 border-l-2 border-red-200">
                  {visible.missed.map((t) => <TaskCard key={t._id} task={t} section="missed" />)}
                </div>
              </section>
            )}

            {/* COMPLETED */}
            {sectioned.completed.length > 0 && (statusFilter === 'all' || statusFilter === 'completed') && (
              <CollapsibleRow
                icon={CheckCircle2}
                label="Completed"
                count={sectioned.completed.length}
                open={showCompleted}
                onToggle={() => setShowCompleted((v) => !v)}
              >
                {sectioned.completed.map((t) => <TaskCard key={t._id} task={t} section="completed" />)}
              </CollapsibleRow>
            )}

            {/* ARCHIVED */}
            {sectioned.archived.length > 0 && statusFilter === 'all' && (
              <CollapsibleRow
                icon={History}
                label="Archived"
                count={sectioned.archived.length}
                open={showArchived}
                onToggle={() => setShowArchived((v) => !v)}
              >
                {sectioned.archived.map((t) => <TaskCard key={t._id} task={t} section="archived" />)}
              </CollapsibleRow>
            )}
          </div>
        </div>

        {/* ── Sidebar ──────────────────────────────────────────────────────── */}
        <aside className="w-72 flex-shrink-0 overflow-y-auto space-y-4 pb-2">

          {/* Care Plan Coverage */}
          {allTasks.length > 0 && (
            <div className="bg-white rounded-lg border border-border p-5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Care Plan Coverage</p>
              <div className="flex items-center justify-between mb-2">
                <span className={cn(
                  'text-3xl font-bold',
                  coverage >= 75 ? 'text-green-600' : coverage >= 50 ? 'text-amber-600' : 'text-destructive',
                )}>
                  {coverage}%
                </span>
                <span className={cn(
                  'text-xs font-medium px-2.5 py-1 rounded-full',
                  coverage >= 75 ? 'bg-green-100 text-green-700' : coverage >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700',
                )}>
                  {coverage >= 75 ? 'On track' : coverage >= 50 ? 'At risk' : 'Off track'}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all', coverage >= 75 ? 'bg-green-500' : coverage >= 50 ? 'bg-amber-400' : 'bg-destructive')}
                  style={{ width: `${coverage}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
                <span>{sectioned.completed.length} completed</span>
                <span>{allTasks.filter((t) => !['CANCELLED', 'REPLACED'].includes(t.status)).length} total</span>
              </div>
            </div>
          )}

          {/* Care Plan Summary */}
          {ver && (
            <div className="bg-white rounded-lg border border-border p-5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Care Plan Summary</p>
              <div className="space-y-3">
                {[
                  { label: 'Plan Status',     value: ver.status,               valueClass: ver.status === 'ACTIVE' ? 'text-green-600 font-semibold' : 'text-foreground' },
                  { label: 'Current Version', value: `v${ver.versionNumber}`,  valueClass: 'text-primary font-semibold' },
                  { label: 'Published On',    value: fmtDateTime(ver.publishedAt), valueClass: 'text-foreground' },
                  { label: 'Last Updated',    value: fmtDate(ver.updatedAt),   valueClass: 'text-foreground' },
                  { label: 'Next Review',     value: fmtDate(ver.nextReviewDate), valueClass: 'text-foreground' },
                ].map(({ label, value, valueClass }) => (
                  <div key={label} className="flex items-start justify-between gap-2">
                    <span className="text-xs text-muted-foreground">{label}</span>
                    <span className={cn('text-xs text-right', valueClass)}>{value}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Visible to Patient</span>
                  <div className="flex items-center gap-1.5">
                    {ver.visibleToPatient
                      ? <><Eye className="w-3.5 h-3.5 text-green-600" /><span className="text-xs font-semibold text-green-600">Yes</span></>
                      : <><EyeOff className="w-3.5 h-3.5 text-muted-foreground" /><span className="text-xs text-muted-foreground">No</span></>
                    }
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Latest Updates */}
          {ver?.versionDiff && ver.versionDiff.length > 0 && (
            <div className="bg-white rounded-lg border border-border p-5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">Latest Updates</p>
              {ver.versionNumber > 1 && (
                <p className="text-xs text-muted-foreground mb-3">from v{ver.versionNumber - 1} to v{ver.versionNumber}</p>
              )}
              <div className="space-y-2">
                {ver.versionDiff.map((entry, i) => {
                  const cfg = DIFF_CONFIG[entry.changeType];
                  return (
                    <div key={i} className={cn('flex items-start gap-2 p-2 rounded-md border', cfg.bg)}>
                      <cfg.Icon className={cn('w-3.5 h-3.5 flex-shrink-0 mt-0.5', cfg.colorClass)} />
                      <div className="min-w-0">
                        <p className={cn('text-xs font-medium', cfg.colorClass)}>{entry.title}</p>
                        {entry.changeType === 'CHANGED' && entry.previousValue && entry.currentValue && (
                          <p className="text-xs text-muted-foreground mt-0.5">{entry.previousValue} → {entry.currentValue}</p>
                        )}
                        {entry.changeType !== 'CHANGED' && entry.currentValue && (
                          <p className="text-xs text-muted-foreground mt-0.5">{entry.currentValue}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Prescription / Version History */}
          {versions.length > 0 && (
            <div className="bg-white rounded-lg border border-border p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Prescription History</p>
                {versions.length > 4 && (
                  <button
                    onClick={() => setShowAllVersions(s => !s)}
                    className="text-xs text-primary hover:underline"
                  >
                    {showAllVersions ? 'Show less' : `View all ${versions.length} versions`}
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {(showAllVersions ? versions : versions.slice(0, 4)).map((v, i) => (
                  <div key={v._id} className="flex items-start gap-3">
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className={cn('w-2.5 h-2.5 rounded-full mt-0.5', i === 0 ? 'bg-green-500' : i === 1 ? 'bg-primary/60' : 'bg-muted-foreground/30')} />
                      {i < Math.min(versions.length, 4) - 1 && <div className="w-px h-6 bg-border mt-1" />}
                    </div>
                    <div className="flex-1 min-w-0 pb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{fmtDate(v.publishedAt)}</span>
                        <span className="text-xs font-semibold text-foreground bg-muted px-1.5 py-0.5 rounded">v{v.versionNumber}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Activity className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        <p className="text-xs text-foreground truncate">{v.notes || `Care plan v${v.versionNumber}`}</p>
                      </div>
                      <button
                        onClick={() => navigate(`/nav/care-plans/${patientId}/version/${v._id}`)}
                        className="text-xs text-primary hover:underline mt-0.5 inline-block"
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
