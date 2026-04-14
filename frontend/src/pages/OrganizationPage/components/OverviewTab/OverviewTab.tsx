import { ACTIVITY, REPOS, TEAMS } from "../../mock/mock";

import { Avatar } from "../Avatar/Avatar";
import RepoCard from "@/components/Cards/RepoCard/RepoCard";
import { Users } from "lucide-react";
import { getAccent } from "@/utils/accentStyle";

interface OverviewTabProps {
  onRepoClick?: (repo: any) => void;
  onRepoEdit?: (repo: any) => void;
  onRepoDelete?: (repo: any) => void;
  onTeamClick?: (teamId: string) => void;
}

export function OverviewTab({
  onRepoClick,
  onRepoEdit,
  onRepoDelete,
  onTeamClick,
}: OverviewTabProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pinned repositories */}
        <div className="bg-bg-surface border border-border rounded-xl p-4 flex flex-col gap-3">
          <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
            Pinned repositories
          </p>
          {REPOS.slice(0, 1).map((repo) => (
            <RepoCard
              key={repo.id}
              repo={repo}
              onClick={(r) => onRepoClick?.(r)}
              onEdit={(r) => onRepoEdit?.(r)}
              onDelete={(r) => onRepoDelete?.(r)}
            />
          ))}
        </div>

        <div className="bg-bg-surface border border-border rounded-xl p-4 flex flex-col gap-3">
          <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
            Top contributors
          </p>
          <div className="space-y-2">
            {Object.entries(
              ACTIVITY.reduce(
                (acc, item) => {
                  if (!acc[item.actor]) {
                    acc[item.actor] = {
                      count: 0,
                      name: item.actorName,
                    };
                  }
                  acc[item.actor].count += 1;
                  return acc;
                },
                {} as Record<string, { count: number; name: string }>,
              ),
            )
              .sort((a, b) => b[1].count - a[1].count)
              .slice(0, 5)
              .map(([actor, { count, name }]) => (
                <div key={actor} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar
                      accentClass=""
                      initials={actor.charAt(0)}
                      size="sm"
                    />
                    <span className="text-xs text-text-primary">{name}</span>
                  </div>
                  <span className="text-xs text-text-muted">
                    {count} activities
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Teams summary */}
      <div className="bg-bg-surface border border-border rounded-xl p-4">
        <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-3">
          Teams
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {TEAMS.slice(0, 6).map((team) => {
            const accent = getAccent(team.accentClass);
            return (
              <div
                key={team.id}
                onClick={() => onTeamClick?.(team.id.toString())}
                className="flex items-center gap-2 p-2.5 bg-bg-base border border-border rounded-lg
                           hover:border-border-strong cursor-pointer transition-colors group"
              >
                <div
                  className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0
                    ${accent.bg} border ${accent.border}`}
                >
                  <Users size={13} className={accent.text} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-text-primary font-mono truncate">
                    {team.name}
                  </p>
                  <p className="text-[10px] text-text-muted">
                    {team.memberCount} members
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
