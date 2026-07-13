import { type AdminSummary, listAdmins } from "../admin.api";
import { useCallback, useEffect, useState } from "react";

interface UseListAdminsReturn {
  admins: AdminSummary[];
  loading: boolean;
  error: string;
  refetch: () => Promise<void>;
}

export function useListAdmins(): UseListAdminsReturn {
  const [admins, setAdmins] = useState<AdminSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await listAdmins();
      setAdmins(data);
    } catch (err: any) {
      const message =
        err.response?.data?.message ?? "Failed to load administrators.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  return { admins, loading, error, refetch: fetchAdmins };
}
