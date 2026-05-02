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

type Hospital = {
  _id: string;
  name: string;
  city: string;
  address?: string;
  type: string;
  acceptsAarogyasri: boolean;
  offersPalliative: boolean;
  tags?: string[];
};

type FormValues = {
  name: string;
  city: string;
  address: string;
  type: string;
  acceptsAarogyasri: boolean;
  offersPalliative: boolean;
  tags: string;
};

export function HospitalsPage() {
  const [items, setItems] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Hospital | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<FormValues>();

  const load = async () => {
    try {
      const res = await api.get('/hospitals');
      setItems(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditing(null);
    reset({
      name: '',
      city: '',
      address: '',
      type: 'private',
      acceptsAarogyasri: false,
      offersPalliative: false,
      tags: '',
    });
    setOpen(true);
  };

  const openEdit = (h: Hospital) => {
    setEditing(h);
    reset({
      name: h.name,
      city: h.city,
      address: h.address ?? '',
      type: h.type,
      acceptsAarogyasri: h.acceptsAarogyasri,
      offersPalliative: h.offersPalliative,
      tags: (h.tags ?? []).join(', '),
    });
    setOpen(true);
  };

  const onSubmit = async (data: FormValues) => {
    const payload = {
      name: data.name,
      city: data.city,
      address: data.address,
      type: data.type,
      acceptsAarogyasri: data.acceptsAarogyasri,
      offersPalliative: data.offersPalliative,
      tags: data.tags
        ? data.tags.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
    };
    if (editing) {
      await api.patch(`/hospitals/${editing._id}`, payload);
    } else {
      await api.post('/hospitals', payload);
    }
    setOpen(false);
    load();
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Hospitals"
        description="Manage hospital records."
        action={
          <Button onClick={openAdd}>
            <Plus className="w-4 h-4" />
            Add Hospital
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">City</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Type</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Aarogyasri</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Palliative</th>
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
                    No hospitals yet.
                  </td>
                </tr>
              ) : (
                items.map((h) => (
                  <tr key={h._id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{h.name}</td>
                    <td className="px-4 py-3">{h.city}</td>
                    <td className="px-4 py-3 capitalize">{h.type}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          h.acceptsAarogyasri
                            ? 'text-emerald-600 font-medium'
                            : 'text-muted-foreground'
                        }
                      >
                        {h.acceptsAarogyasri ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          h.offersPalliative
                            ? 'text-emerald-600 font-medium'
                            : 'text-muted-foreground'
                        }
                      >
                        {h.offersPalliative ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(h)}>
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
            <DialogTitle>{editing ? 'Edit Hospital' : 'Add Hospital'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input {...register('name')} required minLength={2} maxLength={120} />
            </div>
            <div className="space-y-1">
              <Label>City</Label>
              <Input {...register('city')} required minLength={2} maxLength={80} />
            </div>
            <div className="space-y-1">
              <Label>Address (optional)</Label>
              <Input {...register('address')} maxLength={200} />
            </div>
            <div className="space-y-1">
              <Label>Type</Label>
              <select
                {...register('type')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="private">Private</option>
                <option value="government">Government</option>
                <option value="trust">Trust</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label>Tags (comma-separated)</Label>
              <Input {...register('tags')} placeholder="oncology, surgery" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" {...register('acceptsAarogyasri')} className="h-4 w-4 rounded border-input" />
                Accepts Aarogyasri
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" {...register('offersPalliative')} className="h-4 w-4 rounded border-input" />
                Offers Palliative Care
              </label>
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
    </div>
  );
}
