import {
  AddTeamRepositoryPayload,
  TeamRepository,
  addTeamRepository,
  fetchTeamRepositories,
} from "@/services/organizations/organizations.api";
import { useCallback, useState } from "react";

import { Repository } from "@/services/repositories/repositories.api";
import { fetchOrganizationRepositories } from "@/services/organizations/organizations.api";
import { removeRepositoryFromTeam } from "@/services/organizations/organizations.api";

export function useTeamRepositories(orgName: string, teamName: string) {
  const [repositories, setRepositories] = useState<TeamRepository[]>([]);
  const [orgRepositories, setOrgRepositories] = useState<Repository[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRepos = useCallback(async () => {
    if (!orgName || !teamName) return;
    setLoading(true);
    setError(null);
    try {
      const [teamData, orgData] = await Promise.all([
        fetchTeamRepositories(orgName, teamName),
        fetchOrganizationRepositories(orgName),
      ]);
      setRepositories(teamData.repositories);
      setTotal(teamData.total);
      setOrgRepositories(orgData.repositories);
    } catch {
      setError("Failed to load repositories");
    } finally {
      setLoading(false);
    }
  }, [orgName, teamName]);

  const addRepository = useCallback(
    async (payload: AddTeamRepositoryPayload) => {
      await addTeamRepository(orgName, teamName, payload);
      await fetchRepos();
    },
    [orgName, teamName, fetchRepos],
  );

  const removeRepository = useCallback(
    async (repositoryId: number) => {
      await removeRepositoryFromTeam(orgName, teamName, repositoryId);
      await fetchRepos();
    },
    [orgName, teamName, fetchRepos],
  );

  return {
    repositories,
    orgRepositories,
    total,
    loading,
    error,
    fetchRepos,
    addRepository,
    removeRepository,
  };
}
