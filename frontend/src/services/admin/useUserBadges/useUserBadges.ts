import {
  type BadgeName,
  type UserBadgeSummary,
  searchUsersForBadges,
  setUserBadge,
} from "../admin.api";
import { useCallback, useState } from "react";

interface UseUserBadgesReturn {
  users: UserBadgeSummary[];
  total: number;
  loading: boolean;
  error: string;
  search: (query?: string) => Promise<void>;
  toggleBadge: (
    userId: number,
    badge: BadgeName,
    value: boolean,
  ) => Promise<void>;
}

export function useUserBadges(): UseUserBadgesReturn {
  const [users, setUsers] = useState<UserBadgeSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const search = useCallback(async (query?: string) => {
    setLoading(true);
    setError("");

    try {
      const { data } = await searchUsersForBadges(query);
      setUsers(data.users);
      setTotal(data.total);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleBadge = useCallback(
    async (userId: number, badge: BadgeName, value: boolean) => {
      setError("");
      try {
        const { data } = await setUserBadge(userId, badge, value);
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? data.user : u)),
        );
      } catch (err: any) {
        setError(
          err?.response?.data?.message ?? "Failed to update user badge.",
        );
      }
    },
    [],
  );

  return { users, total, loading, error, search, toggleBadge };
}
