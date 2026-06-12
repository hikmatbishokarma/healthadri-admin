import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
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
import { TagInput } from '@/components/ui/tag-input';
import { TablePagination, DEFAULT_PAGE_SIZE } from '@/components/ui/table-pagination';

type Medicine = {
  _id: string;
  genericName: string;
  form: string;
  strengths: string;
  cancerTypes: string[];
  brandNames: string[];
  manufacturers: string[];
  drugClass: string;
  category: string;
  notes: string;
};

type FormValues = {
  genericName: string;
  form: string;
  strengths: string;
  drugClass: string;
  category: string;
  notes: string;
};

const FORMS = ['Injection', 'Tablet', 'Capsule', 'Sachet', 'Injection & Tablet', 'Capsule & Injection'];
const CATEGORIES = ['Chemotherapy', 'Targeted', 'Hormone Therapy', 'Supportive'];

const CATEGORY_COLORS: Record<string, string> = {
  Chemotherapy: 'bg-red-50 text-red-700',
  Targeted: 'bg-violet-50 text-violet-700',
  'Hormone Therapy': 'bg-pink-50 text-pink-700',
  Supportive: 'bg-teal-50 text-teal-700',
};

const FORM_COLORS: Record<string, string> = {
  Injection: 'bg-blue-50 text-blue-700',
  Tablet: 'bg-emerald-50 text-emerald-700',
  Capsule: 'bg-amber-50 text-amber-700',
  Sachet: 'bg-orange-50 text-orange-700',
};

function formColor(form: string) {
  return FORM_COLORS[form] ?? 'bg-muted text-muted-foreground';
}
function categoryColor(cat: string) {
  return CATEGORY_COLORS[cat] ?? 'bg-muted text-muted-foreground';
}

// ── Page ──────────────────────────────────────────────────────────────────────

type MetaSuggestions = {
  brandNames: string[];
  manufacturers: string[];
  cancerTypes: string[];
};

