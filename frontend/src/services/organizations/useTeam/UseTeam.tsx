import {
  Team,
  UpdateTeamPayload,
  deleteTeam,
  fetchTeam,
  updateTeam,
} from "@/services/organizations/organizations.api";
import { useCallback, useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

export function useTeam(orgName: string, teamName: string) {
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
      const data = await fetchTeam(orgName, teamName);
      setTeam(data);
    } catch {
      setError("Failed to load team");
    } finally {
      setLoading(false);
    }
  }, [orgName, teamName]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const remove = useCallback(async () => {
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await deleteTeam(orgName, teamName);
      navigate(`/organizations/${orgName}`, { replace: true });
    } catch {
      setDeleteError("Failed to delete team. Please try again.");
      throw new Error("Delete failed");
    } finally {
      setDeleteLoading(false);
    }
  }, [orgName, teamName, navigate]);

  const update = useCallback(
    async (payload: UpdateTeamPayload) => {
      const updated = await updateTeam(orgName, teamName, payload);
      setTeam(updated);
      if (payload.name !== teamName) {
        navigate(`/organizations/${orgName}/teams/${payload.name}`, {
          replace: true,
        });
      }
    },
    [orgName, teamName, navigate],
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
