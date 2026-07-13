import api from "@/lib/api";

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  score: number | null;
}

export interface LogSearchResponse {
  total: number;
  entries: LogEntry[];
}

export interface SearchLogsParams {
  query?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export const searchLogs = (params: SearchLogsParams) => {
  const searchParams = new URLSearchParams();
  if (params.query?.trim()) searchParams.set("query", params.query.trim());
  if (params.from) searchParams.set("from", params.from);
  if (params.to) searchParams.set("to", params.to);
  searchParams.set("page", String(params.page ?? 1));
  searchParams.set("pageSize", String(params.pageSize ?? 25));

  return api.get<LogSearchResponse>(`/api/admin/logs?${searchParams.toString()}`);
};
