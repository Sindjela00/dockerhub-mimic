import * as authApi from "../auth.api";

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppProvider } from "../../../context/AppContext";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import { useChangePassword } from "../useChangePassword";

const changePasswordSpy = vi.spyOn(authApi, "changePassword");

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

describe("useChangePassword", () => {
  it("uspešna promena lozinke vraća true", async () => {
    changePasswordSpy.mockResolvedValueOnce({} as any);

    const { result } = renderHook(() => useChangePassword(), { wrapper });

    let success = false;
    await act(async () => {
      success = await result.current.handleChangePassword({
        email: "test@test.com",
        oldPassword: "OldPass1",
        newPassword: "NewPass1",
      });
    });

    expect(success).toBe(true);
    expect(result.current.error).toBe("");
  });

  it("neuspešna promena vraća false i postavlja grešku", async () => {
    changePasswordSpy.mockRejectedValueOnce({
      response: { data: { message: "Invalid credentials." } },
    });

    const { result } = renderHook(() => useChangePassword(), { wrapper });

    let success = true;
    await act(async () => {
      success = await result.current.handleChangePassword({
        email: "test@test.com",
        oldPassword: "wrong",
        newPassword: "NewPass1",
      });
    });

    expect(success).toBe(false);
    expect(result.current.error).toBe("Invalid credentials.");
  });
});
