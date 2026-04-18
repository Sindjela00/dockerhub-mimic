import {
  Team,
  UpdateTeamPayload,
  deleteTeam,
  fetchTeam,
  updateTeam,
} from "@/services/organizations/organizations.api";
import { useCallback, useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

export function useTeam(token: string, orgName: string, teamName: string) {
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!orgName || !teamName) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTeam(orgName, teamName, token);
      setTeam(data);
    } catch {
      setError("Failed to load team");
    } finally {
      setLoading(false);
    }
  }, [orgName, teamName, token]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const remove = useCallback(async () => {
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await deleteTeam(orgName, teamName, token);
      navigate(`/organizations/${orgName}`, { replace: true });
    } catch {
      setDeleteError("Failed to delete team. Please try again.");
      throw new Error("Delete failed");
    } finally {
      setDeleteLoading(false);
    }
  }, [orgName, teamName, token, navigate]);

  const update = useCallback(
    async (payload: UpdateTeamPayload) => {
      const updated = await updateTeam(orgName, teamName, payload, token);
      setTeam(updated);
      if (payload.name !== teamName) {
        navigate(`/organizations/${orgName}/teams/${payload.name}`, {
          replace: true,
        });
      }
    },
    [orgName, teamName, token, navigate],
  );

  return {
    team,
    loading,
    error,
    refetch: fetch,
    updateTeam: update,
    deleteTeam: remove,
    deleteLoading,
    deleteError,
  };
}
