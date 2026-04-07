import { type Repository, getMyRepositories } from "../repositories.api";
import type { RepoVisibility } from "@/pages/RepositoriesPage/types/types";
import { useCallback, useEffect, useState } from "react";

interface UseRepositoriesState {
  repos: Repository[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  error: string;
}

interface UseRepositoriesReturn extends UseRepositoriesState {
  fetchRepositories: (
    page?: number,
    mine?: boolean,
    visibility?: RepoVisibility,
    search?: string,
    sortBy?: "createdAt" | "stars",
    sortDir?: "asc" | "desc",
    starred?: boolean,
  ) => Promise<void>;
}

export function useRepositories(initialPageSize = 9): UseRepositoriesReturn {
  const [state, setState] = useState<UseRepositoriesState>({
    repos: [],
    total: 0,
    page: 1,
    pageSize: initialPageSize,
    loading: false,
    error: "",
  });

  const fetchRepositories = useCallback(
    async (
      page = 1,
      mine?: boolean,
      visibility?: RepoVisibility,
      search?: string,
      sortBy?: "createdAt" | "stars",
      sortDir?: "asc" | "desc",
      starred?: boolean,
    ) => {
      setState((s) => ({ ...s, loading: true, error: "" }));

      try {
        const { data } = await getMyRepositories({
          page,
          pageSize: initialPageSize,
          ...(mine !== undefined ? { mine } : {}),
          ...(visibility !== undefined ? { visibility } : {}),
          ...(search?.trim().length ? { search: search.trim() } : {}),
          ...(sortBy ? { sortBy } : {}),
          ...(sortDir ? { sortDir } : {}),
          ...(starred !== undefined ? { starred } : {}),
        });

        setState({
          repos: data.repositories,
          total: data.total,
          page: data.page,
          pageSize: data.pageSize,
          loading: false,
          error: "",
        });
      } catch (err: any) {
        setState((s) => ({
          ...s,
          loading: false,
          error: err?.response?.data?.message ?? "Failed to load repositories.",
        }));
      }
    },
    [initialPageSize],
  );

  return { ...state, fetchRepositories };
}
