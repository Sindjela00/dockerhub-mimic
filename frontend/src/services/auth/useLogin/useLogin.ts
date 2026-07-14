import { LoginPayload, login } from "../auth.api";
import { useNavigate, useSearchParams } from "react-router-dom";

import { useAppContext } from "../../../context/AppContext";
import { useState } from "react";

interface UseLoginReturn {
  loading: boolean;
  error: string;
  handleLogin: (payload: LoginPayload) => Promise<void>;
}

export function useLogin(): UseLoginReturn {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAuth } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (payload: LoginPayload) => {
    setLoading(true);
    setError("");

    try {
      const { data } = await login(payload);
      setAuth(data.token, data.role, payload.identifier, data.mustChangePassword);
      if (data.token) {
        if (data.mustChangePassword) {
          navigate("/change-password?forced=true", { replace: true });
        } else {
          const returnTo = searchParams.get("returnTo");
          navigate(returnTo ? decodeURIComponent(returnTo) : "/", {
            replace: true,
          });
        }
      }
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
