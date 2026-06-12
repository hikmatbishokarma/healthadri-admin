import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ChevronDown, ChevronRight, Pencil, Plus, Search, Trash2 } from 'lucide-react';
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
import { TablePagination, DEFAULT_PAGE_SIZE } from '@/components/ui/table-pagination';

type Hospital = { _id: string; name: string };

type Navigator = {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  hospitalId?: Hospital | null;
  languages?: string[];
};

type PatientSummary = {
  _id: string;
  name: string;
  patientCode?: string;
  cancerType?: string;
  cancerStage?: string;
};

type FormValues = {
  name: string;
  phone?: string;
  email?: string;
  password?: string;
  hospitalId?: string;
  languages?: string;
};


export function NavigatorsPage() {
  const [items, setItems] = useState<Navigator[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [patientsByNav, setPatientsByNav] = useState<Record<string, PatientSummary[]>>({});
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Navigator | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Navigator | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [hospitalFilter, setHospitalFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [total, setTotal] = useState(0);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<FormValues>();

  useEffect(() => {
    api.get('/hospitals', { params: { limit: 200 } })
      .then((res) => setHospitals(res.data.data ?? []));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params: Record<string, string> = { page: String(page), limit: String(pageSize) };
    if (debouncedSearch) params.search = debouncedSearch;
    if (hospitalFilter) params.hospitalId = hospitalFilter;

    Promise.all([
      api.get('/users/navigators', { params }),
      api.get('/users/patients', { params: { limit: '500' } }),
    ]).then(([navRes, patRes]) => {
      if (cancelled) return;
      setItems(navRes.data.data);
      setTotal(navRes.data.total);

      const byNav: Record<string, PatientSummary[]> = {};
      for (const p of (patRes.data.data ?? patRes.data)) {
        const navId = p.assignedNavigatorId?._id ?? p.assignedNavigatorId;
        if (navId) {
          if (!byNav[navId]) byNav[navId] = [];
          byNav[navId].push({
            _id: p._id,
            name: p.name,
            patientCode: p.patientCode,
            cancerType: p.cancerType,
            cancerStage: p.cancerStage,
          });
        }
      }
      setPatientsByNav(byNav);
    }).finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [page, pageSize, debouncedSearch, hospitalFilter]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openAdd = () => {
    setEditing(null);
    reset({ name: '', phone: '', email: '', password: '', hospitalId: '', languages: '' });
    setOpen(true);
  };

  const openEdit = (n: Navigator) => {
    setEditing(n);
    reset({
      name: n.name,
      phone: n.phone ?? '',
      email: n.email ?? '',
      password: '',
      hospitalId: n.hospitalId?._id ?? '',
      languages: (n.languages ?? []).join(', '),
    });
    setOpen(true);
  };

  const onSubmit = async (data: FormValues) => {
    const payload: Record<string, unknown> = {
      name: data.name,
      role: 'navigator',
      hospitalId: data.hospitalId || undefined,
      languages: data.languages
        ? data.languages.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
    };
    if (data.phone) payload.phone = data.phone;
    if (data.email) payload.email = data.email;
    if (!editing && data.password) payload.password = data.password;
    if (editing) {
      await api.patch(`/users/${editing._id}`, payload);
    } else {
      await api.post('/users', payload);
    }
    setOpen(false);
    setPage(1);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await api.delete(`/users/${deleteTarget._id}`);
    setDeleteTarget(null);
    setPage(1);
  };

  const pageCount = Math.ceil(total / pageSize);

  const handleHospitalFilter = (val: string) => {
    setHospitalFilter(val);
    setPage(1);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Navigators"
        description="Onboard and manage health navigators."
        action={
          <Button onClick={openAdd}>
            <Plus className="w-4 h-4" />
            Add Navigator
          </Button>
        }
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search navigators…"
            className="pl-9"
          />
        </div>
        <select
          value={hospitalFilter}
          onChange={(e) => handleHospitalFilter(e.target.value)}
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">All hospitals</option>
          {hospitals.map((h) => (
            <option key={h._id} value={h._id}>{h.name}</option>
          ))}
        </select>
        <span className="text-sm text-muted-foreground ml-auto">
          {loading ? '—' : `${total} navigator${total !== 1 ? 's' : ''}`}
        </span>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr className="text-left">
                <th className="px-4 py-3 w-8" />
                <th className="px-4 py-3 font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Email / Phone</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Hospital</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Languages</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Patients</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    Loading…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    {debouncedSearch || hospitalFilter ? 'No navigators match your filters.' : 'No navigators yet.'}
                  </td>
                </tr>
              ) : (
                items.flatMap((n) => {
                  const patients = patientsByNav[n._id] ?? [];
                  const count = patients.length;
                  const isExpanded = expanded.has(n._id);

                  const mainRow = (
                    <tr
                      key={n._id}
                      className="border-b hover:bg-muted/30 cursor-pointer"
                      onClick={() => toggleExpand(n._id)}
                    >
                      <td className="px-4 py-3 text-muted-foreground">
                        {count > 0 ? (
                          isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )
                        ) : null}
                      </td>
                      <td className="px-4 py-3 font-medium">{n.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {n.email || n.phone || <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {n.hospitalId ? n.hospitalId.name : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {n.languages?.length ? (
                          n.languages.join(', ')
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            count > 0
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {count} {count === 1 ? 'patient' : 'patients'}
                        </span>
                      </td>
                      <td
                        className="px-4 py-3 text-right space-x-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button variant="ghost" size="icon" onClick={() => openEdit(n)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(n)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  );

                  if (!isExpanded || count === 0) return [mainRow];

                  const expandedRow = (
                    <tr key={`${n._id}-patients`} className="border-b bg-muted/10">
                      <td colSpan={7} className="px-8 pb-4 pt-1">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-left">
                              <th className="py-1.5 pr-6 font-medium text-muted-foreground">Code</th>
                              <th className="py-1.5 pr-6 font-medium text-muted-foreground">Name</th>
                              <th className="py-1.5 pr-6 font-medium text-muted-foreground">Cancer Type</th>
                              <th className="py-1.5 font-medium text-muted-foreground">Stage</th>
                            </tr>
                          </thead>
                          <tbody>
                            {patients.map((p) => (
                              <tr key={p._id} className="border-t border-border/40">
                                <td className="py-1.5 pr-6">
                                  <code className="bg-muted px-1 py-0.5 rounded font-mono text-muted-foreground">
                                    {p.patientCode ?? '—'}
                                  </code>
                                </td>
                                <td className="py-1.5 pr-6 font-medium text-foreground">{p.name}</td>
                                <td className="py-1.5 pr-6 text-muted-foreground">
                                  {p.cancerType ?? '—'}
                                </td>
                                <td className="py-1.5">
                                  {p.cancerStage ? (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-muted text-foreground">
                                      {p.cancerStage}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">—</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  );

                  return [mainRow, expandedRow];
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Pagination */}
      <TablePagination
        page={page}
        pageCount={pageCount}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        disabled={loading}
      />

      {/* Create / Edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Navigator' : 'Add Navigator'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input {...register('name')} required minLength={2} />
            </div>
            <div className="space-y-1">
              <Label>Email (for web login)</Label>
              <Input {...register('email')} type="email" placeholder="navigator@hospital.com" />
            </div>
            {!editing && (
              <div className="space-y-1">
                <Label>Password</Label>
                <Input {...register('password')} type="password" placeholder="Min 6 characters" minLength={6} />
              </div>
            )}
            <div className="space-y-1">
              <Label>Phone (optional — for mobile OTP)</Label>
              <Input {...register('phone')} placeholder="+91XXXXXXXXXX" />
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
            <div className="space-y-1">
              <Label>Languages (comma-separated)</Label>
              <Input {...register('languages')} placeholder="English, Hindi, Telugu" />
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
            <DialogTitle>Delete Navigator</DialogTitle>
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
