import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Pencil, Plus } from 'lucide-react';
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

type Symptom = {
  _id: string;
  name: string;
  type: string;
  min: number;
  max: number;
  threshold: number;
};

type FormValues = {
  name: string;
  type: string;
  min: number;
  max: number;
  threshold: number;
};

export function SymptomsPage() {
  const [items, setItems] = useState<Symptom[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Symptom | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<FormValues>();

  const load = async () => {
    try {
      const res = await api.get('/symptoms');
      setItems(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditing(null);
    reset({ name: '', type: 'scale', min: 0, max: 10, threshold: 6 });
    setOpen(true);
  };

  const openEdit = (s: Symptom) => {
    setEditing(s);
    reset({
      name: s.name,
      type: s.type,
      min: s.min,
      max: s.max,
      threshold: s.threshold,
    });
    setOpen(true);
  };

  const onSubmit = async (data: FormValues) => {
    const payload = {
      name: data.name,
      type: data.type,
      min: Number(data.min),
      max: Number(data.max),
      threshold: Number(data.threshold),
    };
    if (editing) {
      await api.patch(`/symptoms/${editing._id}`, payload);
    } else {
      await api.post('/symptoms', payload);
    }
    setOpen(false);
    load();
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Symptoms"
        description="Configure symptom scales and alert thresholds."
        action={
          <Button onClick={openAdd}>
            <Plus className="w-4 h-4" />
            Add Symptom
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Type</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Min</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Max</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Threshold</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Loading…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No symptoms yet.
                  </td>
                </tr>
              ) : (
                items.map((s) => (
                  <tr key={s._id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{s.name}</td>
                    <td className="px-4 py-3 capitalize text-muted-foreground">{s.type}</td>
                    <td className="px-4 py-3">{s.min}</td>
                    <td className="px-4 py-3">{s.max}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        ≥ {s.threshold}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Symptom' : 'Add Symptom'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input {...register('name')} required maxLength={80} placeholder="Pain Level" />
            </div>
            <div className="space-y-1">
              <Label>Type</Label>
              <Input {...register('type')} maxLength={30} placeholder="scale" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Min</Label>
                <Input {...register('min')} type="number" min={0} required />
              </div>
              <div className="space-y-1">
                <Label>Max</Label>
                <Input {...register('max')} type="number" min={0} required />
              </div>
              <div className="space-y-1">
                <Label>Threshold</Label>
                <Input {...register('threshold')} type="number" min={0} required />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              An alert fires when a patient's score reaches the threshold.
            </p>
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
    </div>
  );
}
