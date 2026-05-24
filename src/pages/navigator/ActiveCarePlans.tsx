import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Bell, Users2, CircleAlert, CalendarDays, FileText,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  Pill, FlaskConical, Stethoscope, Building2,
  CheckCircle2, MoreHorizontal, SlidersHorizontal,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ActiveMedication {
  title: string;
  medicineName?: string;
  dosage?: string;
}

interface NextTask {
  type: string;
  title: string;
  dueDate: string;
}

interface CarePlanSummaryItem {
  patientId: string;
  name: string;
  patientCode: string;
  cancerType?: string;
  cancerStage?: string;
  acuityScore: number;
  treatmentStatus?: string;
  chemoSessionsCompleted?: number;
  chemoSessionsTotal?: number;
  versionId: string;
  versionNumber: number;
  lastUpdatedAt: string;
  publishedAt: string | null;
  activeMedications: ActiveMedication[];
  nextTask: NextTask | null;
  attentionItems: { count: number; label: string };
}

interface NavigatorSummary {
  activePatients: number;
  needAttention: number;
  upcomingThisWeek: number;
  recentlyUpdated: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const FILTER_TABS = [
  { id: 'all', label: 'All Active Plans' },
  { id: 'needs_attention', label: 'Needs Attention' },
  { id: 'recently_updated', label: 'Recently Updated' },
  { id: 'high_risk', label: 'High Risk' },
  { id: 'upcoming_this_week', label: 'Upcoming This Week' },
] as const;

const TASK_ICON: Record<string, React.ElementType> = {
  MEDICATION: Pill,
  LAB_TEST: FlaskConical,
  APPOINTMENT: CalendarDays,
  PROCEDURE: Stethoscope,
  VISIT: Building2,
};

const PAGE_SIZE = 20;

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function avatarColor(name: string): string {
  const colors = [
    'bg-emerald-100 text-emerald-700',
    'bg-blue-100 text-blue-700',
    'bg-purple-100 text-purple-700',
    'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700',
    'bg-cyan-100 text-cyan-700',
  ];
  let hash = 0;
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) % colors.length;
  return colors[hash];
}

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

