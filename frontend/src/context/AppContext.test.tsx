import { AppProvider, useAppContext, useAuth, useTheme } from "./AppContext";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";

const wrapper = ({ children }: { children: ReactNode }) => (
  <MemoryRouter>
    <AppProvider>{children}</AppProvider>
  </MemoryRouter>
);

beforeEach(() => localStorage.clear());

describe("AppContext — auth", () => {
  it("inicijalno nije ulogovan", () => {
    const { result } = renderHook(() => useAppContext(), { wrapper });
    expect(result.current.auth.isLoggedIn).toBe(false);
    expect(result.current.auth.token).toBeNull();
  });

  it("setAuth postavlja token i uloguje korisnika", () => {
    const { result } = renderHook(() => useAppContext(), { wrapper });

    act(() => result.current.setAuth("test-token", "User"));

    expect(result.current.auth.isLoggedIn).toBe(true);
    expect(result.current.auth.token).toBe("test-token");
    expect(result.current.auth.role).toBe("User");
    expect(localStorage.getItem("token")).toBe("test-token");
  });

  it("clearAuth odjavljuje korisnika i brise localStorage", () => {
    const { result } = renderHook(() => useAppContext(), { wrapper });

    act(() => result.current.setAuth("test-token", "User"));
    act(() => result.current.clearAuth());

    expect(result.current.auth.isLoggedIn).toBe(false);
    expect(result.current.auth.token).toBeNull();
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("cita token iz localStorage na inicijalizaciji", () => {
    localStorage.setItem("token", "existing-token");
    localStorage.setItem("role", "Admin");

    const { result } = renderHook(() => useAppContext(), { wrapper });

    expect(result.current.auth.isLoggedIn).toBe(true);
    expect(result.current.auth.token).toBe("existing-token");
  });
});

describe("AppContext — tema", () => {
  it("default tema je dark", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.theme).toBe("dark");
  });

  it("toggleTheme menja temu", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => result.current.toggleTheme());
    expect(result.current.theme).toBe("light");

    act(() => result.current.toggleTheme());
    expect(result.current.theme).toBe("dark");
  });

  it("cuva temu u localStorage", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => result.current.toggleTheme());
    expect(localStorage.getItem("theme")).toBe("light");
  });
});
