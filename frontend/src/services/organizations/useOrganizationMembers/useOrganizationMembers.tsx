import {
  InviteMemberPayload,
  OrganizationMember,
  fetchOrganizationMembers,
  inviteOrganizationMember,
} from "@/services/organizations/organizations.api";
import { useCallback, useState } from "react";

export function useOrganizationMembers(orgName?: string) {
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchMembers = useCallback(
    async (search = "") => {
      if (!orgName) return;
      setLoading(true);
      setError(null);
      try {
        const data = await fetchOrganizationMembers(orgName, search);
        setMembers(data.members);
        setTotal(data.total);
      } catch {
        setError("Failed to load members");
      } finally {
        setLoading(false);
      }
    },
    [orgName],
  );

  const inviteMember = useCallback(
    async (payload: InviteMemberPayload) => {
      if (!orgName) return;
      await inviteOrganizationMember(orgName, payload);
      await fetchMembers(searchQuery);
    },
    [orgName, fetchMembers, searchQuery],
  );

  return {
    members,
    total,
    loading,
    error,
    fetchMembers,
    inviteMember,
    searchQuery,
    setSearchQuery,
  };
}
