import { Plus, Search } from "lucide-react";

import Button from "@/components/Button/Button";
import InputField from "@/components/InputField/InputField";
import { TEAMS } from "../../mock/mock";
import { TeamCard } from "@/components/Cards/TeamCard/TeamCard";
import { useState } from "react";

interface TeamsTabProps {
  onNewTeamClick?: () => void;
  onTeamClick?: (teamId: string) => void;
}

export function TeamsTab({ onNewTeamClick, onTeamClick }: TeamsTabProps) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "members" | "repos">("name");

  const filtered = TEAMS.filter(
    (team) =>
      team.name.toLowerCase().includes(search.toLowerCase()) ||
      team.description.toLowerCase().includes(search.toLowerCase()),
  );

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "members") return b.memberCount - a.memberCount;
    if (sortBy === "repos") return b.repoCount - a.repoCount;
    return 0;
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-1 min-w-[200px]">
          <div className="flex-1 max-w-sm">
            <InputField
              value={search}
              onChange={setSearch}
              placeholder="Search teams..."
              startIcon={<Search size={13} />}
              className="w-full"
            />
          </div>
        </div>

        <Button variant="primary" size="md" onClick={onNewTeamClick}>
          <Plus size={15} /> New team
        </Button>
      </div>

      {/* Stats */}
      <p className="text-xs text-text-muted">
        {filtered.length} of {TEAMS.length} teams
      </p>

      {/* Teams grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sorted.length === 0 ? (
          <div className="col-span-2 text-center py-12">
            <p className="text-sm text-text-muted">No teams found.</p>
          </div>
        ) : (
          sorted.map((team) => (
            <TeamCard
              key={team.id}
              id={team.id.toString()}
              name={team.name}
              description={team.description}
              memberCount={team.memberCount}
              repoCount={team.repoCount}
              access={team.access}
              accentClass={team.accentClass}
              onClick={onTeamClick}
            />
          ))
        )}
      </div>
    </div>
  );
}
