import { Plus, Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import Button from "@/components/Button/Button";
import CreateTeamModal from "@/components/Modals/CreateTeamModal/CreateTeamModal";
import InputField from "@/components/InputField/InputField";
import { TeamCard } from "@/components/Cards/TeamCard/TeamCard";
import { useNavigate } from "react-router-dom";
import { useOrganizationTeams } from "@/services/organizations/useOrganizationsTeams/useOrganizationsTeams";

interface TeamsTabProps {
  orgName: string;
  token: string;
}

export function TeamsTab({ orgName, token }: TeamsTabProps) {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<"name" | "members" | "repos">("name");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const {
    teams,
    total,
    loading,
    error,
    fetchTeams,
    createTeam,
    searchQuery,
    setSearchQuery,
  } = useOrganizationTeams(token, orgName);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialFetchDone = useRef(false);

  useEffect(() => {
    if (!initialFetchDone.current) {
      fetchTeams("");
      initialFetchDone.current = true;
    }
  }, [fetchTeams]);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => fetchTeams(value), 300);
    },
    [fetchTeams, setSearchQuery],
  );

  const sorted = [...teams].sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "members") return b.memberCount - a.memberCount;
    if (sortBy === "repos") return b.repositoryCount - a.repositoryCount;
    return 0;
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-1 min-w-[200px]">
          <div className="flex-1 max-w-sm">
            <InputField
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search teams..."
              startIcon={<Search size={13} />}
              className="w-full"
            />
          </div>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus size={15} /> New team
        </Button>
      </div>

      {/* Count */}
      <p className="text-xs text-text-muted">
        {teams.length} of {total} teams
      </p>

      {/* Loading */}
      {loading && (
        <div className="text-sm text-text-secondary py-8 text-center">
          Loading teams...
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="bg-error-muted border border-error text-error p-4 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Grid */}
      {!loading && !error && (
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
                repoCount={team.repositoryCount}
                access={team.access ?? ""}
                accentClass={team.accentClass ?? ""}
                onClick={() =>
                  navigate(`/organizations/${orgName}/teams/${team.name}`)
                }
              />
            ))
          )}
        </div>
      )}

      <CreateTeamModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={createTeam}
      />
    </div>
  );
}
