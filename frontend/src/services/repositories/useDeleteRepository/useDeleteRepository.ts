import { deleteRepository } from "../repositories.api";
import { useState } from "react";

interface UseDeleteRepositoryReturn {
  loading: boolean;
  error: string;
  handleDelete: (id: number) => Promise<boolean>;
}

export function useDeleteRepository(): UseDeleteRepositoryReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async (id: number): Promise<boolean> => {
    setLoading(true);
    setError("");
    try {
      await deleteRepository(id);
      return true;
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to delete repository.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, handleDelete };
}
