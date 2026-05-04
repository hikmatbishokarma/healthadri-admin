import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

type Doctor = {
  _id: string;
  name: string;
  primarySpecialty?: string;
  specialty?: string;
  dmgs?: string[];
  yearsOfExperience?: number;
  hprVerified?: boolean;
  affiliations?: { hospitalId?: { name: string } }[];
};

export function DoctorsPage() {
  const [items, setItems] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Doctor | null>(null);
  const navigate = useNavigate();

  const load = () =>
    api.get('/doctors')
      .then((res) => setItems(res.data))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

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
        description="Manage oncologist and specialist profiles."
        action={
          <Button onClick={() => navigate('/doctors/new')}>
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
                <th className="px-4 py-3 font-medium text-muted-foreground">DMGs</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Experience</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Primary Hospital</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No doctors yet.</td></tr>
              ) : (
                items.map((d) => (
                  <tr key={d._id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{d.name}</span>
                        {d.hprVerified && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">HPR ✓</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {d.primarySpecialty || d.specialty || <span>—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {d.dmgs?.length ? (
                        <div className="flex flex-wrap gap-1">
                          {d.dmgs.slice(0, 2).map((g) => (
                            <span key={g} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-violet-50 text-violet-700">{g}</span>
                          ))}
                          {d.dmgs.length > 2 && <span className="text-xs text-muted-foreground">+{d.dmgs.length - 2}</span>}
                        </div>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {d.yearsOfExperience ? `${d.yearsOfExperience} yrs` : '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {d.affiliations?.[0]?.hospitalId?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/doctors/${d._id}/edit`)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(d)}>
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

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Doctor</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Remove <span className="font-medium text-foreground">{deleteTarget?.name}</span>? This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
