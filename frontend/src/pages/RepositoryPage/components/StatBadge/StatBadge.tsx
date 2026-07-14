export function StatBadge({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-text-secondary">
      {icon}
      <span className="font-medium text-text-primary">{value}</span>
      <span>{label}</span>
    </div>
  );
}
