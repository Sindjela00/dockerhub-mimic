import { TagDetail, getRepositoryTags } from "../repositories.api";
import { useEffect, useState } from "react";

import { formatSize } from "@/utils/formatSize";

interface UseTagsReturn {
  tags: TagDetail[];
  total: number;
  pullCount: number;
  loading: boolean;
  error: string;
  fetchTags: () => void;
}

export function useTags(repositoryId: number | null): UseTagsReturn {
  const [tags, setTags] = useState<TagDetail[]>([]);
  const [total, setTotal] = useState(0);
  const [pullCount, setPullCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchTags = () => {
    if (!repositoryId) return;

    setLoading(true);
    setError("");

    getRepositoryTags(repositoryId)
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
  }, [repositoryId]);

  return { tags, total, pullCount, loading, error, fetchTags };
}
