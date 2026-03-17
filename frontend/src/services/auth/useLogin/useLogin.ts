import { LoginPayload, login } from "../auth.api";

import { useAppContext } from "../../../context/AppContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

interface UseLoginReturn {
  loading: boolean;
  error: string;
  handleLogin: (payload: LoginPayload) => Promise<void>;
}

export function useLogin(): UseLoginReturn {
  const navigate = useNavigate();
  const { setAuth } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (payload: LoginPayload) => {
    setLoading(true);
    setError("");

    try {
      const { data } = await login(payload);
      setAuth(data.token, data.role, "fakeUsername");
      navigate("/");
    } catch (err: any) {
      const message =
        err.response?.data?.message ?? "Login failed. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, handleLogin };
}
