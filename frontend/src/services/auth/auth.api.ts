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
  mustChangePassword: boolean;
}

export interface ChangePasswordPayload {
  email: string;
  oldPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  message: string;
  token: string;
  role: string;
  mustChangePassword: boolean;
}

export const register = (payload: RegisterPayload) =>
  api.post<RegisterResponse>("/api/auth/register", payload);

export const login = (payload: LoginPayload) =>
  api.post<LoginResponse>("/api/auth/login", payload);

export const changePassword = (payload: ChangePasswordPayload) =>
  api.post<ChangePasswordResponse>("/api/auth/change_password", payload);
