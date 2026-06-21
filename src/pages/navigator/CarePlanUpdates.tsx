import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Bell,
  Info,
  Clock,
  Loader2,
  CheckCircle2,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { MetricsBar } from '@/components/navigator/MetricsBar';
import { TaskTypePill } from '@/components/navigator/TaskTypePill';
import { ReviewDrawer, type ReviewBatchDetail } from '@/components/navigator/ReviewDrawer';
import { type AiExtractedTask } from '@/components/navigator/TaskReviewCard';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Metrics {
  total: number;
  pending: number;
  inReview: number;
  reviewed: number;
}

interface TaskPill {
  name: string;
  taskType: string;
}

interface ReviewBatchSummary {
  _id: string;
  status: 'PENDING' | 'IN_REVIEW' | 'REVIEWED' | 'PUBLISHED';
  taskCount: number;
  verifiedCount: number;
  rejectedCount: number;
  updatedAt: string;
  hasLowConfidence: boolean;
  patient: {
    _id: string;
    name: string;
    patientCode: string;
    cancerType?: string;
    cancerStage?: string;
  };
  document: {
    _id: string;
    fileName: string;
    category: string;
    createdAt: string;
    fileSize?: number;
  };
  taskTypeCounts: { MEDICATION: number; LAB_TEST: number; APPOINTMENT: number; PROCEDURE: number };
  taskPills: TaskPill[];
}

type FilterKey =
  | 'all'
  | 'pending'
  | 'in_review'
  | 'reviewed'
  | 'medication'
  | 'appointment'
  | 'lab_test'
  | 'needs_verification';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',               label: 'All' },
  { key: 'pending',           label: 'Pending Review' },
  { key: 'in_review',         label: 'Partially Reviewed' },
  { key: 'reviewed',          label: 'Ready to Publish' },
  { key: 'medication',        label: 'Medication Updates' },
  { key: 'appointment',       label: 'New Appointments' },
  { key: 'lab_test',          label: 'New Lab Tests' },
  { key: 'needs_verification',label: 'Needs Verification' },
];

