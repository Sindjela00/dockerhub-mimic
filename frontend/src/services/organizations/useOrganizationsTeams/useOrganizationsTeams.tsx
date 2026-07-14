import {
  CreateTeamPayload,
  Team,
  createOrganizationTeam,
  fetchOrganizationTeams,
} from "@/services/organizations/organizations.api";
import { useCallback, useState } from "react";

export function useOrganizationTeams(orgName?: string) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchTeams = useCallback(
    async (search = "") => {
      if (!orgName) return;
      setLoading(true);
      setError(null);
      try {
        const data = await fetchOrganizationTeams(orgName, search);
        setTeams(data.teams);
        setTotal(data.total);
      } catch {
        setError("Failed to load teams");
      } finally {
        setLoading(false);
      }
    },
    [orgName],
  );

  const createTeam = useCallback(
    async (payload: CreateTeamPayload) => {
      if (!orgName) return;
      await createOrganizationTeam(orgName, payload);
      await fetchTeams(searchQuery);
    },
    [orgName, fetchTeams, searchQuery],
  );

  return {
    teams,
    total,
    loading,
    error,
    fetchTeams,
    createTeam,
    searchQuery,
    setSearchQuery,
  };
}
