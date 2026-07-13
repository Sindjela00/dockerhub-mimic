import { useState } from "react";
import {
  changePassword,
  type ChangePasswordPayload,
  type ChangePasswordResponse,
} from "../auth.api";

interface UseChangePasswordReturn {
  loading: boolean;
  error: string;
  handleChangePassword: (
    payload: ChangePasswordPayload,
  ) => Promise<ChangePasswordResponse | null>;
}

export function useChangePassword(): UseChangePasswordReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChangePassword = async (
    payload: ChangePasswordPayload,
  ): Promise<ChangePasswordResponse | null> => {
    setLoading(true);
    setError("");

    try {
      const { data } = await changePassword(payload);
      return data;
    } catch (err: any) {
      const message =
        err.response?.data?.message ??
        "Password change failed. Please try again.";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, handleChangePassword };
}
