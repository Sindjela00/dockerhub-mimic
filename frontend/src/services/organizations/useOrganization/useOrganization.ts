import { Organization, deleteOrganization } from "../organizations.api";
import { useCallback, useEffect, useState } from "react";

import { fetchOrganization } from "../organizations.api";
import { useNavigate } from "react-router-dom";

export function useOrganization(orgName?: string) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchOrg = useCallback(async () => {
    if (!orgName) return;

    setLoading(true);
    setError(null);

    try {
      const org = await fetchOrganization(orgName);
      setOrganization(org);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [orgName]);

  useEffect(() => {
    fetchOrg();
  }, [fetchOrg]);

  const remove = useCallback(async () => {
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      if (!orgName) throw new Error("Organization name is missing");
      await deleteOrganization(orgName);
      navigate("/organizations", { replace: true });
    } catch {
      setDeleteError("Failed to delete organization. Please try again.");
      throw new Error("Delete failed");
    } finally {
      setDeleteLoading(false);
    }
  }, [orgName, navigate]);

  return {
    organization,
    loading,
    error,
    refetch: fetchOrg,
    remove,
    deleteLoading,
    deleteError,
  };
}
