import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Playbook = {
  _id: string;
  triggerType: string;
  title: string;
  steps: string[];
  autoCompletedCount: number;
};

type FormValues = {
  triggerType: string;
  title: string;
  steps: string;
};

export function PlaybooksPage() {
  const [items, setItems] = useState<Playbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Playbook | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Playbook | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<FormValues>();

  const load = async () => {
    try {
      const res = await api.get('/playbooks');
      setItems(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditing(null);
    reset({ triggerType: '', title: '', steps: '' });
    setOpen(true);
  };

  const openEdit = (p: Playbook) => {
    setEditing(p);
    reset({
      triggerType: p.triggerType,
      title: p.title,
      steps: p.steps.join('\n'),
    });
    setOpen(true);
  };

  const onSubmit = async (data: FormValues) => {
    const payload = {
      triggerType: data.triggerType.trim().toUpperCase().replace(/\s+/g, '_'),
      title: data.title,
      steps: data.steps
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
    };
    if (editing) {
      await api.patch(`/playbooks/${editing._id}`, payload);
    } else {
      await api.post('/playbooks', payload);
    }
    setOpen(false);
    load();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await api.delete(`/playbooks/${deleteTarget._id}`);
    setDeleteTarget(null);
    load();
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Playbooks"
        description="Define care protocols triggered by symptom thresholds."
        action={
          <Button onClick={openAdd}>
            <Plus className="w-4 h-4" />
            Add Playbook
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium text-muted-foreground">Trigger</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Title</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Steps</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Auto-completed</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    Loading…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No playbooks yet.
                  </td>
                </tr>
              ) : (
                items.map((p) => (
                  <tr key={p._id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                        {p.triggerType}
                      </code>
                    </td>
                    <td className="px-4 py-3 font-medium">{p.title}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.steps.length}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.autoCompletedCount}</td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(p)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Create / Edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Playbook' : 'Add Playbook'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label>Trigger Type</Label>
              <Input
                {...register('triggerType')}
                required
                placeholder="HIGH_FATIGUE"
                className="font-mono uppercase"
              />
              <p className="text-xs text-muted-foreground">
                UPPER_SNAKE_CASE — e.g. HIGH_PAIN, SEVERE_NAUSEA
              </p>
            </div>
            <div className="space-y-1">
              <Label>Title</Label>
              <Input {...register('title')} required minLength={3} maxLength={120} />
            </div>
            <div className="space-y-1">
              <Label>Steps (one per line)</Label>
              <textarea
                {...register('steps')}
                required
                rows={6}
                placeholder="Call the patient&#10;Schedule appointment&#10;Notify oncologist"
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving…' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Playbook</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Remove{' '}
            <span className="font-medium text-foreground">{deleteTarget?.title}</span>? This
            cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
