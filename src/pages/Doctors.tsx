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

type Hospital = { _id: string; name: string };

type Doctor = {
  _id: string;
  name: string;
  specialty: string;
  phone?: string;
  email?: string;
  hospitalId?: Hospital | null;
};

type FormValues = {
  name: string;
  specialty: string;
  phone: string;
  email: string;
  hospitalId: string;
};

export function DoctorsPage() {
  const [items, setItems] = useState<Doctor[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Doctor | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Doctor | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<FormValues>();

  const load = async () => {
    try {
      const [docRes, hospRes] = await Promise.all([
        api.get('/doctors'),
        api.get('/hospitals'),
      ]);
      setItems(docRes.data);
      setHospitals(hospRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditing(null);
    reset({ name: '', specialty: '', phone: '', email: '', hospitalId: '' });
    setOpen(true);
  };

  const openEdit = (d: Doctor) => {
    setEditing(d);
    reset({
      name: d.name,
      specialty: d.specialty,
      phone: d.phone ?? '',
      email: d.email ?? '',
      hospitalId: d.hospitalId?._id ?? '',
    });
    setOpen(true);
  };

  const onSubmit = async (data: FormValues) => {
    const payload = {
      name: data.name,
      specialty: data.specialty,
      phone: data.phone || undefined,
      email: data.email || undefined,
      hospitalId: data.hospitalId || undefined,
    };
    if (editing) {
      await api.patch(`/doctors/${editing._id}`, payload);
    } else {
      await api.post('/doctors', payload);
    }
    setOpen(false);
    load();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await api.delete(`/doctors/${deleteTarget._id}`);
    setDeleteTarget(null);
    load();
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Doctors"
        description="Manage doctor profiles."
        action={
          <Button onClick={openAdd}>
            <Plus className="w-4 h-4" />
            Add Doctor
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Specialty</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Phone</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Email</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Hospital</th>
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
                    No doctors yet.
                  </td>
                </tr>
              ) : (
                items.map((d) => (
                  <tr key={d._id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{d.name}</td>
                    <td className="px-4 py-3">{d.specialty}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {d.phone || <span>—</span>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {d.email || <span>—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {d.hospitalId ? (
                        d.hospitalId.name
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(d)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(d)}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Doctor' : 'Add Doctor'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input {...register('name')} required minLength={2} maxLength={120} />
            </div>
            <div className="space-y-1">
              <Label>Specialty</Label>
              <Input {...register('specialty')} required minLength={2} maxLength={80} />
            </div>
            <div className="space-y-1">
              <Label>Phone (optional)</Label>
              <Input {...register('phone')} placeholder="+91XXXXXXXXXX" />
            </div>
            <div className="space-y-1">
              <Label>Email (optional)</Label>
              <Input {...register('email')} type="email" />
            </div>
            <div className="space-y-1">
              <Label>Hospital (optional)</Label>
              <select
                {...register('hospitalId')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">— none —</option>
                {hospitals.map((h) => (
                  <option key={h._id} value={h._id}>
                    {h.name}
                  </option>
                ))}
              </select>
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
            <DialogTitle>Delete Doctor</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Remove <span className="font-medium text-foreground">{deleteTarget?.name}</span>? This
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
