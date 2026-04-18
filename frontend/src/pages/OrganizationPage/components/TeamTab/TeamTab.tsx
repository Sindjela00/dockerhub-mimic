import { useEffect, useRef, useState } from "react";

import Button from "@/components/Button/Button";
import CreateTeamModal from "@/components/Modals/CreateTeamModal/CreateTeamModal";
import { Organization } from "@/services/organizations/organizations.api";
import { Plus } from "lucide-react";
import { TeamCard } from "@/components/Cards/TeamCard/TeamCard";
import { useNavigate } from "react-router-dom";
import { useOrganizationTeams } from "@/services/organizations/useOrganizationsTeams/useOrganizationsTeams";

interface TeamsTabProps {
  orgName: string;
  token: string;
  organization: Organization;
}

export function TeamsTab({ orgName, token, organization }: TeamsTabProps) {
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { teams, total, loading, error, fetchTeams, createTeam } =
    useOrganizationTeams(token, orgName);

  const initialFetchDone = useRef(false);

  useEffect(() => {
    if (!initialFetchDone.current) {
      fetchTeams("");
      initialFetchDone.current = true;
    }
  }, [fetchTeams]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between">
        <p className="text-xs text-text-muted">
          {teams.length} of {total} teams
        </p>
        <div
          className={
            organization.currentUserRole === "owner" ||
            organization.currentUserRole === "admin"
              ? "block"
              : "hidden"
          }
        >
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsCreateModalOpen(true)}
            className="w-fit"
          >
            <Plus size={15} /> New team
          </Button>
        </div>
      </div>

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
          {teams.length === 0 ? (
            <div className="col-span-2 text-center py-12">
              <p className="text-sm text-text-muted">No teams found.</p>
            </div>
          ) : (
            teams.map((team) => (
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