const CATEGORY_BADGE: Record<string, string> = {
  prescription: 'bg-blue-100 text-blue-700',
  discharge:    'bg-amber-100 text-amber-700',
  lab:          'bg-green-100 text-green-700',
  other:        'bg-slate-100 text-slate-700',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function StatusBadge({ status, verifiedCount, taskCount }: { status: string; verifiedCount: number; taskCount: number }) {
  const progress = taskCount > 0 ? (verifiedCount / taskCount) * 100 : 0;

  if (status === 'PENDING') {
    return (
      <div className="space-y-1.5">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full px-2.5 py-1">
          <Clock className="w-3 h-3" /> Pending Review
        </span>
        <div className="h-1 rounded-full bg-slate-100 w-full">
          <div className="h-1 rounded-full bg-slate-300" style={{ width: `${progress}%` }} />
        </div>
        <div className="text-xs text-muted-foreground">{verifiedCount}/{taskCount} reviewed</div>
      </div>
    );
  }
  if (status === 'IN_REVIEW') {
    return (
      <div className="space-y-1.5">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium border border-blue-300 text-blue-700 rounded-full px-2.5 py-1">
          <Loader2 className="w-3 h-3" /> Partially Reviewed
        </span>
        <div className="h-1 rounded-full bg-slate-100 w-full">
          <div className="h-1 rounded-full bg-blue-500" style={{ width: `${progress}%` }} />
        </div>
        <div className="text-xs text-muted-foreground">{verifiedCount}/{taskCount} reviewed</div>
      </div>
    );
  }
  return (
    <div className="space-y-1.5">
      <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-green-100 text-green-700 rounded-full px-2.5 py-1">
        <CheckCircle2 className="w-3 h-3" /> Ready to Publish
      </span>
      <div className="h-1 rounded-full bg-green-200 w-full">
        <div className="h-1 rounded-full bg-green-500 w-full" />
      </div>
      <div className="text-xs text-muted-foreground">{verifiedCount}/{taskCount} reviewed</div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

const LIMIT_OPTIONS = [10, 25, 50] as const;
type LimitOption = typeof LIMIT_OPTIONS[number];

export function NavCarePlanUpdatesPage() {
  const { user } = useAuth();
  const navigatorId = user?._id ?? '';

  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(true);

  const [batches, setBatches] = useState<ReviewBatchSummary[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [listLoading, setListLoading] = useState(true);

  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<LimitOption>(10);

  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);
  const [drawerDetail, setDrawerDetail] = useState<ReviewBatchDetail | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  const fetchMetrics = useCallback(async () => {
    if (!navigatorId) return;
    try {
      const res = await api.get(`/review-queue/navigator/${navigatorId}/metrics`);
      setMetrics(res.data);
    } finally {
      setMetricsLoading(false);
    }
  }, [navigatorId]);

  const fetchList = useCallback(async () => {
    if (!navigatorId) return;
    setListLoading(true);
    try {
      const res = await api.get(`/review-queue/navigator/${navigatorId}/summary`, {
        params: { filter: activeFilter, page, limit },
      });
      setBatches(res.data.batches);
      setTotalCount(res.data.total);
    } finally {
      setListLoading(false);
    }
  }, [navigatorId, activeFilter, page, limit]);

  useEffect(() => { fetchMetrics(); }, [fetchMetrics]);
  useEffect(() => { fetchList(); }, [fetchList]);

  async function openDrawer(batchId: string) {
    setActiveBatchId(batchId);
    setDrawerDetail(null);
    setDrawerLoading(true);
    try {
      const res = await api.get(`/review-queue/batch/${batchId}`);
      setDrawerDetail(res.data);
    } finally {
      setDrawerLoading(false);
    }
  }

  function closeDrawer() {
    setActiveBatchId(null);
    setDrawerDetail(null);
  }

  function handlePublished(batchId: string) {
    setBatches((prev) => prev.filter((b) => b._id !== batchId));
    setTotalCount((n) => Math.max(0, n - 1));
    closeDrawer();
    fetchMetrics();
  }

  function handleTaskUpdated(batchId: string, updatedTask: AiExtractedTask) {
    // Update the task inside the drawer detail
    setDrawerDetail((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        tasks: prev.tasks.map((t) => (t._id === updatedTask._id ? updatedTask : t)),
      };
    });

    // Update verifiedCount/rejectedCount on the batch row in the table
    setDrawerDetail((prev) => {
      if (!prev) return prev;
      const tasks = prev.tasks.map((t) => (t._id === updatedTask._id ? updatedTask : t));
      const verifiedCount = tasks.filter((t) => ['VERIFIED', 'EDITED'].includes(t.reviewStatus)).length;
      const rejectedCount = tasks.filter((t) => t.reviewStatus === 'REJECTED').length;
      const allActioned = verifiedCount + rejectedCount === tasks.length;
      setBatches((rows) =>
        rows.map((b) =>
          b._id === batchId
            ? {
                ...b,
                verifiedCount,
                rejectedCount,
                status: allActioned ? 'REVIEWED' : verifiedCount + rejectedCount > 0 ? 'IN_REVIEW' : b.status,
              }
            : b,
        ),
      );
      return { ...prev, tasks, batch: { ...prev.batch, verifiedCount, rejectedCount } };
    });

    fetchMetrics();
  }

  const drawerOpen = activeBatchId !== null;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));
  const showStart = (page - 1) * limit + 1;
  const showEnd = Math.min(page * limit, totalCount);

  function handleFilterChange(f: FilterKey) {
    setActiveFilter(f);
    setPage(1);
  }

  function handleLimitChange(l: LimitOption) {
    setLimit(l);
    setPage(1);
  }

  return (
    <div className="flex h-full overflow-hidden bg-[#F8FAFC]">
      {/* Main content — always full width; drawer floats over it */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Page header */}
        <div className="flex-shrink-0 bg-white border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-foreground">Care Plan Updates</h1>
                <Info className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Review and approve proposed changes from uploaded documents before they appear in the patient's care plan.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  className="pl-9 pr-4 h-9 rounded-md border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ring w-64"
                  placeholder="Search patient by name or ID..."
                />
              </div>
              <button className="relative p-2 rounded-md hover:bg-muted">
                <Bell className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Metrics */}
          <MetricsBar metrics={metrics} loading={metricsLoading} />

          {/* Filter chips */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {FILTERS.map((f) => {
              const count =
                f.key === 'all'      ? metrics?.total    :
                f.key === 'pending'  ? metrics?.pending  :
                f.key === 'in_review'? metrics?.inReview :
                f.key === 'reviewed' ? metrics?.reviewed : undefined;
              return (
                <button
                  key={f.key}
                  onClick={() => handleFilterChange(f.key)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-colors',
                    activeFilter === f.key
                      ? 'bg-primary-dark text-white border-primary-dark'
                      : 'bg-white text-muted-foreground border-border hover:border-foreground hover:text-foreground',
                  )}
                >
                  {f.label}
                  {count !== undefined && (
                    <span className={cn(
                      'text-xs rounded-full px-1.5 py-0.5',
                      activeFilter === f.key ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground',
                    )}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg border border-border overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[220px_200px_1fr_180px_160px_120px] gap-0 border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <div className="px-4 py-3">Patient</div>
              <div className="px-4 py-3">Document & Uploaded</div>
              <div className="px-4 py-3">Proposed Care Plan Changes</div>
              <div className="px-4 py-3">Review Status</div>
              <div className="px-4 py-3">Updated</div>
              <div className="px-4 py-3">Action</div>
            </div>

            {/* Rows */}
            {listLoading ? (
              <div className="divide-y divide-border">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="grid grid-cols-[220px_200px_1fr_180px_160px_120px] gap-0">
                    {[...Array(6)].map((__, j) => (
                      <div key={j} className="px-4 py-4">
                        <div className="h-4 bg-muted animate-pulse rounded" />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : batches.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground text-sm">
                No care plan updates found.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {batches.map((batch) => (
                  <div
                    key={batch._id}
                    onClick={() => openDrawer(batch._id)}
                    className={cn(
                      'grid grid-cols-[220px_200px_1fr_180px_160px_120px] gap-0 cursor-pointer hover:bg-muted/30 transition-colors',
                      activeBatchId === batch._id && 'bg-slate-50 border-l-2 border-primary-dark',
                    )}
                  >
                    {/* Patient */}
                    <div className="px-4 py-4 flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                        {initials(batch.patient.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">
                          {batch.patient.name}
                        </div>
                        <div className="text-xs text-muted-foreground">{batch.patient.patientCode}</div>
                        {batch.patient.cancerType && (
                          <div className="text-xs text-muted-foreground truncate">
                            {batch.patient.cancerType}
                            {batch.patient.cancerStage ? ` · ${batch.patient.cancerStage}` : ''}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Document */}
                    <div className="px-4 py-4">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xs font-medium text-foreground truncate">
                          {batch.document.fileName}
                        </span>
                      </div>
                      <span
                        className={cn(
                          'text-xs font-medium px-1.5 py-0.5 rounded capitalize',
                          CATEGORY_BADGE[batch.document.category] ?? CATEGORY_BADGE.other,
                        )}
                      >
                        {batch.document.category}
                      </span>
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatDate(batch.document.createdAt)}
                      </div>
                    </div>

                    {/* Changes (task pills) */}
                    <div className="px-4 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {(batch.taskPills ?? []).length > 0 ? (
                          <>
                            {(batch.taskPills ?? []).slice(0, 3).map((pill, i) => (
                              <TaskTypePill key={i} name={pill.name} taskType={pill.taskType} />
                            ))}
                            {batch.taskCount > 3 && (
                              <span className="text-xs text-muted-foreground self-center">
                                +{batch.taskCount - 3} more
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            {(batch.taskTypeCounts?.MEDICATION ?? 0) > 0 && (
                              <TaskTypePill name={`${batch.taskTypeCounts.MEDICATION} Medication${batch.taskTypeCounts.MEDICATION > 1 ? 's' : ''}`} taskType="MEDICATION" />
                            )}
                            {(batch.taskTypeCounts?.LAB_TEST ?? 0) > 0 && (
                              <TaskTypePill name={`${batch.taskTypeCounts.LAB_TEST} Lab Test${batch.taskTypeCounts.LAB_TEST > 1 ? 's' : ''}`} taskType="LAB_TEST" />
                            )}
                            {(batch.taskTypeCounts?.APPOINTMENT ?? 0) > 0 && (
                              <TaskTypePill name={`${batch.taskTypeCounts.APPOINTMENT} Appointment${batch.taskTypeCounts.APPOINTMENT > 1 ? 's' : ''}`} taskType="APPOINTMENT" />
                            )}
                            {(batch.taskTypeCounts?.PROCEDURE ?? 0) > 0 && (
                              <TaskTypePill name={`${batch.taskTypeCounts.PROCEDURE} Procedure${batch.taskTypeCounts.PROCEDURE > 1 ? 's' : ''}`} taskType="PROCEDURE" />
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Review Status */}
                    <div className="px-4 py-4">
                      <StatusBadge
                        status={batch.status}
                        verifiedCount={batch.verifiedCount}
                        taskCount={batch.taskCount}
                      />
                    </div>

                    {/* Updated */}
                    <div className="px-4 py-4 text-xs text-muted-foreground">
                      {formatDate(batch.updatedAt)}
                    </div>

                    {/* Action */}
                    <div className="px-4 py-4 flex items-start gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => openDrawer(batch._id)}
                        className="h-8 px-3 rounded-md bg-primary-dark text-white text-xs font-medium hover:bg-primary-darker transition-colors"
                      >
                        Review
                      </button>
                      <button className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {!listLoading && totalCount > 0 && (
            <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
              <span>Showing {showStart} to {showEnd} of {totalCount} updates</span>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="w-8 h-8 flex items-center justify-center rounded border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {(() => {
                    const pages: (number | '...')[] = [];
                    if (totalPages <= 7) {
                      for (let i = 1; i <= totalPages; i++) pages.push(i);
                    } else {
                      [1, 2, 3].forEach((n) => pages.push(n));
                      if (page > 4) pages.push('...');
                      if (page > 3 && page < totalPages - 2) pages.push(page);
                      if (page < totalPages - 3) pages.push('...');
                      [totalPages - 2, totalPages - 1, totalPages].forEach((n) => {
                        if (n > 3) pages.push(n);
                      });
                    }
                    return pages.map((p, i) =>
                      p === '...' ? (
                        <span key={`e-${i}`} className="w-8 h-8 flex items-center justify-center text-muted-foreground">
                          ...
                        </span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={cn(
                            'w-8 h-8 flex items-center justify-center rounded border text-sm',
                            page === p
                              ? 'bg-primary-dark text-white border-primary-dark'
                              : 'border-border hover:bg-muted',
                          )}
                        >
                          {p}
                        </button>
                      ),
                    );
                  })()}
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="w-8 h-8 flex items-center justify-center rounded border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs">Rows per page:</span>
                  <select
                    value={limit}
                    onChange={(e) => handleLimitChange(Number(e.target.value) as LimitOption)}
                    className="h-8 px-2 text-xs rounded border border-border bg-white"
                  >
                    {LIMIT_OPTIONS.map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right drawer — fixed overlay, does not affect table layout */}
      <div
        className={cn(
          'fixed right-0 top-0 h-screen w-[520px] z-40 shadow-2xl transition-transform duration-200',
          drawerOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <ReviewDrawer
          detail={drawerDetail}
          navigatorId={navigatorId}
          loading={drawerLoading}
          onClose={closeDrawer}
          onPublished={handlePublished}
          onTaskUpdated={handleTaskUpdated}
        />
      </div>
    </div>
  );
}
