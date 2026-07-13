import { AlertCircle, GitBranch, Loader2, Users } from "lucide-react";
import { useEffect, useState } from "react";

import AssignRepositoryModal from "@/components/Modals/AssignRepositoryModal/AssignRepositoryModal";
import Button from "@/components/Button/Button";
import { TeamCard } from "@/components/Cards/TeamCard/TeamCard";
import { useNavigate } from "react-router-dom";
import { useRepositoryTeams } from "@/services/repositories/useRepositoryTeams/useRepositoryTeams";

interface TeamsTabProps {
  repoId: number;
  orgName: string;
}

export default function TeamsTab({ orgName, repoId }: TeamsTabProps) {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { teams, loading, error, fetchTeams, removeTeam, updatePermission } =
    useRepositoryTeams(repoId, orgName);

  useEffect(() => {
    fetchTeams();
  }, [orgName]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-text-secondary">
        <Loader2 size={20} className="animate-spin mr-2" />
        <span className="text-sm">Loading teams…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 py-10 text-sm text-red-400">
        <AlertCircle size={15} />
        {error}
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-end mb-4">
        <Button
          size="md"
          variant="primary"
          onClick={() => setIsModalOpen(true)}
        >
          <GitBranch size={14} className="mr-1.5" />
          Assign Team
        </Button>
      </div>

      {teams.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-text-secondary">
          <Users size={32} className="opacity-30" />
          <p className="text-sm">No teams assigned to this repository.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {teams.map((team, i) => (
            <TeamCard
              key={team.teamId}
              id={String(team.teamId)}
              name={team.teamName}
              memberCount={0}
              accentClass={`accent-${i % 6}`}
              permission={team.permission}
              onPermissionChange={(_, permission) =>
                updatePermission(team.teamId, permission)
              }
              onClick={() =>
                navigate(`/organizations/${orgName}/teams/${team.teamName}`)
              }
              onRemove={() => removeTeam(team.teamId, team.teamName)}
            />
          ))}
        </div>
      )}

      <AssignRepositoryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          fetchTeams();
        }}
        orgName={orgName}
        repoId={repoId}
        assignedTeams={teams}
      />
    </>
  );
}
