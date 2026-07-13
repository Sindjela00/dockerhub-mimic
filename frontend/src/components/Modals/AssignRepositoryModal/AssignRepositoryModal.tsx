// AssignRepositoryModal.tsx

import { PERMISSIONS, Permission } from "./types/types";
import {
  Team,
  fetchOrganizationTeams,
} from "@/services/organizations/organizations.api";
import { useEffect, useState } from "react";

import Button from "@/components/Button/Button";
import { Loader2 } from "lucide-react";
import Modal from "../Modal";
import { RepositoryTeam } from "@/services/repositories/repositories.api";
import { useTeamRepositories } from "@/services/organizations/useTeamRepositories/useTeamRepositories";

interface AssignRepositoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgName: string;
  repoId: number;
  assignedTeams: RepositoryTeam[];
}

export default function AssignRepositoryModal({
  isOpen,
  onClose,
  orgName,
  repoId,
  assignedTeams,
}: AssignRepositoryModalProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [teamsError, setTeamsError] = useState<string | null>(null);

  const [selectedTeamName, setSelectedTeamName] = useState("");
  const [selectedPermission, setSelectedPermission] =
    useState<Permission>("read-only");

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || !orgName) return;
    setTeamsLoading(true);
    setTeamsError(null);
    fetchOrganizationTeams(orgName)
      .then((res) => {
        console.log("Fetched teams:", res.teams, assignedTeams);
        const filteredTeams = res.teams.filter(
          (t) => !assignedTeams.some((at) => at.teamId === t.id),
        );
        setTeams(filteredTeams);
        const firstAvailable =
          filteredTeams.length > 0 ? filteredTeams[0] : null;
        setSelectedTeamName(firstAvailable?.name ?? "");
      })
      .catch((e) => setTeamsError(e?.message ?? "Failed to load teams"))
      .finally(() => setTeamsLoading(false));
  }, [isOpen, orgName]);

  const { addRepository } = useTeamRepositories(orgName, selectedTeamName);

  const handleSubmit = async () => {
    if (!selectedTeamName) return;
    setSubmitting(true);
    try {
      await addRepository({
        repositoryId: repoId,
        permission: selectedPermission,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const selectClass =
    "w-full h-10 px-3 rounded-lg bg-bg-elevated border border-border text-sm text-text-primary cursor-pointer focus:outline-none focus:border-border-strong transition-colors";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign Repository to Team">
      {teamsLoading ? (
        <div className="flex items-center justify-center py-8 text-text-secondary">
          <Loader2 size={18} className="animate-spin mr-2" />
          <span className="text-sm">Loading teams…</span>
        </div>
      ) : teamsError ? (
        <p className="text-sm text-red-400 py-4">{teamsError}</p>
      ) : teams.length === 0 ? (
        <p className="text-sm text-text-secondary py-4">
          No teams available to assign.
        </p>
      ) : teams.length === 0 ? (
        <p className="text-sm text-text-secondary py-4">
          All teams are already assigned to this repository.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-secondary">
              Team
            </label>
            <select
              value={selectedTeamName}
              onChange={(e) => setSelectedTeamName(e.target.value)}
              className={selectClass}
            >
              {teams.map((team) => (
                <option key={team.id} value={team.name}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-secondary">
              Permission
            </label>
            <select
              value={selectedPermission}
              onChange={(e) =>
                setSelectedPermission(e.target.value as Permission)
              }
              className={selectClass}
            >
              {PERMISSIONS.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button size="sm" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSubmit} disabled={submitting}>
              {submitting && (
                <Loader2 size={14} className="animate-spin mr-1.5" />
              )}
              Assign
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
