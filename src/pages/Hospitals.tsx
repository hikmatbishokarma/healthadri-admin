import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

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

export function HospitalsPage() {
  const [items, setItems] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/hospitals')
      .then((res) => setItems(res.data))
      .finally(() => setLoading(false));
  }, []);

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
                    No hospitals yet.
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
                    <td className="px-4 py-3 text-muted-foreground">{h.city}</td>
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
    </div>
  );
}
