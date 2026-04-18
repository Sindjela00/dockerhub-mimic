import {
  TeamMember,
  addTeamMember,
  fetchTeamMembers,
} from "@/services/organizations/organizations.api";
import { useCallback, useState } from "react";

export function useTeamMembers(
  token: string,
  orgName: string,
  teamName: string,
) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    if (!orgName || !teamName) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTeamMembers(orgName, teamName, token);
      setMembers(data.members);
      setTotal(data.total);
    } catch {
      setError("Failed to load members");
    } finally {
      setLoading(false);
    }
  }, [orgName, teamName, token]);

  const addMember = useCallback(
    async (userId: number) => {
      await addTeamMember(orgName, teamName, userId, token);
      await fetchMembers();
    },
    [orgName, teamName, token, fetchMembers],
  );

  return { members, total, loading, error, fetchMembers, addMember };
}
