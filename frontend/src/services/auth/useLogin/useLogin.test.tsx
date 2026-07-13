import * as authApi from "../auth.api";

import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppProvider } from "../../../context/AppContext";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import { useLogin } from "./useLogin";

const loginSpy = vi.spyOn(authApi, "login");

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <MemoryRouter>
    <AppProvider>{children}</AppProvider>
  </MemoryRouter>
);

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe("useLogin", () => {
  it("neuspesan login postavlja gresku", async () => {
    loginSpy.mockRejectedValueOnce({
      response: { data: { message: "Invalid credentials." } },
    });

    const { result } = renderHook(() => useLogin(), { wrapper });

    await act(async () => {
      await result.current.handleLogin({
        email: "test@test.com",
        password: "wrong",
      });
    });

    expect(result.current.error).toBe("Invalid credentials.");
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("loading je true tokom poziva", async () => {
    loginSpy.mockImplementationOnce(
      () => new Promise((res) => setTimeout(res, 100)) as any,
    );

    const { result } = renderHook(() => useLogin(), { wrapper });

    act(() => {
      result.current.handleLogin({
        email: "test@test.com",
        password: "Password1",
      });
    });

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it("preusmerava na /change-password?forced=true kada backend vrati mustChangePassword", async () => {
    loginSpy.mockResolvedValueOnce({
      data: {
        message: "Login successful.",
        token: "temp-token",
        role: "SuperAdmin",
        username: "superadmin",
        mustChangePassword: true,
      },
    } as any);

    const { result } = renderHook(() => useLogin(), { wrapper });

    await act(async () => {
      await result.current.handleLogin({
        identifier: "superadmin",
        password: "Temp1Password",
      } as any);
    });

    expect(mockNavigate).toHaveBeenCalledWith("/change-password?forced=true", {
      replace: true,
    });
  });

  it("preusmerava na / kada mustChangePassword nije potreban", async () => {
    loginSpy.mockResolvedValueOnce({
      data: {
        message: "Login successful.",
        token: "real-token",
        role: "User",
        username: "demo",
        mustChangePassword: false,
      },
    } as any);

    const { result } = renderHook(() => useLogin(), { wrapper });

    await act(async () => {
      await result.current.handleLogin({
        identifier: "demo",
        password: "Password1",
      } as any);
    });

    expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
  });
});
