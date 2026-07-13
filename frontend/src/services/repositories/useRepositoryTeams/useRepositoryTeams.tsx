import {
  RepositoryTeam,
  getRepositoryTeams,
  updateRepositoryTeamPermission,
} from "@/services/repositories/repositories.api";

import { removeRepositoryFromTeam } from "@/services/organizations/organizations.api";
import { useState } from "react";

export function useRepositoryTeams(repoId: number, orgName: string) {
  const [teams, setTeams] = useState<RepositoryTeam[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTeams = () => {
    if (!orgName) return;
    setLoading(true);
    setError(null);
    getRepositoryTeams(repoId)
      .then((res) => setTeams(res.data.teams))
      .catch((e) => setError(e?.message ?? "Failed to load teams"))
      .finally(() => setLoading(false));
  };

  const removeTeam = async (teamId: number, teamName: string) => {
    await removeRepositoryFromTeam(orgName, teamName, repoId);
    setTeams((prev) => prev.filter((t) => t.teamId !== teamId));
  };

  const updatePermission = async (teamId: number, permission: string) => {
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

  return { teams, loading, error, fetchTeams, removeTeam, updatePermission };
}
