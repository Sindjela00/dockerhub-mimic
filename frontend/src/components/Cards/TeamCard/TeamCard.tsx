// TeamCard.tsx - izdvojena komponenta za prikaz jednog tima

import { BookOpen, Users } from "lucide-react";

import { getAccent } from "@/utils/accentStyle";

interface TeamCardProps {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  repoCount: number;
  access: string;
  accentClass: string;
  onClick?: (teamId: string) => void;
}

export function TeamCard({
  id,
  name,
  description,
  memberCount,
  repoCount,
  access,
  accentClass,
  onClick,
}: TeamCardProps) {
  const accent = getAccent(accentClass);

  return (
    <div
      onClick={() => onClick?.(id)}
      className="bg-bg-surface border border-border rounded-xl p-4 flex flex-col gap-3
                 hover:border-border-strong transition-all cursor-pointer group relative overflow-hidden"
    >
      <div
        className={`absolute top-0 left-0 right-0 h-[2px] ${accent.bg}
                    opacity-0 group-hover:opacity-100 transition-opacity duration-200`}
      />

      <div className="flex items-start gap-3">
        <div
          className={`w-9 h-9 min-w-[36px] rounded-lg flex items-center justify-center
            ${accent.bg} border ${accent.border}`}
        >
          <Users size={15} className={accent.text} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-text-primary font-mono truncate">{name}</p>
          <p className="text-xs text-text-muted mt-0.5 line-clamp-2">
            {description}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[11px] text-text-muted">
            <Users size={11} />
            {memberCount} members
          </span>
          <span className="flex items-center gap-1 text-[11px] text-text-muted">
            <BookOpen size={11} />
            {repoCount} repos
          </span>
        </div>
      </div>
    </div>
  );
}
