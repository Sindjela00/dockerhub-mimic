import { TagComponent } from "@/components/Tag/Tag";
import { Users } from "lucide-react";
import { getInitials } from "@/utils/getInitials";
import { useState } from "react";

interface Organization {
  name: string;
  displayName: string;
  description: string;
  avatarUrl?: string | null;
}

interface OrgCardProps {
  org: Organization;
  onClick?: () => void;
}

export default function OrganizationCard({ org, onClick }: OrgCardProps) {
  const [avatarFailed, setAvatarFailed] = useState(false);

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
            className="w-8 h-8 min-w-[32px] rounded-md bg-bg-elevated overflow-hidden
                       flex items-center justify-center text-xs font-bold
                       text-text-secondary group-hover:text-brand transition-colors"
          >
            {org.avatarUrl && !avatarFailed ? (
              <img
                src={org.avatarUrl}
                alt=""
                className="w-full h-full object-cover"
                onError={() => setAvatarFailed(true)}
              />
            ) : (
              getInitials(org.displayName || org.name)
            )}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-text-primary truncate transition-colors">
              {org.displayName}
            </p>
            <p className="text-[11px] text-text-muted truncate mt-0.5">
              {org.name}
            </p>
          </div>
        </div>

        <TagComponent accentClass="brand">
          <Users size={10} />
          Org
        </TagComponent>
      </div>

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
