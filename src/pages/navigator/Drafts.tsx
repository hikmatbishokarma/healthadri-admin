import { useEffect, useState } from 'react';
import { FileText, Trash2, CheckCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface Draft {
  _id: string;
  title: string;
  type: string;
  dueDate?: string;
  status: string;
  patientId: {
    _id: string;
    name: string;
    patientCode: string;
  };
  sourceDocumentId?: string;
}

const DOC_EMOJI: Record<string, string> = {
  lab: '🧪',
  prescription: '💊',
  discharge: '🏥',
  other: '📄',
};

function groupByType(drafts: Draft[]): Record<string, Draft[]> {
  return drafts.reduce((acc, d) => {
    const key = d.type in DOC_EMOJI ? d.type : 'other';
    acc[key] = acc[key] ?? [];
    acc[key].push(d);
    return acc;
  }, {} as Record<string, Draft[]>);
}

export function NavDraftsPage() {
  const { user } = useAuth();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Draft | null>(null);

  useEffect(() => {
    if (!user?._id) return;
    fetchDrafts();
  }, [user?._id]);

  const fetchDrafts = async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      const r = await api.get(`/tasks?navigatorId=${user._id}&status=draft`);
      setDrafts(r.data);
    } finally {
      setLoading(false);
    }
  };

  const publish = async (id: string) => {
    await api.post(`/tasks/${id}/publish`);
    setDrafts((prev) => prev.filter((d) => d._id !== id));
  };

  const remove = async (id: string) => {
    await api.delete(`/tasks/${id}`);
    setDrafts((prev) => prev.filter((d) => d._id !== id));
  };

  const saveEdit = async () => {
    if (!editing) return;
    await api.patch(`/tasks/${editing._id}`, {
      title: editing.title,
      type: editing.type,
      dueDate: editing.dueDate,
    });
    setDrafts((prev) => prev.map((d) => (d._id === editing._id ? editing : d)));
    setEditing(null);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <p className="text-muted-foreground text-sm">Loading drafts…</p>
      </div>
    );
  }

  const groups = groupByType(drafts);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Drafts</h1>
        <span className="text-sm text-muted-foreground">{drafts.length} pending review</span>
      </div>

      {drafts.length === 0 && (
        <div className="text-center py-12">
          <CheckCheck className="w-10 h-10 text-green-500 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No drafts pending review</p>
        </div>
      )}

      {Object.entries(groups).map(([type, items]) => (
        <div key={type}>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
            <span>{DOC_EMOJI[type] ?? '📄'}</span>
            <span className="capitalize">{type}</span>
            <span className="text-xs font-normal">({items.length})</span>
          </h2>
          <div className="space-y-2">
            {items.map((draft) => (
              <div
                key={draft._id}
                className="bg-card border border-border rounded-lg p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <FileText className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{draft.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {draft.patientId.name} · {draft.patientId.patientCode}
                      </p>
                      {draft.dueDate && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Due: {new Date(draft.dueDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => setEditing(draft)}
                      className="text-xs text-muted-foreground hover:text-foreground border border-border rounded px-2 py-1 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => publish(draft._id)}
                      className="text-xs bg-primary text-primary-foreground rounded px-2 py-1 transition-opacity hover:opacity-90"
                    >
                      Publish
                    </button>
                    <button
                      onClick={() => remove(draft._id)}
                      className="w-7 h-7 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-background rounded-lg border border-border w-full max-w-md p-5 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">Edit Draft</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Title</label>
                <input
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Type</label>
                <select
                  value={editing.type}
                  onChange={(e) => setEditing({ ...editing, type: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {Object.keys(DOC_EMOJI).map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Due Date</label>
                <input
                  type="date"
                  value={editing.dueDate ? editing.dueDate.slice(0, 10) : ''}
                  onChange={(e) => setEditing({ ...editing, dueDate: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setEditing(null)}
                className="px-3 py-1.5 text-sm border border-border rounded-md text-muted-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
