import * as authApi from "../auth.api";

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppProvider } from "../../../context/AppContext";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import { useRegister } from "../useRegister";

const registerSpy = vi.spyOn(authApi, "register");

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

describe("useRegister", () => {
  it("uspešna registracija navigira na /login", async () => {
    registerSpy.mockResolvedValueOnce({
      data: { message: "User registered." },
    } as any);

    const { result } = renderHook(() => useRegister(), { wrapper });

    await act(async () => {
      await result.current.handleRegister({
        email: "test@test.com",
        password: "Password1",
      });
    });

    expect(mockNavigate).toHaveBeenCalledWith("/login");
    expect(result.current.error).toBe("");
  });

  it("neuspešna registracija postavlja grešku", async () => {
    registerSpy.mockRejectedValueOnce({
      response: { data: { message: "Email already in use." } },
    });

    const { result } = renderHook(() => useRegister(), { wrapper });

    await act(async () => {
      await result.current.handleRegister({
        email: "test@test.com",
        password: "Password1",
      });
    });

    expect(result.current.error).toBe("Email already in use.");
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
