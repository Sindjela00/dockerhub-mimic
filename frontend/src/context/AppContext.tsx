import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { AppState, AuthState, Role, Theme } from "./types/types";

const DEFAULT_THEME: Theme = "dark";
const AppContext = createContext<AppState | null>(null);

const decodeEmail = (token: string): string => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.email ?? payload.sub ?? "";
  } catch {
    return "";
  }
};

export function AppProvider({ children }: { children: ReactNode }) {
  const token = localStorage.getItem("token");
  const [auth, setAuthState] = useState<AuthState>({
    token,
    role: localStorage.getItem("role") as Role,
    isLoggedIn: !!token,
    email: token ? decodeEmail(token) : "",
  });

  const setAuth = (token: string, role: string) => {
    localStorage.setItem("token", token);
    localStorage.setItem("role", role);
    setAuthState({
      token,
      role: role as Role,
      isLoggedIn: true,
      email: decodeEmail(token),
    });
  };

  const clearAuth = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setAuthState({ token: null, role: null, isLoggedIn: false, email: "" });
  };

  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem("theme") as Theme) ?? DEFAULT_THEME,
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  const value: AppState = {
    auth,
    setAuth,
    clearAuth,
    theme,
    toggleTheme,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
}

export const useAuth = () => useAppContext().auth;

export const useTheme = () => {
  const { theme, toggleTheme } = useAppContext();
  return { theme, toggleTheme };
};
