import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, AlertTriangle, TrendingUp, TrendingDown, Minus,
  ChevronLeft, ChevronRight, MoreHorizontal, Phone, Activity,
  CircleAlert, CheckCircle2, SlidersHorizontal, ChevronDown, Pill,
  Users2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

// ── Types ─────────────────────────────────────────────────────────────────────

interface CurrentRisk {
  description: string;
  detail: string;
  badgeText: string;
  badgeLevel: 'high' | 'medium' | 'low' | 'appointment' | 'none';
}

interface LastActivity {
  responded: boolean;
  lastActiveAt: string | null;
  lastActivityDate: string | null;
  daysAgo: number | null;
}

interface InterventionStatus {
  label: string;
  detail: string;
  level: 'escalated' | 'follow-up' | 'pending' | 'monitoring';
}

interface AdherencePatientRow {
  patientId: string;
  name: string;
  patientCode: string;
  cancerType?: string;
  cancerStage?: string;
  acuityScore: number;
  adherenceRate: number;
  trend: 'improving' | 'stable' | 'declining';
  weeklyAdherenceRate: number;
  dailyRates: number[];
  currentRisk: CurrentRisk;
  lastActivity: LastActivity;
  interventionStatus: InterventionStatus;
}

interface AdherenceSummary {
  needIntervention: number;
  criticalRisk: number;
  missedFollowups: number;
  improving: number;
  overallAdherenceRate: number;
}

interface Distribution {
  excellent: number;
  good: number;
  fair: number;
  poor: number;
}

