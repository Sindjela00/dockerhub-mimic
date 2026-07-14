import * as authApi from "../auth.api";

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppProvider } from "../../../context/AppContext";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import type { ChangePasswordResponse } from "../auth.api";
import { useChangePassword } from "./useChangePassword";

const changePasswordSpy = vi.spyOn(authApi, "changePassword");

const wrapper = ({ children }: { children: ReactNode }) => (
  <MemoryRouter>
    <AppProvider>{children}</AppProvider>
  </MemoryRouter>
);

const payload = {
  email: "test@test.com",
  oldPassword: "OldPass1",
  newPassword: "NewPass1",
};

const successResponse: ChangePasswordResponse = {
  message: "Password changed successfully.",
  token: "new-token",
  role: "User",
  mustChangePassword: false,
};

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe("useChangePassword", () => {
  it("uspesna promena lozinke vraca response podatke", async () => {
    changePasswordSpy.mockResolvedValueOnce({ data: successResponse } as any);

    const { result } = renderHook(() => useChangePassword(), { wrapper });

    let response: ChangePasswordResponse | null = null;
    await act(async () => {
      response = await result.current.handleChangePassword(payload);
    });

    expect(response).toEqual(successResponse);
    expect(result.current.error).toBe("");
  });

  it("neuspesna promena vraca null i postavlja gresku iz response", async () => {
    changePasswordSpy.mockRejectedValueOnce({
      response: { data: { message: "Invalid credentials." } },
    });

    const { result } = renderHook(() => useChangePassword(), { wrapper });

    let response: ChangePasswordResponse | null = successResponse;
    await act(async () => {
      response = await result.current.handleChangePassword({
        ...payload,
        oldPassword: "wrong",
      });
    });

    expect(response).toBeNull();
    expect(result.current.error).toBe("Invalid credentials.");
  });

  it("koristi fallback poruku kada nema response.data.message", async () => {
    changePasswordSpy.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useChangePassword(), { wrapper });

    let response: ChangePasswordResponse | null = successResponse;
    await act(async () => {
      response = await result.current.handleChangePassword({
        ...payload,
        oldPassword: "wrong",
      });
    });

    expect(response).toBeNull();
    expect(result.current.error).toBe(
      "Password change failed. Please try again.",
    );
  });

  it("loading je true tokom poziva i false nakon", async () => {
    let resolve: (v: any) => void;
    changePasswordSpy.mockReturnValueOnce(
      new Promise((r) => {
        resolve = r;
      }),
    );

    const { result } = renderHook(() => useChangePassword(), { wrapper });

    expect(result.current.loading).toBe(false);

    let callPromise: Promise<ChangePasswordResponse | null>;
    act(() => {
      callPromise = result.current.handleChangePassword(payload);
    });

    expect(result.current.loading).toBe(true);

    await act(async () => {
      resolve!({ data: successResponse });
      await callPromise;
    });

    expect(result.current.loading).toBe(false);
  });

  it("resetuje error pri sledecoj uspesnoj promeni", async () => {
    changePasswordSpy
      .mockRejectedValueOnce(new Error("greška"))
      .mockResolvedValueOnce({ data: successResponse } as any);

    const { result } = renderHook(() => useChangePassword(), { wrapper });

    await act(async () => {
      await result.current.handleChangePassword({
        ...payload,
        oldPassword: "wrong",
      });
    });
    expect(result.current.error).toBe(
      "Password change failed. Please try again.",
    );

    await act(async () => {
      await result.current.handleChangePassword(payload);
    });
    expect(result.current.error).toBe("");
  });

  it("loading je false nakon greske", async () => {
    changePasswordSpy.mockRejectedValueOnce(new Error("fail"));

    const { result } = renderHook(() => useChangePassword(), { wrapper });

    await act(async () => {
      await result.current.handleChangePassword(payload);
    });

    expect(result.current.loading).toBe(false);
  });
});
