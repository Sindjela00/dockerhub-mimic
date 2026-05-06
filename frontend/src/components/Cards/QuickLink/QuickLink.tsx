import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface QuickLinkProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  link?: string;
  onClick?: () => void;
}

export default function QuickLink({
  icon,
  label,
  description,
  link,
  onClick,
}: QuickLinkProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    onClick?.();
    if (link) navigate(link);
  };

  return (
    <button
      onClick={handleClick}
      className="group flex items-start gap-4 p-4 rounded-lg text-left w-full
                 border border-border bg-bg-surface
                 hover:border-border-strong hover:bg-bg-elevated
                 transition-colors duration-150"
    >
      <div
        className="mt-0.5 p-2 rounded-md bg-bg-elevated group-hover:bg-brand-muted
                      text-text-muted group-hover:text-brand transition-colors duration-150"
      >
        {icon}
      </div>
      <div className="overflow-hidden">
        <p className="text-sm font-medium text-text-primary mb-0.5">{label}</p>
        <p className="text-xs text-text-muted leading-relaxed">{description}</p>
      </div>
      <ArrowRight
        size={15}
        className="ml-auto mt-1 min-w-3.75 text-text-muted
                   group-hover:text-brand group-hover:translate-x-0.5
                   transition-all duration-150"
      />
    </button>
  );
}
