import { Users } from "lucide-react";

interface Organization {
  name: string;
  displayName: string;
  description: string;
}

interface OrgCardProps {
  org: Organization;
  onClick?: () => void;
}

function getInitials(name: string): string {
  return name
    .split(/[\s_\-]+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export default function OrganizationCard({ org, onClick }: OrgCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left group flex flex-col gap-3 p-5
                 bg-bg-surface border border-border rounded-xl
                 hover:border-border-strong hover:bg-bg-elevated
                 transition-colors duration-150"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 overflow-hidden">
          <div
            className="w-8 h-8 min-w-[32px] rounded-md bg-bg-elevated
                       flex items-center justify-center text-xs font-bold
                       text-text-secondary group-hover:text-brand transition-colors"
          >
            {getInitials(org.displayName || org.name)}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-text-primary truncate transition-colors">
              {org.displayName}
            </p>
            <p className="text-[11px] text-text-secondary truncate mt-0.5">
              {org.name}
            </p>
          </div>
        </div>

        {/* Badge za tip - umesto visibility badge-a */}
        <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-bg-elevated text-text-secondary border border-border whitespace-nowrap">
          <Users size={10} />
          Org
        </span>
      </div>

      {/* Description */}
      <div className="flex-1">
        {org.description ? (
          <p className="text-xs text-text-secondary leading-relaxed line-clamp-3">
            {org.description}
          </p>
        ) : (
          <p className="text-xs text-text-muted italic">
            No description provided.
          </p>
        )}
      </div>
    </button>
  );
}
