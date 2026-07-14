import { type LogEntry, type SearchLogsParams, searchLogs } from "../logs.api";

import { useState } from "react";

interface UseSearchLogsReturn {
  entries: LogEntry[];
  total: number;
  loading: boolean;
  error: string;
  handleSearch: (params: SearchLogsParams) => Promise<void>;
}

export function useSearchLogs(): UseSearchLogsReturn {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (params: SearchLogsParams) => {
    setLoading(true);
    setError("");

    try {
      const { data } = await searchLogs(params);
      setEntries(data.entries);
      setTotal(data.total);
    } catch (err: any) {
      const message =
        err.response?.data?.message ?? "Failed to search logs. Please try again.";
      setError(message);
      setEntries([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  return { entries, total, loading, error, handleSearch };
}
