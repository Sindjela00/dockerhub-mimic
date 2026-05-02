import { AlertCircle, GitBranch, Loader2, Users } from "lucide-react";
import {
  RepositoryTeam,
  getRepositoryTeams,
} from "@/services/repositories/repositories.api";
import { useEffect, useState } from "react";

import AssignRepositoryModal from "@/components/Modals/AssignRepositoryModal/AssignRepositoryModal";
import Button from "@/components/Button/Button";
import { TeamCard } from "@/components/Cards/TeamCard/TeamCard";
import { removeRepositoryFromTeam } from "@/services/organizations/organizations.api";
import { updateRepositoryTeamPermission } from "@/services/repositories/repositories.api";
import { useAuth } from "@/context/AppContext";
import { useNavigate } from "react-router-dom";

interface TeamsTabProps {
  repoId: number;
  orgName: string;
}

export default function TeamsTab({ orgName, repoId }: TeamsTabProps) {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [teams, setTeams] = useState<RepositoryTeam[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [teamsError, setTeamsError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchTeams = () => {
    if (!orgName || !token) return;
    setTeamsLoading(true);
    getRepositoryTeams(repoId, token)
      .then((res) => setTeams(res.data.teams))
      .catch((e) => setTeamsError(e?.message ?? "Failed to load teams"))
      .finally(() => setTeamsLoading(false));
  };

  const handleRemoveTeam = async (teamId: number, teamName: string) => {
    if (!token) return;
    try {
      await removeRepositoryFromTeam(orgName, teamName, repoId, token);
      setTeams((prev) => prev.filter((t) => t.teamId !== teamId));
    } catch {
      // error
    }
  };

  const handlePermissionChange = async (teamId: number, permission: string) => {
    if (!token) return;

    const previous = teams.find((t) => t.teamId === teamId)?.permission;

    setTeams((prev) =>
      prev.map((t) => (t.teamId === teamId ? { ...t, permission } : t)),
    );

    try {
      await updateRepositoryTeamPermission(repoId, teamId, { permission });
    } catch {
      setTeams((prev) =>
        prev.map((t) =>
          t.teamId === teamId ? { ...t, permission: previous ?? "" } : t,
        ),
      );
    }
  };

  useEffect(() => {
    fetchTeams();
  }, [orgName, token]);

  if (teamsLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-text-secondary">
        <Loader2 size={20} className="animate-spin mr-2" />
        <span className="text-sm">Loading teams…</span>
      </div>
    );
  }

  if (teamsError) {
    return (
      <div className="flex items-center gap-2 py-10 text-sm text-red-400">
        <AlertCircle size={15} />
        {teamsError}
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
            <div key={team.id} className="flex flex-col gap-1.5">
              <TeamCard
                key={team.id}
                id={String(team.id)}
                name={team.teamName}
                memberCount={0}
                accentClass={`accent-${i % 6}`}
                permission={team.permission}
                onPermissionChange={(id, permission) =>
                  handlePermissionChange(Number(team.teamId), permission)
                }
                onClick={() =>
                  navigate(`/organizations/${orgName}/teams/${team.teamName}`)
                }
                onRemove={() => handleRemoveTeam(team.teamId, team.teamName)}
              />
            </div>
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
