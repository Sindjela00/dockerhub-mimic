import {
  Organization,
  deleteTeam,
} from "@/services/organizations/organizations.api";
import { useEffect, useRef, useState } from "react";

import Button from "@/components/Button/Button";
import CreateTeamModal from "@/components/Modals/CreateTeamModal/CreateTeamModal";
import { Plus } from "lucide-react";
import { TeamRow } from "@/components/Cards/TeamComplexCard/TeamRow/TeamRow";
import { useOrganizationTeams } from "@/services/organizations/useOrganizationsTeams/useOrganizationsTeams";

interface TeamsTabProps {
  orgName: string;
  token: string;
  organization: Organization;
}

export function TeamsTab({ orgName, token, organization }: TeamsTabProps) {
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

  const handleDeleteTeam = async (teamName: string) => {
    try {
      await deleteTeam(orgName, teamName, token);
      fetchTeams("");
    } catch {
      // error
    }
  };

  const isPrivileged =
    organization.currentUserRole === "owner" ||
    organization.currentUserRole === "admin";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between">
        <p className="text-xs text-text-muted">
          {teams.length} of {total} teams
        </p>
        {isPrivileged && (
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsCreateModalOpen(true)}
            className="w-fit"
          >
            <Plus size={15} /> New team
          </Button>
        )}
      </div>

      {loading && (
        <div className="text-sm text-text-secondary py-8 text-center">
          Loading teams...
        </div>
      )}

      {error && !loading && (
        <div className="bg-error-muted border border-error text-error p-4 rounded-lg text-sm">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="flex flex-col gap-2">
          {teams.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-text-muted">No teams found.</p>
            </div>
          ) : (
            teams.map((team) => (
              <TeamRow
                key={team.id}
                team={team}
                orgName={orgName}
                onDelete={isPrivileged ? handleDeleteTeam : undefined}
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
