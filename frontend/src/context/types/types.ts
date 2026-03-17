export type Theme = "dark" | "light";
export type Role = "User" | "Admin" | null;

export interface AuthState {
  token: string | null;
  role: Role;
  isLoggedIn: boolean;
  email: string;
}

export interface AppState {
  auth: AuthState;
  setAuth: (token: string, role: string) => void;
  clearAuth: () => void;

  theme: Theme;
  toggleTheme: () => void;
}
