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
  it("uspesan login cuva token i navigira na /", async () => {
    loginSpy.mockResolvedValueOnce({
      data: { token: "jwt-token", role: "User", message: "Login successful." },
    } as any);

    const { result } = renderHook(() => useLogin(), { wrapper });

    await act(async () => {
      await result.current.handleLogin({
        email: "test@test.com",
        password: "Password1",
      });
    });

    expect(localStorage.getItem("token")).toBe("jwt-token");
    expect(mockNavigate).toHaveBeenCalledWith("/");
    expect(result.current.error).toBe("");
  });

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
});
