export type Theme = "dark" | "light";
export type Role = "User" | "Administrator" | "SuperAdmin" | null;

export const isAdminRole = (role: Role): boolean =>
  role === "Administrator" || role === "SuperAdmin";

export interface AuthState {
  token: string | null;
  role: Role;
  isLoggedIn: boolean;
  email: string;
  username: string;
  mustChangePassword: boolean;
}

export interface AppState {
  auth: AuthState;
  setAuth: (
    token: string,
    role: string,
    username: string,
    mustChangePassword: boolean,
  ) => void;
  clearAuth: () => void;
  repoCount: number | undefined;
  setRepoCount: (count: number) => void;

  theme: Theme;
  toggleTheme: () => void;
}
