import { useEffect, useRef, useState } from 'react';
import { UserCheck, AlertCircle, ChevronDown, Pencil } from 'lucide-react';
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

type Navigator = { _id: string; name: string };

type Patient = {
  _id: string;
  name: string;
  phone: string;
  patientCode?: string;
  cancerType?: string;
  cancerStage?: string;
  assignedNavigatorId?: Navigator | null;
  hospitalId?: { _id: string; name: string } | null;
};

export function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [navigators, setNavigators] = useState<Navigator[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignTarget, setAssignTarget] = useState<Patient | null>(null);
  const [selectedNavId, setSelectedNavId] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [pRes, nRes] = await Promise.all([
        api.get('/users/patients'),
        api.get('/users/navigators'),
      ]);
      setPatients(pRes.data);
      setNavigators(nRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openAssign = (patient: Patient) => {
    setAssignTarget(patient);
    setSelectedNavId(patient.assignedNavigatorId?._id ?? '');
  };

  const confirmAssign = async () => {
    if (!assignTarget) return;
    setSaving(true);
    try {
      await api.patch(`/users/${assignTarget._id}`, {
        assignedNavigatorId: selectedNavId || null,
      });
      setPatients((prev) =>
        prev.map((p) => {
          if (p._id !== assignTarget._id) return p;
          const nav = navigators.find((n) => n._id === selectedNavId) ?? null;
          return { ...p, assignedNavigatorId: nav };
        }),
      );
      setAssignTarget(null);
    } finally {
      setSaving(false);
    }
  };

  const sorted = [...patients].sort((a, b) => {
    const aAssigned = !!a.assignedNavigatorId;
    const bAssigned = !!b.assignedNavigatorId;
    if (aAssigned !== bAssigned) return aAssigned ? 1 : -1;
    return a.name.localeCompare(b.name);
  });

  const unassigned = patients.filter((p) => !p.assignedNavigatorId).length;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Patients"
        description="View all enrolled patients and manage navigator assignments."
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <SummaryCard
          label="Total Patients"
          value={loading ? '—' : patients.length}
          icon={<UserCheck className="w-4 h-4" />}
          tint="text-blue-600 bg-blue-50"
        />
        <SummaryCard
          label="Unassigned"
          value={loading ? '—' : unassigned}
          icon={<AlertCircle className="w-4 h-4" />}
          tint={unassigned > 0 ? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50'}
        />
        <SummaryCard
          label="Navigators"
          value={loading ? '—' : navigators.length}
          icon={<UserCheck className="w-4 h-4" />}
          tint="text-violet-600 bg-violet-50"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium text-muted-foreground">Code</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Cancer</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Stage</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Hospital</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Assigned Navigator</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Loading…
                  </td>
                </tr>
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No patients yet.
                  </td>
                </tr>
              ) : (
                sorted.map((p) => {
                  const isAssigned = !!p.assignedNavigatorId;
                  return (
                    <tr
                      key={p._id}
                      className={`border-b last:border-0 ${
                        !isAssigned ? 'bg-amber-50/40' : 'hover:bg-muted/30'
                      }`}
                    >
                      <td className="px-4 py-3">
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono text-muted-foreground">
                          {p.patientCode ?? '—'}
                        </code>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.phone}</p>
                      </td>
                      <td className="px-4 py-3">
                        {p.cancerType || <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {p.cancerStage ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-foreground">
                            {p.cancerStage}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {p.hospitalId?.name ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        {isAssigned ? (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                              {p.assignedNavigatorId!.name}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-foreground"
                              onClick={() => openAssign(p)}
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs border-amber-300 text-amber-700 hover:bg-amber-50"
                            onClick={() => openAssign(p)}
                          >
                            Assign
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={!!assignTarget} onOpenChange={() => setAssignTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {assignTarget?.assignedNavigatorId ? 'Change Navigator' : 'Assign Navigator'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Patient</p>
              <p className="font-medium">{assignTarget?.name}</p>
              {assignTarget?.assignedNavigatorId && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Currently: {assignTarget.assignedNavigatorId.name}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Select navigator</p>
              <NavigatorCombobox
                navigators={navigators}
                value={selectedNavId}
                onChange={setSelectedNavId}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignTarget(null)}>
              Cancel
            </Button>
            <Button onClick={confirmAssign} disabled={saving}>
              {saving ? 'Saving…' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NavigatorCombobox({
  navigators,
  value,
  onChange,
}: {
  navigators: Navigator[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = navigators.find((n) => n._id === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = navigators.filter((n) =>
    n.name.toLowerCase().includes(query.toLowerCase()),
  );

  const handleSelect = (id: string) => {
    onChange(id);
    setOpen(false);
    setQuery('');
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {selected ? (
          <span>{selected.name}</span>
        ) : (
          <span className="text-muted-foreground">— Unassign —</span>
        )}
        <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-input bg-background shadow-lg">
          <div className="p-2 border-b">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search navigator…"
              className="w-full rounded border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <ul className="max-h-52 overflow-y-auto py-1">
            <li
              className="px-3 py-2 text-sm cursor-pointer hover:bg-muted text-muted-foreground"
              onMouseDown={() => handleSelect('')}
            >
              — Unassign —
            </li>
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-muted-foreground italic">No matches</li>
            ) : (
              filtered.map((n) => (
                <li
                  key={n._id}
                  onMouseDown={() => handleSelect(n._id)}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-muted ${
                    n._id === value ? 'font-medium text-foreground' : ''
                  }`}
                >
                  {n.name}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  tint,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  tint: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-3xl font-semibold mt-1 tracking-tight">{value}</p>
          </div>
          <div className={`w-8 h-8 rounded-md flex items-center justify-center ${tint}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
