export interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export default function FeatureCard({
  icon,
  title,
  description,
}: FeatureCardProps) {
  return (
    <div
      className="bg-bg-surface border border-border rounded-xl p-6
                    hover:border-border-strong transition-colors duration-150"
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center mb-4
                      bg-brand-subtle text-brand"
      >
        {icon}
      </div>
      <h3 className="text-sm font-medium text-text-primary mb-2">{title}</h3>
      <p className="text-xs text-text-muted leading-relaxed">{description}</p>
    </div>
  );
}
