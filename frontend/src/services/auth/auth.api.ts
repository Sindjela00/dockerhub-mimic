import api from "../../lib/api";

export interface RegisterPayload {
  email: string;
  username: string;
  password: string;
}

export interface RegisterResponse {
  message: string;
}

export interface LoginPayload {
  identifier: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  role: string;
  username: string;
}

export interface ChangePasswordPayload {
  email: string;
  oldPassword: string;
  newPassword: string;
}

export const register = (payload: RegisterPayload) =>
  api.post<RegisterResponse>("/api/auth/register", payload);

export const login = (payload: LoginPayload) =>
  api.post<LoginResponse>("/api/auth/login", payload);

export const changePassword = (payload: ChangePasswordPayload) =>
  api.post("/api/auth/change_password", payload);
