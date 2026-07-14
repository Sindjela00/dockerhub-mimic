// src/services/repositories/useRepository/useRepository.ts
import { useEffect, useState } from "react";
import { getRepositoryById, type Repository } from "../repositories.api";

interface UseRepositoryState {
  repo: Repository | null;
  loading: boolean;
  error: string;
}

interface UseRepositoryReturn extends UseRepositoryState {
  setRepo: React.Dispatch<React.SetStateAction<Repository | null>>;
}

export function useRepository(id: number | undefined): UseRepositoryReturn {
  const [repo, setRepo] = useState<Repository | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!id) {
        setError("Repository ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const { data } = await getRepositoryById(id);
        if (cancelled) return;
        setRepo(data);
      } catch (err: any) {
        if (cancelled) return;
        setError(err?.response?.data?.message ?? "Failed to load repository.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return { repo, loading, error, setRepo };
}
