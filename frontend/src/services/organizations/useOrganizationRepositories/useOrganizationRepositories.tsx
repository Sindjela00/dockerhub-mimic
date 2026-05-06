import {
  CreateRepositoryPayload,
  Repository,
} from "@/services/repositories/repositories.api";
import {
  createOrgRepository,
  fetchOrganizationRepositories,
} from "../organizations.api";
import { useCallback, useState } from "react";

export function useOrganizationRepositories(
  token?: string | null,
  orgName?: string,
) {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchRepos = useCallback(
    async (search?: string) => {
      if (!orgName || !token) return;

      setLoading(true);
      setError(null);

      try {
        const searchTerm = search !== undefined ? search : "";
        const data = await fetchOrganizationRepositories(
          orgName,
          token,
          searchTerm,
        );
        setRepositories(data.repositories);
        setTotal(data.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    },
    [orgName, token],
  );

  const handleCreate = useCallback(
    async (payload: CreateRepositoryPayload): Promise<Repository | null> => {
      if (!orgName) return null;

      setCreating(true);
      setCreateError(null);

      try {
        const { data } = await createOrgRepository(orgName, payload);
        return data.repository;
      } catch (err: any) {
        setCreateError(
          err?.response?.data?.message ?? "Failed to create repository.",
        );
        return null;
      } finally {
        setCreating(false);
      }
    },
    [orgName],
  );

  return {
    repositories,
    total,
    loading,
    error,
    fetchRepos,
    handleCreate,
    creating,
    createError,
    searchQuery,
    setSearchQuery,
  };
}
