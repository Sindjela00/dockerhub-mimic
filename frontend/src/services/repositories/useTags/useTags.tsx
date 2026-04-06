import {
  TagDetail,
  TagSortBy,
  TagSortDir,
  deleteTag,
  getRepositoryTags,
} from "../repositories.api";
import { useEffect, useState } from "react";

import { formatSize } from "@/utils/formatSize";

interface UseTagsReturn {
  tags: TagDetail[];
  total: number;
  pullCount: number;
  page: number;
  pageSize: number;
  search: string;
  sortBy: TagSortBy;
  sortDir: TagSortDir;
  loading: boolean;
  error: string;

  setSearch: (v: string) => void;
  setSortBy: (v: TagSortBy) => void;
  setSortDir: (v: TagSortDir) => void;
  changePage: (p: number) => void;
  setPageSize: (s: number) => void;
  deleteTags: (tagNames: string[]) => Promise<void>;

  refetch: () => void;
}

export function useTags(repositoryId: number | null): UseTagsReturn {
  const [tags, setTags] = useState<TagDetail[]>([]);
  const [total, setTotal] = useState(0);
  const [pullCount, setPullCount] = useState(0);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [search, setSearchState] = useState("");
  const [sortBy, setSortBy] = useState<TagSortBy>("createdat");
  const [sortDir, setSortDirState] = useState<TagSortDir>("desc");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const deleteTags = async (tagNames: string[]): Promise<void> => {
    if (!repositoryId) return;
    await Promise.all(tagNames.map((name) => deleteTag(repositoryId, name)));
    fetchTags();
  };

  const fetchTags = () => {
    if (!repositoryId) return;

    setLoading(true);
    setError("");

    getRepositoryTags(repositoryId, {
      search,
      page,
      pageSize,
      sortBy,
      sortDir,
    })
      .then(({ data }) => {
        setTags(
          data.tags.map((t: TagDetail) => ({
            ...t,
            size: formatSize(t.compressedSizeBytes),
          })),
        );
        setTotal(data.total);
        setPullCount(data.pullCount);
      })
      .catch((err: any) => {
        setError(err?.response?.data?.message ?? "Failed to load tags.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTags();
  }, [repositoryId, page, pageSize, search, sortBy, sortDir]);

  const setSearch = (v: string) => {
    setSearchState(v);
    setPage(1);
  };

  const setSortDir = (v: TagSortDir) => {
    setSortDirState(v);
    setPage(1);
  };

  const setSortBySafe = (v: TagSortBy) => {
    setSortBy(v);
    setPage(1);
  };

  const changePage = (p: number) => {
    setPage(p);
  };

  return {
    tags,
    total,
    pullCount,
    page,
    pageSize,
    search,
    sortBy,
    sortDir,
    loading,
    error,

    setSearch,
    setSortBy: setSortBySafe,
    setSortDir,
    changePage,
    setPageSize,
    deleteTags,

    refetch: fetchTags,
  };
}
