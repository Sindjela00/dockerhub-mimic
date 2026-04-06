import type { Repository } from "../repositories.api";
import { updateRepository } from "../repositories.api";
import { useState } from "react";

interface UseUpdateRepositoryReturn {
  saving: boolean;
  error: string;
  update: (
    repo: Pick<Repository, "id" | "name" | "description" | "visibility">,
  ) => Promise<boolean>;
}

export function useEditRepository(): UseUpdateRepositoryReturn {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const update = async (
    repo: Pick<Repository, "id" | "name" | "description" | "visibility">,
  ): Promise<boolean> => {
    try {
      setSaving(true);
      setError("");
      await updateRepository(repo.id, {
        name: repo.name,
        description: repo.description,
        visibility: repo.visibility,
      });
      return true;
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to save changes.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  return { saving, error, update };
}
