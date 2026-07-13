import api from "@/lib/api";

export interface CreateAdminPayload {
  username: string;
  email: string;
}

export interface CreateAdminResponse {
  message: string;
  username: string;
  email: string;
  temporaryPassword: string;
}

export interface AdminSummary {
  id: number;
  username: string;
  email: string;
  role: string;
  createdAt: string;
  mustChangePassword: boolean;
}

export const createAdmin = (payload: CreateAdminPayload) =>
  api.post<CreateAdminResponse>("/api/admin/administrators", payload);

export const listAdmins = () =>
  api.get<AdminSummary[]>("/api/admin/administrators");

export type BadgeName = "verified" | "sponsored";

export interface UserBadgeSummary {
  id: number;
  username: string;
  email: string;
  verifiedPublisher: boolean;
  sponsoredOSS: boolean;
}

export interface UserBadgeListResponse {
  users: UserBadgeSummary[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SetUserBadgeResponse {
  message: string;
  user: UserBadgeSummary;
}

export const searchUsersForBadges = (
  search: string | undefined,
  page = 1,
  pageSize = 20,
) =>
  api.get<UserBadgeListResponse>("/api/admin/users", {
    params: {
      page,
      pageSize,
      ...(search?.trim() ? { search: search.trim() } : {}),
    },
  });

export const setUserBadge = (userId: number, badge: BadgeName, value: boolean) =>
  api.put<SetUserBadgeResponse>(`/api/admin/users/${userId}/badges`, {
    badge,
    value,
  });