export function MedicinesPage() {
  const [items, setItems] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Medicine | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Medicine | null>(null);

  // tag arrays managed outside react-hook-form
  const [brandNames, setBrandNames] = useState<string[]>([]);
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [cancerTypes, setCancerTypes] = useState<string[]>([]);

  // autocomplete suggestions fetched once per dialog open
  const [metaSuggestions, setMetaSuggestions] = useState<MetaSuggestions>({
    brandNames: [],
    manufacturers: [],
    cancerTypes: [],
  });
  const [metaLoading, setMetaLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [formFilter, setFormFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
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
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params: Record<string, string> = { page: String(page), limit: String(pageSize) };
    if (debouncedSearch) params.search = debouncedSearch;
    if (formFilter) params.form = formFilter;
    if (categoryFilter) params.category = categoryFilter;

    api.get('/medicines', { params })
      .then((res) => {
        if (cancelled) return;
        setItems(res.data.data);
        setTotal(res.data.total);
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [page, pageSize, debouncedSearch, formFilter, categoryFilter]);

  const fetchMeta = () => {
    setMetaLoading(true);
    api.get('/medicines/meta')
      .then((res) => setMetaSuggestions(res.data))
      .finally(() => setMetaLoading(false));
  };

  const openAdd = () => {
    setEditing(null);
    reset({ genericName: '', form: '', strengths: '', drugClass: '', category: '', notes: '' });
    setBrandNames([]);
    setManufacturers([]);
    setCancerTypes([]);
    fetchMeta();
    setOpen(true);
  };

  const openEdit = (m: Medicine) => {
    setEditing(m);
    reset({
      genericName: m.genericName,
      form: m.form ?? '',
      strengths: m.strengths ?? '',
      drugClass: m.drugClass ?? '',
      category: m.category ?? '',
      notes: m.notes ?? '',
    });
    setBrandNames(m.brandNames ?? []);
    setManufacturers(m.manufacturers ?? []);
    setCancerTypes(m.cancerTypes ?? []);
    fetchMeta();
    setOpen(true);
  };

  const onSubmit = async (data: FormValues) => {
    const payload = {
      genericName: data.genericName.trim(),
      form: data.form,
      strengths: data.strengths,
      cancerTypes,
      brandNames,
      manufacturers,
      drugClass: data.drugClass,
      category: data.category,
      notes: data.notes,
    };
    if (editing) {
      await api.patch(`/medicines/${editing._id}`, payload);
    } else {
      await api.post('/medicines', payload);
    }
    setOpen(false);
    setPage(1);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await api.delete(`/medicines/${deleteTarget._id}`);
    setDeleteTarget(null);
    setPage(1);
  };

  const pageCount = Math.ceil(total / pageSize);
  const handleFormFilter = (val: string) => { setFormFilter(val); setPage(1); };
  const handleCategoryFilter = (val: string) => { setCategoryFilter(val); setPage(1); };
  const hasFilter = !!(debouncedSearch || formFilter || categoryFilter);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Medicine Mapping"
        description="Master list of cancer medicines — generics, brands, manufacturers, and drug classes."
        action={
          <Button onClick={openAdd}>
            <Plus className="w-4 h-4" />
            Add Medicine
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
            placeholder="Search generic name or brand…"
            className="pl-9"
          />
        </div>
        <select
          value={formFilter}
          onChange={(e) => handleFormFilter(e.target.value)}
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">All forms</option>
          {FORMS.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => handleCategoryFilter(e.target.value)}
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <span className="text-sm text-muted-foreground ml-auto">
          {loading ? '—' : `${total} medicine${total !== 1 ? 's' : ''}`}
        </span>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium text-muted-foreground">Generic Name</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Form</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Category</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Cancer Types</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Brand Names</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Strengths</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    {hasFilter ? 'No medicines match your filters.' : 'No medicines yet.'}
                  </td>
                </tr>
              ) : (
                items.map((m) => (
                  <tr key={m._id} className="border-b last:border-0 hover:bg-muted/30 align-top">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{m.genericName}</p>
                      {m.drugClass && (
                        <p className="text-xs text-muted-foreground mt-0.5">{m.drugClass}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {m.form ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${formColor(m.form.split(' ')[0])}`}>
                          {m.form}
                        </span>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {m.category ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${categoryColor(m.category)}`}>
                          {m.category}
                        </span>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {m.cancerTypes?.length ? (
                        <div className="flex flex-wrap gap-1">
                          {m.cancerTypes.slice(0, 3).map((c) => (
                            <span key={c} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">{c}</span>
                          ))}
                          {m.cancerTypes.length > 3 && (
                            <span className="text-xs text-muted-foreground">+{m.cancerTypes.length - 3}</span>
                          )}
                        </div>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {m.brandNames?.length ? (
                        <div className="flex flex-wrap gap-1">
                          {m.brandNames.slice(0, 3).map((b) => (
                            <span key={b} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700">{b}</span>
                          ))}
                          {m.brandNames.length > 3 && (
                            <span className="text-xs text-muted-foreground">+{m.brandNames.length - 3}</span>
                          )}
                        </div>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{m.strengths || '—'}</td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(m)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(m)}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Medicine' : 'Add Medicine'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1">
                <Label>Generic Name</Label>
                <Input {...register('genericName')} required minLength={2} placeholder="Paclitaxel" />
              </div>
              <div className="space-y-1">
                <Label>Form</Label>
                <select
                  {...register('form')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">— select —</option>
                  {FORMS.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Strengths</Label>
                <Input {...register('strengths')} placeholder="30mg, 100mg, 260mg" />
              </div>
              <div className="space-y-1">
                <Label>Category</Label>
                <select
                  {...register('category')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">— select —</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Drug Class</Label>
                <Input {...register('drugClass')} placeholder="Taxane (Chemotherapy)" />
              </div>
            </div>

            {/* Tag inputs */}
            <TagInput
              label="Brand Names"
              value={brandNames}
              onChange={setBrandNames}
              suggestions={metaSuggestions.brandNames}
              placeholder={metaLoading ? 'Loading suggestions…' : 'Type a brand name or select existing…'}
            />
            <TagInput
              label="Manufacturers"
              value={manufacturers}
              onChange={setManufacturers}
              suggestions={metaSuggestions.manufacturers}
              placeholder={metaLoading ? 'Loading suggestions…' : 'Type a manufacturer or select existing…'}
            />
            <TagInput
              label="Cancer Types"
              value={cancerTypes}
              onChange={setCancerTypes}
              suggestions={metaSuggestions.cancerTypes}
              placeholder={metaLoading ? 'Loading suggestions…' : 'Type a cancer type or select existing…'}
            />

            <div className="space-y-1">
              <Label>Notes <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input {...register('notes')} placeholder="e.g. Brain tumor specialist" />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving…' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Medicine</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Remove <span className="font-medium text-foreground">{deleteTarget?.genericName}</span>? This cannot be undone.
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
