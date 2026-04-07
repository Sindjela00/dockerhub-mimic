interface StatCardProps {
  label: string;
  value: string;
}

export default function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="bg-bg-elevated border border-border rounded-lg px-5 py-4">
      <p className="text-[11px] font-medium uppercase tracking-widest text-text-muted mb-1">
        {label}
      </p>
      <p className="text-2xl font-semibold text-text-primary">{value}</p>
    </div>
  );
}
