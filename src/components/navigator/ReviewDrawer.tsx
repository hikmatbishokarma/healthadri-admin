import { useState, useCallback, useEffect, useRef } from 'react';
import {
  X,
  FileText,
  Pill,
  FlaskConical,
  Calendar,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { TaskReviewCard, type AiExtractedTask } from './TaskReviewCard';
import { cn } from '@/lib/utils';

export interface ReviewBatchDetail {
  batch: {
    _id: string;
    status: string;
    taskCount: number;
    verifiedCount: number;
    rejectedCount: number;
    patient: { _id: string; name: string; patientCode: string; cancerType?: string; cancerStage?: string };
    document: { _id: string; fileName: string; category: string; createdAt: string; fileSize?: number };
    taskTypeCounts: { MEDICATION: number; LAB_TEST: number; APPOINTMENT: number; PROCEDURE: number };
  };
  tasks: AiExtractedTask[];
}

interface ReviewDrawerProps {
  detail: ReviewBatchDetail | null;
  navigatorId: string;
  loading: boolean;
  onClose: () => void;
  onPublished: (batchId: string) => void;
  onTaskUpdated: (batchId: string, updatedTask: AiExtractedTask) => void;
}

const CATEGORY_BADGE: Record<string, string> = {
  prescription: 'bg-blue-100 text-blue-700',
  discharge:    'bg-amber-100 text-amber-700',
  lab:          'bg-green-100 text-green-700',
  other:        'bg-slate-100 text-slate-700',
};

function formatBytes(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ReviewDrawer({
  detail,
  navigatorId,
  loading,
  onClose,
  onPublished,
  onTaskUpdated,
}: ReviewDrawerProps) {
  const [activeTab, setActiveTab] = useState<'review' | 'document'>('review');
  const [publishing, setPublishing] = useState(false);
  const [docBlobUrl, setDocBlobUrl] = useState<string | null>(null);
  const [docLoading, setDocLoading] = useState(false);
  const prevDocId = useRef<string | null>(null);

  const docId = detail?.batch.document?._id ?? null;

  useEffect(() => {
    if (activeTab !== 'document' || !docId) return;
    if (prevDocId.current === docId && docBlobUrl) return;

    let objectUrl: string;
    setDocLoading(true);
    api
      .get(`/documents/${docId}/file`, { responseType: 'blob' })
      .then((res) => {
        objectUrl = URL.createObjectURL(res.data as Blob);
        prevDocId.current = docId;
        setDocBlobUrl(objectUrl);
      })
      .catch(() => setDocBlobUrl(null))
      .finally(() => setDocLoading(false));

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, docId]);

  // Reset blob when a different batch is opened
  useEffect(() => {
    if (docId !== prevDocId.current) {
      setDocBlobUrl(null);
      prevDocId.current = null;
    }
  }, [docId]);

  const batchId = detail?.batch._id ?? '';
  const tasks = detail?.tasks ?? [];
  const verifiedCount = tasks.filter((t) =>
    ['VERIFIED', 'EDITED'].includes(t.reviewStatus),
  ).length;
  const rejectedCount = tasks.filter((t) => t.reviewStatus === 'REJECTED').length;
  const allActioned = tasks.length > 0 && verifiedCount + rejectedCount === tasks.length;

  const handleTaskUpdated = useCallback(
    (updated: AiExtractedTask) => {
      onTaskUpdated(batchId, updated);
    },
    [batchId, onTaskUpdated],
  );

  async function handlePublish() {
    if (!batchId || !allActioned) return;
    setPublishing(true);
    try {
      await api.post(`/review-queue/batch/${batchId}/publish`, { navigatorId });
      onPublished(batchId);
    } finally {
      setPublishing(false);
    }
  }

  const doc = detail?.batch.document;
  const patient = detail?.batch.patient;
  const tc = detail?.batch.taskTypeCounts ?? { MEDICATION: 0, LAB_TEST: 0, APPOINTMENT: 0, PROCEDURE: 0 };

  return (
    <div className="flex flex-col h-full bg-white border-l border-border">
      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-4 pb-0 border-b border-border">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="font-semibold text-foreground leading-tight">
              {patient?.name ?? '—'}
            </div>
            <div className="text-xs text-muted-foreground">{patient?.patientCode}</div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {doc && (
          <div className="flex items-center gap-2 mb-3 text-sm">
            <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span className="text-foreground font-medium truncate flex-1 text-xs">{doc.fileName}</span>
            <span
              className={cn(
                'text-xs font-medium px-1.5 py-0.5 rounded capitalize',
                CATEGORY_BADGE[doc.category] ?? CATEGORY_BADGE.other,
              )}
            >
              {doc.category}
            </span>
          </div>
        )}
        {doc && (
          <div className="text-xs text-muted-foreground mb-3">
            Uploaded on {formatDate(doc.createdAt)}
            {doc.fileSize ? ` · ${formatBytes(doc.fileSize)}` : ''}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-0">
          <button
            onClick={() => setActiveTab('review')}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'review'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            Review Changes
          </button>
          <button
            onClick={() => setActiveTab('document')}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'document'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            Document
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'review' ? (
          <div className="p-4 space-y-4">
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-24 rounded-lg border border-border animate-pulse bg-muted" />
                ))}
              </div>
            ) : (
              <>
                {/* Summary strip */}
                <div className="flex flex-wrap gap-2 pb-2 border-b border-border">
                  <span className="inline-flex items-center gap-1 text-xs font-medium bg-slate-100 text-slate-700 rounded-full px-2 py-0.5">
                    {detail?.batch.taskCount ?? 0} Total Updates
                  </span>
                  {tc.MEDICATION > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium bg-purple-50 text-purple-700 rounded-full px-2 py-0.5">
                      <Pill className="w-3 h-3" /> {tc.MEDICATION} Medication{tc.MEDICATION > 1 ? 's' : ''}
                    </span>
                  )}
                  {tc.LAB_TEST > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full px-2 py-0.5">
                      <FlaskConical className="w-3 h-3" /> {tc.LAB_TEST} Lab Test{tc.LAB_TEST > 1 ? 's' : ''}
                    </span>
                  )}
                  {tc.APPOINTMENT > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium bg-green-50 text-green-700 rounded-full px-2 py-0.5">
                      <Calendar className="w-3 h-3" /> {tc.APPOINTMENT} Appointment{tc.APPOINTMENT > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {/* Task cards */}
                {tasks.map((task) => (
                  <TaskReviewCard
                    key={task._id}
                    task={task}
                    navigatorId={navigatorId}
                    documentId={doc?._id ?? ''}
                    onTaskUpdated={handleTaskUpdated}
                    onViewDocument={() => setActiveTab('document')}
                  />
                ))}
              </>
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            {docLoading ? (
              <div className="text-sm text-muted-foreground">Loading document...</div>
            ) : docBlobUrl ? (
              <iframe
                src={docBlobUrl}
                className="w-full h-full border-0"
                title={doc?.fileName ?? 'Document'}
              />
            ) : (
              <div className="text-sm text-muted-foreground">
                {doc ? 'Failed to load document.' : 'No document available.'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      {activeTab === 'review' && (
        <div className="flex-shrink-0 p-4 border-t border-border space-y-2">
          <Button
            className="w-full bg-[#0D4035] hover:bg-[#0a3329] text-white disabled:opacity-40"
            disabled={!allActioned || publishing}
            onClick={handlePublish}
          >
            <Send className="w-4 h-4" />
            {allActioned
              ? `All Reviewed – Ready to Publish (${verifiedCount})`
              : `${verifiedCount + rejectedCount} / ${tasks.length} Reviewed`}
          </Button>
          <Button variant="outline" className="w-full" onClick={onClose}>
            Save & Close
          </Button>
        </div>
      )}
    </div>
  );
}
