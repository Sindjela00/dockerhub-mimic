import { Repository, getMyRepositories } from "../repositories.api";
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
  fetchRepositories: (page?: number) => Promise<void>;
}

export function useRepositories(initialPageSize = 20): UseRepositoriesReturn {
  const [state, setState] = useState<UseRepositoriesState>({
    repos: [],
    total: 0,
    page: 1,
    pageSize: initialPageSize,
    loading: false,
    error: "",
  });

  const fetchRepositories = useCallback(
    async (page = 1) => {
      setState((s) => ({ ...s, loading: true, error: "" }));
      try {
        const { data } = await getMyRepositories({
          page,
          pageSize: initialPageSize,
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

  useEffect(() => {
    fetchRepositories(1);
  }, [fetchRepositories]);

  return { ...state, fetchRepositories };
}
