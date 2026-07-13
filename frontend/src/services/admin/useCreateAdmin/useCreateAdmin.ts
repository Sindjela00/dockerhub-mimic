import {
  createAdmin,
  type CreateAdminPayload,
  type CreateAdminResponse,
} from "../admin.api";

import { useState } from "react";

interface UseCreateAdminReturn {
  loading: boolean;
  error: string;
  handleCreateAdmin: (
    payload: CreateAdminPayload,
  ) => Promise<CreateAdminResponse | null>;
}

export function useCreateAdmin(): UseCreateAdminReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreateAdmin = async (
    payload: CreateAdminPayload,
  ): Promise<CreateAdminResponse | null> => {
    setLoading(true);
    setError("");

    try {
      const { data } = await createAdmin(payload);
      return data;
    } catch (err: any) {
      const message =
        err.response?.data?.message ??
        "Failed to create administrator. Please try again.";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, handleCreateAdmin };
}
