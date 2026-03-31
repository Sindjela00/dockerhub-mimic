export type Theme = "dark" | "light";
export type Role = "User" | "Admin" | null;

export interface AuthState {
  token: string | null;
  role: Role;
  isLoggedIn: boolean;
  email: string;
  username: string;
}

export interface AppState {
  auth: AuthState;
  setAuth: (token: string, role: string, username: string) => void;
  clearAuth: () => void;
  repoCount: number | undefined;
  setRepoCount: (count: number) => void;

  theme: Theme;
  toggleTheme: () => void;
}
