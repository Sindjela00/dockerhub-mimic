import {
  OrganizationInvite,
  cancelMemberInvite,
  fetchMembersInvites,
} from "../organizations.api";
import { useCallback, useState } from "react";

import api from "@/lib/api";

const BASE_URL = "/api";

export function useOrganizationInvites(token: string, orgName: string) {
  const [invites, setInvites] = useState<OrganizationInvite[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInvites = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchMembersInvites(orgName, token);
      setInvites(res);
    } catch {
      setError("Failed to load invites.");
    } finally {
      setLoading(false);
    }
  }, [token, orgName]);

  const cancelInvite = useCallback(
    async (inviteId: number) => {
      await cancelMemberInvite(inviteId, orgName, token);
      await fetchInvites();
    },
    [token, orgName, fetchInvites],
  );

  return { invites, loading, error, fetchInvites, cancelInvite };
}
