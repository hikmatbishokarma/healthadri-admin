interface Metrics {
  total: number;
  pending: number;
  inReview: number;
  reviewed: number;
}

interface MetricsBarProps {
  metrics: Metrics | null;
  loading: boolean;
}

function StatCard({
  label,
  value,
  sub,
  valueColor,
}: {
  label: string;
  value: number | string;
  sub: string;
  valueColor?: string;
}) {
  return (
    <div className="bg-white rounded-lg border border-border p-5 flex-1 min-w-0">
      <div className={`text-3xl font-bold ${valueColor ?? 'text-foreground'}`}>{value}</div>
      <div className="text-sm font-medium text-foreground mt-1">{label}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
    </div>
  );
}

export function MetricsBar({ metrics, loading }: MetricsBarProps) {
  const m = metrics ?? { total: 0, pending: 0, inReview: 0, reviewed: 0 };

  if (loading && !metrics) {
    return (
      <div className="flex gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-border p-5 flex-1 h-[88px] animate-pulse bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-4 mb-6">
      <StatCard label="Total Updates"      value={m.total}    sub="All uploaded documents" />
      <StatCard label="Pending Review"     value={m.pending}  sub="Not reviewed yet"       valueColor="text-amber-500" />
      <StatCard label="Partially Reviewed" value={m.inReview} sub="Review in progress"     valueColor="text-blue-500" />
      <StatCard label="Ready to Publish"   value={m.reviewed} sub="All tasks reviewed"     valueColor="text-green-500" />
    </div>
  );
}
