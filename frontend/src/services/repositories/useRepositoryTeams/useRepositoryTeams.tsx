import {
  RepositoryTeam,
  getRepositoryTeams,
  updateRepositoryTeamPermission,
} from "@/services/repositories/repositories.api";

import { removeRepositoryFromTeam } from "@/services/organizations/organizations.api";
import { useState } from "react";

export function useRepositoryTeams(
  repoId: number,
  orgName: string,
  token: string,
) {
  const [teams, setTeams] = useState<RepositoryTeam[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTeams = () => {
    if (!orgName || !token) return;
    setLoading(true);
    setError(null);
    getRepositoryTeams(repoId, token)
      .then((res) => setTeams(res.data.teams))
      .catch((e) => setError(e?.message ?? "Failed to load teams"))
      .finally(() => setLoading(false));
  };

  const removeTeam = async (teamId: number, teamName: string) => {
    if (!token) return;
    await removeRepositoryFromTeam(orgName, teamName, repoId, token);
    setTeams((prev) => prev.filter((t) => t.teamId !== teamId));
  };

  const updatePermission = async (teamId: number, permission: string) => {
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

  return { teams, loading, error, fetchTeams, removeTeam, updatePermission };
}
