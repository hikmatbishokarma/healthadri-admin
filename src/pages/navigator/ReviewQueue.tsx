import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, FileText, User, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface ReviewBatch {
  _id: string;
  status: string;
  taskCount: number;
  verifiedCount: number;
  rejectedCount: number;
  createdAt: string;
  patientId: {
    _id: string;
    name: string;
    patientCode: string;
    cancerType?: string;
  };
  documentId: {
    _id: string;
    fileName: string;
    category: string;
    createdAt: string;
  };
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
  IN_REVIEW: { label: 'In Review', className: 'bg-blue-100 text-blue-800' },
  REVIEWED: { label: 'Reviewed', className: 'bg-green-100 text-green-800' },
  PUBLISHED: { label: 'Published', className: 'bg-gray-100 text-gray-600' },
};

export function NavReviewQueuePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [batches, setBatches] = useState<ReviewBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!user?._id) return;
    fetchBatches();
  }, [user?._id, showAll]);

  const fetchBatches = async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      const endpoint = showAll
        ? `/review-queue/navigator/${user._id}/all`
        : `/review-queue/navigator/${user._id}`;
      const r = await api.get(endpoint);
      setBatches(r.data);
    } finally {
      setLoading(false);
    }
  };

  const pendingCount = batches.filter((b) => b.status === 'PENDING' || b.status === 'IN_REVIEW').length;

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <p className="text-muted-foreground text-sm">Loading review queue…</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Review Queue</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            AI-extracted tasks from uploaded documents
          </p>
        </div>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <span className="text-sm font-medium text-destructive">
              {pendingCount} pending
            </span>
          )}
          <button
            onClick={() => setShowAll((v) => !v)}
            className="text-xs text-muted-foreground border border-border rounded px-3 py-1.5 hover:bg-muted transition-colors"
          >
            {showAll ? 'Pending only' : 'Show all'}
          </button>
        </div>
      </div>

      {batches.length === 0 && (
        <div className="text-center py-16">
          <ClipboardList className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">No batches to review</p>
          <p className="text-xs text-muted-foreground mt-1">
            When patients upload documents, AI-extracted tasks will appear here.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {batches.map((batch) => {
          const statusCfg = STATUS_CONFIG[batch.status] ?? STATUS_CONFIG.PENDING;
          const reviewedCount = batch.verifiedCount + (batch.rejectedCount ?? 0);
          const progress = batch.taskCount > 0 ? (reviewedCount / batch.taskCount) * 100 : 0;
          const allDone = reviewedCount === batch.taskCount && batch.taskCount > 0;

          return (
            <div
              key={batch._id}
              onClick={() => navigate(`/nav/review-queue/${batch._id}`)}
              className="bg-card border border-border rounded-lg p-4 cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <FileText className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground truncate">
                        {batch.documentId?.fileName ?? 'Unknown file'}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCfg.className}`}
                      >
                        {statusCfg.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 mt-1">
                      <User className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {batch.patientId?.name} · {batch.patientId?.patientCode}
                        {batch.patientId?.cancerType && ` · ${batch.patientId.cancerType}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 mt-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {new Date(batch.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    {batch.taskCount > 0 && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">
                            {reviewedCount}/{batch.taskCount} tasks reviewed
                          </span>
                          {allDone && (
                            <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                          )}
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-shrink-0 text-right">
                  <div className="text-lg font-bold text-foreground">{batch.taskCount}</div>
                  <div className="text-xs text-muted-foreground">tasks</div>
                </div>
              </div>

              {(batch.status === 'PENDING' || batch.status === 'IN_REVIEW') && (
                <div className="mt-3 pt-3 border-t border-border flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-yellow-500" />
                  <span className="text-xs text-yellow-700">Requires your review before care plan update</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
