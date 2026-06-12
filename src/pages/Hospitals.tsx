import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Plus, Search } from 'lucide-react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { TablePagination, DEFAULT_PAGE_SIZE } from '@/components/ui/table-pagination';

type Hospital = {
  _id: string;
  name: string;
  city: string;
  facilityType?: string;
  type: string;
  accreditations?: string[];
  hfrVerified?: boolean;
  govtSchemes?: string[];
};

const HOSPITAL_TYPES = ['government', 'private', 'trust'];

export function HospitalsPage() {
  const [items, setItems] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();

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
    if (typeFilter) params.type = typeFilter;

    api.get('/hospitals', { params })
      .then((res) => {
        if (cancelled) return;
        setItems(res.data.data);
        setTotal(res.data.total);
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [page, pageSize, debouncedSearch, typeFilter]);

  const pageCount = Math.ceil(total / pageSize);

  const handleTypeChange = (val: string) => {
    setTypeFilter(val);
    setPage(1);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Hospitals"
        description="Manage hospital and cancer centre records."
        action={
          <Button onClick={() => navigate('/hospitals/new')}>
            <Plus className="w-4 h-4" />
            Add Hospital
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
            placeholder="Search hospitals…"
            className="pl-9"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => handleTypeChange(e.target.value)}
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">All types</option>
          {HOSPITAL_TYPES.map((t) => (
            <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
        <span className="text-sm text-muted-foreground ml-auto">
          {loading ? '—' : `${total} hospital${total !== 1 ? 's' : ''}`}
        </span>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">City</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Type</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Accreditations</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Schemes</th>
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
                    {debouncedSearch || typeFilter ? 'No hospitals match your filters.' : 'No hospitals yet.'}
                  </td>
                </tr>
              ) : (
                items.map((h) => (
                  <tr key={h._id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{h.name}</span>
                        {h.hfrVerified && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                            ABDM ✓
                          </span>
                        )}
                      </div>
                      {h.facilityType && (
                        <span className="text-xs text-muted-foreground">{h.facilityType}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{h.city || '—'}</td>
                    <td className="px-4 py-3 capitalize text-muted-foreground">{h.type}</td>
                    <td className="px-4 py-3">
                      {h.accreditations?.length ? (
                        <div className="flex flex-wrap gap-1">
                          {h.accreditations.map((a) => (
                            <span key={a} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700">
                              {a}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {h.govtSchemes?.length ? (
                        <div className="flex flex-wrap gap-1">
                          {h.govtSchemes.map((s) => (
                            <span key={s} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700">
                              {s}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/hospitals/${h._id}/edit`)}>
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

      {/* Pagination */}
      <TablePagination
        page={page}
        pageCount={pageCount}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        disabled={loading}
      />
    </div>
  );
}
