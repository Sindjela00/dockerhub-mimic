import { useCallback, useEffect, useState } from "react";

import { Organization } from "../organizations.api";
import { fetchOrganization } from "../organizations.api";

export function useOrganization(token: string, orgName?: string) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrg = useCallback(async () => {
    if (!orgName || !token) return;

    setLoading(true);
    setError(null);

    try {
      const org = await fetchOrganization(orgName, token);
      setOrganization(org);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [orgName, token]);

  useEffect(() => {
    fetchOrg();
  }, [fetchOrg]);

  return { organization, loading, error, refetch: fetchOrg };
}
