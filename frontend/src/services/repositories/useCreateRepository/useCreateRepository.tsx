import {
  CreateRepositoryPayload,
  Repository,
  createRepository,
} from "../repositories.api";

import { useState } from "react";

interface UseCreateRepositoryReturn {
  loading: boolean;
  error: string;
  handleCreate: (
    payload: CreateRepositoryPayload,
  ) => Promise<Repository | null>;
}

export function useCreateRepository(): UseCreateRepositoryReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async (
    payload: CreateRepositoryPayload,
  ): Promise<Repository | null> => {
    setLoading(true);
    setError("");
    try {
      const { data } = await createRepository(payload);
      return data.repository;
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to create repository.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, handleCreate };
}
