import { RegisterPayload, register } from "./auth.api";

import { useNavigate } from "react-router-dom";
import { useState } from "react";

interface UseRegisterReturn {
  loading: boolean;
  error: string;
  handleRegister: (payload: RegisterPayload) => Promise<void>;
}

export function useRegister(): UseRegisterReturn {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (payload: RegisterPayload) => {
    setLoading(true);
    setError("");

    try {
      await register(payload);
      navigate("/login");
    } catch (err: any) {
      const message =
        err.response?.data?.message ?? "Registration failed. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, handleRegister };
}