function formatAbsolute(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function formatDue(dateStr: string): string {
  const diff = new Date(dateStr).getTime() - Date.now();
  const days = Math.ceil(diff / 86400000);
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `in ${days} days`;
}

function getTreatment(plan: CarePlanSummaryItem): {
  label: string;
  badge: string;
  badgeClass: string;
  drugs: string;
} {
  const { treatmentStatus, chemoSessionsCompleted, activeMedications } = plan;
  const drugs = activeMedications
    .map((m) => m.medicineName ?? m.title)
    .filter(Boolean)
    .join(' + ');

  if (treatmentStatus === 'chemo-radiation') {
    return {
      label: chemoSessionsCompleted ? `Chemo Cycle ${chemoSessionsCompleted}` : 'Chemotherapy',
      badge: 'Active',
      badgeClass: 'bg-emerald-100 text-emerald-700',
      drugs,
    };
  }
  if (treatmentStatus === 'post-treatment') {
    return {
      label: 'Post Surgery',
      badge: 'Recovery Phase',
      badgeClass: 'bg-blue-100 text-blue-700',
      drugs,
    };
  }
  if (treatmentStatus === 'awaiting-surgery') {
    return {
      label: 'Pre-Surgery',
      badge: 'Monitoring',
      badgeClass: 'bg-violet-100 text-violet-700',
      drugs,
    };
  }
  if (treatmentStatus === 'newly-diagnosed') {
    return {
      label: 'Initial Assessment',
      badge: 'Active',
      badgeClass: 'bg-emerald-100 text-emerald-700',
      drugs,
    };
  }
  return {
    label: activeMedications.length > 0 ? 'Active Treatment' : 'Active Surveillance',
    badge: activeMedications.length > 0 ? 'Active' : 'Monitoring',
    badgeClass: activeMedications.length > 0
      ? 'bg-emerald-100 text-emerald-700'
      : 'bg-violet-100 text-violet-700',
    drugs,
  };
}

function attentionConfig(plan: CarePlanSummaryItem): {
  dot: string;
  text: string;
  sub: string;
} {
  const { count, label } = plan.attentionItems;
  if (count === 0) return { dot: '', text: '', sub: '' };
  const isMissed = label.includes('missed');
  return {
    dot: isMissed ? 'bg-red-500' : 'bg-amber-400',
    text: label,
    sub: '',
  };
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  iconClass,
  value,
  label,
  sub,
}: {
  icon: React.ElementType;
  iconClass: string;
  value: number;
  label: string;
  sub: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4 shadow-sm">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${iconClass}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
        <p className="text-sm font-medium text-gray-700 mt-0.5">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

// ── Sort helper ───────────────────────────────────────────────────────────────

type SortKey = 'name' | 'lastUpdatedAt' | 'attentionItems';
type SortDir = 'asc' | 'desc';

function sortPlans(plans: CarePlanSummaryItem[], key: SortKey, dir: SortDir) {
  return [...plans].sort((a, b) => {
    let cmp = 0;
    if (key === 'name') cmp = a.name.localeCompare(b.name);
    else if (key === 'lastUpdatedAt')
      cmp = new Date(a.lastUpdatedAt).getTime() - new Date(b.lastUpdatedAt).getTime();
    else if (key === 'attentionItems') cmp = a.attentionItems.count - b.attentionItems.count;
    return dir === 'asc' ? cmp : -cmp;
  });
}

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ChevronUp className="w-3 h-3 text-gray-300 ml-1 inline" />;
  return sortDir === 'asc'
    ? <ChevronUp className="w-3 h-3 text-gray-600 ml-1 inline" />
    : <ChevronDown className="w-3 h-3 text-gray-600 ml-1 inline" />;
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function NavActiveCarePlansPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [plans, setPlans] = useState<CarePlanSummaryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<NavigatorSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('lastUpdatedAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Fetch summary stat cards
  useEffect(() => {
    if (!user?._id) return;
    api
      .get(`/care-plan/navigator/${user._id}/summary`)
      .then((r) => setSummary(r.data))
      .catch(() => {});
  }, [user?._id]);

  // Fetch paginated list
  useEffect(() => {
    if (!user?._id) return;
    setLoading(true);
    api
      .get(`/care-plan/navigator/${user._id}`, { params: { page, limit: PAGE_SIZE, tab } })
      .then((r) => {
        const data = r.data as { total: number; items: CarePlanSummaryItem[] };
        setTotal(data.total ?? 0);
        setPlans(data.items ?? []);
      })
      .finally(() => setLoading(false));
  }, [user?._id, page, tab]);

  // Client-side search + sort
  const displayed = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? plans.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.patientCode.toLowerCase().includes(q),
        )
      : plans;
    return sortPlans(filtered, sortKey, sortDir);
  }, [plans, search, sortKey, sortDir]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  }

  function handleTabChange(id: string) {
    setTab(id);
    setPage(1);
    setSearch('');
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 px-8 pt-6 pb-0 flex-shrink-0">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Active Care Plans</h1>
            <p className="text-sm text-gray-500 mt-0.5">Patients with published and active care plans</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search patient by name or ID..."
                className="pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 bg-white w-64 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 placeholder:text-gray-400"
              />
            </div>
            <button className="relative p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <Bell className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* ── Stat cards ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={Users2}
            iconClass="bg-emerald-50 text-emerald-600"
            value={summary?.activePatients ?? 0}
            label="Active Patients"
            sub="With active care plans"
          />
          <StatCard
            icon={CircleAlert}
            iconClass="bg-amber-50 text-amber-500"
            value={summary?.needAttention ?? 0}
            label="Need Attention"
            sub="Overdue or missed items"
          />
          <StatCard
            icon={CalendarDays}
            iconClass="bg-blue-50 text-blue-500"
            value={summary?.upcomingThisWeek ?? 0}
            label="Upcoming This Week"
            sub="Appointments / tests"
          />
          <StatCard
            icon={FileText}
            iconClass="bg-purple-50 text-purple-500"
            value={summary?.recentlyUpdated ?? 0}
            label="Recently Updated"
            sub="Care plans updated"
          />
        </div>

        {/* ── Filter tabs ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div className="flex gap-0">
            {FILTER_TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => handleTabChange(t.id)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  tab === t.id
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 pb-1">
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filters
            </button>
          </div>
        </div>
      </div>

      {/* ── Table area ──────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-100">
            <tr>
              <th
                className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer select-none"
                onClick={() => handleSort('name')}
              >
                Patient <SortIcon col="name" sortKey={sortKey} sortDir={sortDir} />
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Current Treatment
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Upcoming / Next
              </th>
              <th
                className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer select-none"
                onClick={() => handleSort('attentionItems')}
              >
                Attention <SortIcon col="attentionItems" sortKey={sortKey} sortDir={sortDir} />
              </th>
              <th
                className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer select-none"
                onClick={() => handleSort('lastUpdatedAt')}
              >
                Last Updated <SortIcon col="lastUpdatedAt" sortKey={sortKey} sortDir={sortDir} />
              </th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Action
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-50">
            {loading && (
              <tr>
                <td colSpan={6} className="py-20 text-center text-sm text-gray-400">
                  Loading care plans...
                </td>
              </tr>
            )}

            {!loading && displayed.length === 0 && (
              <tr>
                <td colSpan={6} className="py-20 text-center">
                  <Users2 className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-600">No active care plans</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Plans appear here after publishing from the Review Queue.
                  </p>
                </td>
              </tr>
            )}

            {displayed.map((plan) => {
              const treatment = getTreatment(plan);
              const attn = attentionConfig(plan);
              const TaskIcon = plan.nextTask ? (TASK_ICON[plan.nextTask.type] ?? Stethoscope) : null;

              return (
                <tr
                  key={plan.patientId}
                  className="hover:bg-gray-50/60 transition-colors group"
                >
                  {/* Patient */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${avatarColor(plan.name)}`}
                      >
                        {initials(plan.name)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{plan.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{plan.patientCode}</p>
                        {plan.cancerType && (
                          <p className="text-xs text-gray-400">
                            {plan.cancerType}
                            {plan.cancerStage && ` · ${plan.cancerStage}`}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Current Treatment */}
                  <td className="px-4 py-4 max-w-[200px]">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium text-gray-800 truncate">
                        {treatment.label}
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${treatment.badgeClass}`}>
                        {treatment.badge}
                      </span>
                    </div>
                    {treatment.drugs && (
                      <p className="text-xs text-gray-400 truncate max-w-[180px]">{treatment.drugs}</p>
                    )}
                  </td>

                  {/* Upcoming / Next */}
                  <td className="px-4 py-4">
                    {plan.nextTask && TaskIcon ? (
                      <div className="flex items-start gap-2">
                        <div className="w-7 h-7 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <TaskIcon className="w-3.5 h-3.5 text-gray-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800 truncate max-w-[150px]">
                            {plan.nextTask.title}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {formatDue(plan.nextTask.dueDate)}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatAbsolute(plan.nextTask.dueDate)}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>

                  {/* Attention */}
                  <td className="px-4 py-4">
                    {attn.dot ? (
                      <div className="flex items-start gap-2">
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${attn.dot}`} />
                        <p className="text-sm text-gray-700">{attn.text}</p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-emerald-600">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-sm">No issues</span>
                      </div>
                    )}
                  </td>

                  {/* Last Updated */}
                  <td className="px-4 py-4">
                    <p className="text-sm text-gray-700">{formatRelative(plan.lastUpdatedAt)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatAbsolute(plan.lastUpdatedAt)}</p>
                  </td>

                  {/* Action */}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => navigate(`/nav/care-plans/${plan.patientId}`)}
                        className="px-3.5 py-1.5 text-xs font-semibold text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors whitespace-nowrap"
                      >
                        Open Care Plan
                      </button>
                      <button className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors opacity-0 group-hover:opacity-100">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Pagination footer ────────────────────────────────────────────────── */}
      <div className="bg-white border-t border-gray-100 px-8 py-3 flex items-center justify-between flex-shrink-0">
        <p className="text-sm text-gray-500">
          {total === 0
            ? 'No patients'
            : `Showing ${(page - 1) * PAGE_SIZE + 1} to ${Math.min(page * PAGE_SIZE, total)} of ${total} patients`}
        </p>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="p-1.5 rounded-md border border-gray-200 text-gray-500 disabled:opacity-30 hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            const pg = i + 1;
            return (
              <button
                key={pg}
                onClick={() => setPage(pg)}
                className={`w-8 h-8 text-sm rounded-md border transition-colors ${
                  pg === page
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {pg}
              </button>
            );
          })}
          {totalPages > 7 && <span className="text-gray-400 text-sm px-1">...</span>}
          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages || totalPages === 0}
            className="p-1.5 rounded-md border border-gray-200 text-gray-500 disabled:opacity-30 hover:bg-gray-50 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
