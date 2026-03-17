import * as authApi from "../../services/auth/auth.api";

import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";

import ChangePasswordPage from "./ChangePasswordPage";
import { renderWithProviders } from "../../test/test.utils";
import userEvent from "@testing-library/user-event";

const changePasswordSpy = vi.spyOn(authApi, "changePassword");

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe("ChangePasswordPage", () => {
  it("renderuje formu", () => {
    renderWithProviders(<ChangePasswordPage />);
    expect(screen.getByLabelText(/email/i)).toBeTruthy();
    expect(screen.getByLabelText(/old password/i)).toBeTruthy();
    expect(screen.getByLabelText(/new password/i)).toBeTruthy();
  });

  it("prikazuje success screen nakon uspešne promene", async () => {
    changePasswordSpy.mockResolvedValueOnce({} as any);

    const user = userEvent.setup();
    renderWithProviders(<ChangePasswordPage />);

    await user.type(screen.getByLabelText(/email/i), "test@test.com");
    await user.type(screen.getByLabelText(/old password/i), "OldPass1");
    await user.type(screen.getByLabelText(/new password/i), "NewPass1");
    await user.click(screen.getByRole("button", { name: /change password/i }));

    await waitFor(() =>
      expect(screen.getByText(/password changed/i)).toBeTruthy(),
    );
  });

  it("prikazuje grešku na 401", async () => {
    changePasswordSpy.mockRejectedValueOnce({
      response: { data: { message: "Invalid credentials." } },
    });

    const user = userEvent.setup();
    renderWithProviders(<ChangePasswordPage />);

    await user.type(screen.getByLabelText(/email/i), "test@test.com");
    await user.type(screen.getByLabelText(/old password/i), "wrong");
    await user.type(screen.getByLabelText(/new password/i), "NewPass1");
    await user.click(screen.getByRole("button", { name: /change password/i }));

    await waitFor(() =>
      expect(screen.getByText(/invalid credentials/i)).toBeTruthy(),
    );
  });
});
