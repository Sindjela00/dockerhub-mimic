import {
  TeamMember,
  addTeamMember,
  fetchTeamMembers,
  removeTeamMember,
} from "@/services/organizations/organizations.api";
import { useCallback, useState } from "react";

export function useTeamMembers(orgName: string, teamName: string) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    if (!orgName || !teamName) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTeamMembers(orgName, teamName);
      setMembers(data.members);
      setTotal(data.total);
    } catch {
      setError("Failed to load members");
    } finally {
      setLoading(false);
    }
  }, [orgName, teamName]);

  const addMember = useCallback(
    async (userId: number) => {
      await addTeamMember(orgName, teamName, userId);
      await fetchMembers();
    },
    [orgName, teamName, fetchMembers],
  );

  const removeMember = useCallback(
    async (userId: number) => {
      await removeTeamMember(orgName, teamName, userId);
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
      setTotal((prev) => prev - 1);
    },
    [orgName, teamName],
  );

  return {
    members,
    total,
    loading,
    error,
    fetchMembers,
    addMember,
    removeMember,
  };
}