interface AdherenceOverviewResponse {
  total: number;
  page: number;
  pageSize: number;
  summary: AdherenceSummary;
  distribution: Distribution;
  topMissedMedications: { taskTitle: string; count: number }[];
  items: AdherencePatientRow[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

const FILTER_TABS = [
  { id: 'all',               label: 'All Patients',       countKey: null                   },
  { id: 'needs_intervention', label: 'Needs Intervention', countKey: 'needIntervention'     },
  { id: 'critical_misses',   label: 'Critical Misses',    countKey: 'criticalRisk'         },
  { id: 'missed_followups',  label: 'Missed Follow-ups',  countKey: 'missedFollowups'      },
  { id: 'declining',         label: 'Declining',          countKey: null                   },
  { id: 'improving',         label: 'Improving',          countKey: 'improving'            },
  { id: 'no_activity',       label: 'No Activity',        countKey: null                   },
  { id: 'resolved',          label: 'Resolved',           countKey: null                   },
] as const;

const RISK_BADGE: Record<CurrentRisk['badgeLevel'], string> = {
  high:        'bg-red-100 text-red-700',
  medium:      'bg-amber-100 text-amber-700',
  low:         'bg-yellow-100 text-yellow-700',
  appointment: 'bg-violet-100 text-violet-700',
  none:        'bg-emerald-100 text-emerald-700',
};

const INTERVENTION_BADGE: Record<InterventionStatus['level'], { bg: string; dot: string }> = {
  escalated:  { bg: 'bg-red-100 text-red-700',    dot: 'bg-red-500'    },
  'follow-up':{ bg: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  pending:    { bg: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  monitoring: { bg: 'bg-gray-100 text-gray-600',   dot: 'bg-gray-400'  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string): string {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
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

function formatDaysAgo(daysAgo: number | null): string {
  if (daysAgo === null) return 'Never';
  if (daysAgo === 0) return 'Today';
  if (daysAgo === 1) return 'Yesterday';
  return `${daysAgo}d ago`;
}

// ── Sparkline (pure SVG, 7-day daily rates) ───────────────────────────────────

function Sparkline({ rates, patientId }: { rates: number[]; patientId: string }) {
  const W = 80, H = 28, PAD = 3;

  const validPoints = rates
    .map((r, i) => r >= 0 ? { x: PAD + (i / (rates.length - 1)) * (W - PAD * 2), y: PAD + (1 - r / 100) * (H - PAD * 2) } : null);

  const points = validPoints.filter(Boolean) as { x: number; y: number }[];

  if (points.length === 0) {
    return (
      <svg width={W} height={H}>
        <line x1={PAD} y1={H / 2} x2={W - PAD} y2={H / 2} stroke="#e5e7eb" strokeWidth={1.5} strokeDasharray="3,2" />
        <text x={W / 2} y={H / 2 + 4} textAnchor="middle" fontSize="7" fill="#9ca3af">No data</text>
      </svg>
    );
  }

  const lastValid = [...rates].reverse().find((r) => r >= 0) ?? 0;
  const lineColor = lastValid >= 80 ? '#22c55e' : lastValid >= 50 ? '#f59e0b' : '#ef4444';
  const lastPt = points[points.length - 1];

  const polylineStr = points.map((p) => `${p.x},${p.y}`).join(' ');
  const areaPath = [
    `M ${points[0].x},${H}`,
    ...points.map((p) => `L ${p.x},${p.y}`),
    `L ${lastPt.x},${H}`,
    'Z',
  ].join(' ');

  const gradId = `spark-${patientId}`;

  return (
    <svg width={W} height={H}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lineColor} stopOpacity="0.25" />
          <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <polyline points={polylineStr} fill="none" stroke={lineColor} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lastPt.x} cy={lastPt.y} r={2.5} fill={lineColor} />
    </svg>
  );
}

// ── Donut chart (pure SVG, distribution breakdown) ────────────────────────────

function DonutChart({ distribution, overallRate }: { distribution: Distribution; overallRate: number }) {
  const segments = [
    { value: distribution.excellent, color: '#22c55e' },
    { value: distribution.good,      color: '#3b82f6' },
    { value: distribution.fair,      color: '#f59e0b' },
    { value: distribution.poor,      color: '#ef4444' },
  ];
  const total = segments.reduce((s, g) => s + g.value, 0);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-28">
        <p className="text-xs text-gray-400">No patient data</p>
      </div>
    );
  }

  const CX = 56, CY = 56, R = 42, IR = 26;
  let angle = -Math.PI / 2;

  const arcs = segments
    .filter((s) => s.value > 0)
    .map((seg) => {
      const sweep = (seg.value / total) * 2 * Math.PI;
      const x1 = CX + R * Math.cos(angle);
      const y1 = CY + R * Math.sin(angle);
      angle += sweep;
      const x2 = CX + R * Math.cos(angle);
      const y2 = CY + R * Math.sin(angle);
      const xi1 = CX + IR * Math.cos(angle - sweep);
      const yi1 = CY + IR * Math.sin(angle - sweep);
      const xi2 = CX + IR * Math.cos(angle);
      const yi2 = CY + IR * Math.sin(angle);
      const large = sweep > Math.PI ? 1 : 0;
      const d = `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${IR} ${IR} 0 ${large} 0 ${xi1} ${yi1} Z`;
      return { d, color: seg.color };
    });

  const rateColor = overallRate >= 90 ? '#22c55e' : overallRate >= 75 ? '#3b82f6' : overallRate >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width="112" height="112" viewBox="0 0 112 112">
        {arcs.map((a, i) => (
          <path key={i} d={a.d} fill={a.color} opacity="0.9" />
        ))}
        <circle cx={CX} cy={CY} r={IR - 2} fill="white" />
        <text x={CX} y={CY - 3} textAnchor="middle" fontSize="13" fontWeight="700" fill={rateColor}>
          {overallRate}%
        </text>
        <text x={CX} y={CY + 9} textAnchor="middle" fontSize="7.5" fill="#9ca3af">
          Overall
        </text>
      </svg>

      <div className="w-full space-y-1.5">
        {[
          { label: 'Excellent (≥90%)', value: distribution.excellent, color: 'bg-green-500' },
          { label: 'Good (75–89%)',    value: distribution.good,      color: 'bg-blue-500'  },
          { label: 'Fair (50–74%)',    value: distribution.fair,      color: 'bg-amber-400' },
          { label: 'Poor (<50%)',      value: distribution.poor,      color: 'bg-red-500'   },
        ].map(({ label, value, color }) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${color}`} />
            <span className="text-xs text-gray-500 flex-1 leading-tight">{label}</span>
            <span className="text-xs font-semibold text-gray-800 tabular-nums">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon, iconClass, value, label, sub,
}: {
  icon: React.ElementType; iconClass: string; value: number | string; label: string; sub: string;
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

// ── Main page ─────────────────────────────────────────────────────────────────

export function NavAdherenceMonitoringPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState<AdherenceOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [openKebab, setOpenKebab] = useState<string | null>(null);

  useEffect(() => {
    if (!user?._id) return;
    setLoading(true);
    api
      .get(`/reminders/navigator/${user._id}/overview`, { params: { page, limit: PAGE_SIZE, tab } })
      .then((r) => setData(r.data as AdherenceOverviewResponse))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?._id, page, tab]);

  const displayed = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q || !data) return data?.items ?? [];
    return data.items.filter(
      (r) => r.name.toLowerCase().includes(q) || r.patientCode.toLowerCase().includes(q),
    );
  }, [data, search]);

  const summary = data?.summary;
  const totalPages = Math.ceil((data?.total ?? 0) / PAGE_SIZE);

  function handleTab(id: string) {
    setTab(id);
    setPage(1);
    setSearch('');
  }

  function tabCount(countKey: string | null): number | null {
    if (!countKey || !summary) return null;
    return (summary as unknown as Record<string, number>)[countKey] ?? null;
  }

  return (
    <div
      className="flex flex-col h-screen bg-gray-50 overflow-hidden"
      onClick={() => setOpenKebab(null)}
    >

      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 px-8 pt-6 pb-0 flex-shrink-0">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Adherence Monitoring</h1>
            <p className="text-sm text-gray-500 mt-0.5">Medication and task adherence across your patient panel</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search patient…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 w-56"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 rounded-lg bg-white hover:bg-gray-50 text-gray-600">
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-0 overflow-x-auto">
          {FILTER_TABS.map(({ id, label, countKey }) => {
            const count = tabCount(countKey);
            const active = tab === id;
            return (
              <button
                key={id}
                onClick={() => handleTab(id)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors flex items-center gap-1.5 ${
                  active
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
                }`}
              >
                {label}
                {count !== null && count > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                    active ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Stat cards ────────────────────────────────────────────────────── */}
      <div className="px-8 py-4 flex-shrink-0">
        <div className="grid grid-cols-5 gap-4">
          <StatCard
            icon={AlertTriangle}
            iconClass="bg-red-100 text-red-600"
            value={summary?.needIntervention ?? '—'}
            label="Need Intervention"
            sub="Follow-up or escalated"
          />
          <StatCard
            icon={CircleAlert}
            iconClass="bg-rose-100 text-rose-600"
            value={summary?.criticalRisk ?? '—'}
            label="Critical Risk"
            sub="High-risk medication missed"
          />
          <StatCard
            icon={Phone}
            iconClass="bg-amber-100 text-amber-600"
            value={summary?.missedFollowups ?? '—'}
            label="Missed Follow-ups"
            sub="Pending caregiver calls"
          />
          <StatCard
            icon={TrendingUp}
            iconClass="bg-green-100 text-green-600"
            value={summary?.improving ?? '—'}
            label="Improving"
            sub="Better than last week"
          />
          <StatCard
            icon={Activity}
            iconClass="bg-blue-100 text-blue-600"
            value={summary ? `${summary.overallAdherenceRate}%` : '—'}
            label="Overall Adherence"
            sub="Panel average"
          />
        </div>
      </div>

      {/* ── Content: table + sidebar ───────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden px-8 pb-0 gap-5">

        {/* Table */}
        <div className="flex-1 overflow-auto bg-white rounded-xl border border-gray-100 shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-sm text-gray-400">Loading adherence data…</p>
            </div>
          ) : displayed.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <CheckCircle2 className="w-10 h-10 text-green-400 mb-3" />
              <p className="text-sm font-medium text-gray-700">No patients in this category</p>
              <p className="text-xs text-gray-400 mt-1">Try a different filter or search term</p>
            </div>
          ) : (
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-[22%]">Patient</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-[22%]">Current Risk</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-[15%]">Trend (7 Days)</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-[16%]">Last Activity</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-[18%]">Intervention Status</th>
                  <th className="px-5 py-3 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {displayed.map((row) => (
                  <PatientRow
                    key={row.patientId}
                    row={row}
                    openKebab={openKebab}
                    setOpenKebab={setOpenKebab}
                    onNavigate={() => navigate(`/nav/care-plans/${row.patientId}`)}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Sidebar */}
        <aside className="w-72 flex-shrink-0 overflow-y-auto space-y-4 pb-4">
          {/* Adherence Overview */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Adherence Overview</h3>
            <DonutChart
              distribution={data?.distribution ?? { excellent: 0, good: 0, fair: 0, poor: 0 }}
              overallRate={summary?.overallAdherenceRate ?? 0}
            />
          </div>

          {/* Key Insights */}
          {summary && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Key Insights</h3>
              <div className="space-y-2.5">
                {summary.needIntervention > 0 && (
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-600">
                      <span className="font-semibold text-red-600">{summary.needIntervention}</span> patient{summary.needIntervention !== 1 ? 's' : ''} need{summary.needIntervention === 1 ? 's' : ''} immediate follow-up
                    </p>
                  </div>
                )}
                {summary.criticalRisk > 0 && (
                  <div className="flex items-start gap-2.5">
                    <CircleAlert className="w-3.5 h-3.5 text-rose-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-600">
                      <span className="font-semibold text-rose-600">{summary.criticalRisk}</span> patient{summary.criticalRisk !== 1 ? 's' : ''} missed high-risk medication this week
                    </p>
                  </div>
                )}
                {summary.improving > 0 && (
                  <div className="flex items-start gap-2.5">
                    <TrendingUp className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-600">
                      <span className="font-semibold text-green-600">{summary.improving}</span> patient{summary.improving !== 1 ? 's' : ''} improving compared to last week
                    </p>
                  </div>
                )}
                {summary.needIntervention === 0 && summary.criticalRisk === 0 && (
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-600">Panel adherence looks healthy — no urgent interventions needed</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <button
                onClick={() => handleTab('needs_intervention')}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 transition-colors text-left"
              >
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                View patients needing intervention
              </button>
              <button
                onClick={() => handleTab('critical_misses')}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors text-left"
              >
                <CircleAlert className="w-3.5 h-3.5 flex-shrink-0" />
                View critical medication misses
              </button>
              <button
                onClick={() => handleTab('no_activity')}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
              >
                <Users2 className="w-3.5 h-3.5 flex-shrink-0" />
                View inactive patients
              </button>
            </div>
          </div>

          {/* Top Missed Medications */}
          {(data?.topMissedMedications ?? []).length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Top Missed Medications</h3>
              <div className="space-y-2.5">
                {data!.topMissedMedications.map(({ taskTitle, count }, i) => (
                  <div key={taskTitle} className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Pill className="w-3 h-3 text-gray-500" />
                    </div>
                    <span className="text-xs text-gray-700 flex-1 truncate">{taskTitle}</span>
                    <span className={`text-xs font-semibold tabular-nums ${i === 0 ? 'text-red-600' : 'text-gray-500'}`}>
                      {count}×
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* ── Pagination ────────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="bg-white border-t border-gray-100 px-8 py-3 flex items-center justify-between flex-shrink-0">
          <p className="text-sm text-gray-500">
            Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, data?.total ?? 0)} of {data?.total ?? 0} patients
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const p = totalPages <= 7 ? i + 1 : page <= 4 ? i + 1 : page >= totalPages - 3 ? totalPages - 6 + i : page - 3 + i;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                    p === page
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Patient table row ─────────────────────────────────────────────────────────

function TrendIndicator({ trend, weeklyRate }: { trend: AdherencePatientRow['trend']; weeklyRate: number }) {
  const cfg = {
    improving: { Icon: TrendingUp,   color: 'text-green-600', bg: 'bg-green-50' },
    stable:    { Icon: Minus,        color: 'text-gray-500',  bg: 'bg-gray-50'  },
    declining: { Icon: TrendingDown, color: 'text-red-500',   bg: 'bg-red-50'   },
  }[trend];
  return (
    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
      <cfg.Icon className="w-3 h-3" />
      {weeklyRate}%
    </div>
  );
}

function PatientRow({
  row, openKebab, setOpenKebab, onNavigate,
}: {
  row: AdherencePatientRow;
  openKebab: string | null;
  setOpenKebab: (id: string | null) => void;
  onNavigate: () => void;
}) {
  const isKebabOpen = openKebab === row.patientId;

  return (
    <tr className="hover:bg-gray-50/60 group">
      {/* Patient */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 cursor-pointer ${avatarColor(row.name)}`}
            onClick={onNavigate}
          >
            {initials(row.name)}
          </div>
          <div className="min-w-0">
            <button
              onClick={onNavigate}
              className="text-sm font-semibold text-gray-900 hover:text-blue-600 text-left truncate block max-w-[160px]"
            >
              {row.name}
            </button>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs text-gray-400">{row.patientCode}</span>
              {row.cancerType && (
                <span className="text-xs text-gray-400 truncate">· {row.cancerType}{row.cancerStage ? ` ${row.cancerStage}` : ''}</span>
              )}
            </div>
          </div>
        </div>
      </td>

      {/* Current Risk */}
      <td className="px-5 py-3.5">
        <div className="space-y-1">
          <span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full ${RISK_BADGE[row.currentRisk.badgeLevel]}`}>
            {row.currentRisk.badgeText}
          </span>
          <p className="text-xs text-gray-600 leading-tight">{row.currentRisk.description}</p>
          <p className="text-xs text-gray-400">{row.currentRisk.detail}</p>
        </div>
      </td>

      {/* Trend */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <Sparkline rates={row.dailyRates} patientId={row.patientId} />
          <TrendIndicator trend={row.trend} weeklyRate={row.weeklyAdherenceRate} />
        </div>
      </td>

      {/* Last Activity */}
      <td className="px-5 py-3.5">
        <div className="space-y-0.5">
          <p className={`text-sm font-medium ${row.lastActivity.responded ? 'text-gray-800' : 'text-gray-400'}`}>
            {formatDaysAgo(row.lastActivity.daysAgo)}
          </p>
          {row.lastActivity.responded ? (
            <p className="text-xs text-green-600 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Responded within 72h
            </p>
          ) : (
            <p className="text-xs text-amber-600">
              {row.lastActivity.daysAgo !== null ? 'No recent response' : 'Never responded'}
            </p>
          )}
        </div>
      </td>

      {/* Intervention Status */}
      <td className="px-5 py-3.5">
        <div className="space-y-1">
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${INTERVENTION_BADGE[row.interventionStatus.level].bg}`}>
            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${INTERVENTION_BADGE[row.interventionStatus.level].dot}`} />
            {row.interventionStatus.label}
          </div>
          <p className="text-xs text-gray-400">{row.interventionStatus.detail}</p>
        </div>
      </td>

      {/* Action */}
      <td className="px-5 py-3.5 relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setOpenKebab(isKebabOpen ? null : row.patientId);
          }}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
        {isKebabOpen && (
          <div
            className="absolute right-4 top-10 z-10 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 w-44"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => { onNavigate(); setOpenKebab(null); }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              View Care Plan
            </button>
            <button
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => setOpenKebab(null)}
            >
              Log Follow-up
            </button>
            <button
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              onClick={() => setOpenKebab(null)}
            >
              Escalate
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}
