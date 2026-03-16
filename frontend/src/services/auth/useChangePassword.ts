import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { changePassword, type ChangePasswordPayload } from "./auth.api";

interface UseChangePasswordReturn {
  loading: boolean;
  error: string;
  handleChangePassword: (payload: ChangePasswordPayload) => Promise<boolean>;
}

export function useChangePassword(): UseChangePasswordReturn {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChangePassword = async (
    payload: ChangePasswordPayload,
  ): Promise<boolean> => {
    setLoading(true);
    setError("");

    try {
      await changePassword(payload);
      return true;
    } catch (err: any) {
      const message =
        err.response?.data?.message ??
        "Password change failed. Please try again.";
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, handleChangePassword };
}
