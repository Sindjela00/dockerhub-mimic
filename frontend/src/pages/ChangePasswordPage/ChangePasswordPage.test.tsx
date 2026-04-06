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

async function fillAndSubmit(
  email: string,
  oldPassword: string,
  newPassword: string,
) {
  const user = userEvent.setup();
  renderWithProviders(<ChangePasswordPage />);

  if (email) await user.type(screen.getByLabelText(/email/i), email);
  if (oldPassword)
    await user.type(screen.getByLabelText(/old password/i), oldPassword);
  if (newPassword)
    await user.type(screen.getByLabelText(/new password/i), newPassword);

  await user.click(screen.getByRole("button", { name: /change password/i }));
  return user;
}

describe("ChangePasswordPage", () => {
  it("renderuje formu sa svim poljima", () => {
    renderWithProviders(<ChangePasswordPage />);
    expect(screen.getByLabelText(/email/i)).toBeTruthy();
    expect(screen.getByLabelText(/old password/i)).toBeTruthy();
    expect(screen.getByLabelText(/new password/i)).toBeTruthy();
  });

  it("ne prikazuje email gresku za validan email", async () => {
    changePasswordSpy.mockResolvedValueOnce({} as any);
    await fillAndSubmit("test@test.com", "OldPass1", "NewPass1");
    expect(screen.queryByText(/enter a valid email address/i)).toBeNull();
  });

  it("prikazuje gresku kada je oldPassword prazan", async () => {
    await fillAndSubmit("test@test.com", "", "NewPass1");
    expect(screen.getByText(/old password is required/i)).toBeTruthy();
    expect(changePasswordSpy).not.toHaveBeenCalled();
  });

  it("ne prikazuje oldPassword gresku kada je popunjen", async () => {
    changePasswordSpy.mockResolvedValueOnce({} as any);
    await fillAndSubmit("test@test.com", "OldPass1", "NewPass1");
    expect(screen.queryByText(/old password is required/i)).toBeNull();
  });

  it("prikazuje gresku za newPassword kraći od 8 znakova", async () => {
    await fillAndSubmit("test@test.com", "OldPass1", "Ab1");
    expect(screen.getByText(/at least 8 characters/i)).toBeTruthy();
    expect(changePasswordSpy).not.toHaveBeenCalled();
  });

  it("prikazuje gresku za newPassword bez velikog slova", async () => {
    await fillAndSubmit("test@test.com", "OldPass1", "newpass1");
    expect(screen.getByText(/at least 8 characters/i)).toBeTruthy();
    expect(changePasswordSpy).not.toHaveBeenCalled();
  });

  it("prikazuje gresku za newPassword bez malog slova", async () => {
    await fillAndSubmit("test@test.com", "OldPass1", "NEWPASS1");
    expect(screen.getByText(/at least 8 characters/i)).toBeTruthy();
    expect(changePasswordSpy).not.toHaveBeenCalled();
  });

  it("prikazuje gresku za newPassword bez broja", async () => {
    await fillAndSubmit("test@test.com", "OldPass1", "NewPassword");
    expect(screen.getByText(/at least 8 characters/i)).toBeTruthy();
    expect(changePasswordSpy).not.toHaveBeenCalled();
  });

  it("prikazuje success screen nakon uspešne promene", async () => {
    changePasswordSpy.mockResolvedValueOnce({} as any);
    await fillAndSubmit("test@test.com", "OldPass1", "NewPass1");

    await waitFor(() =>
      expect(screen.getByText(/password changed/i)).toBeTruthy(),
    );
    expect(screen.getByText(/updated successfully/i)).toBeTruthy();
    expect(screen.getByText(/back to sign in/i)).toBeTruthy();
  });

  it("sakriva formu i prikazuje success view nakon submit-a", async () => {
    changePasswordSpy.mockResolvedValueOnce({} as any);
    await fillAndSubmit("test@test.com", "OldPass1", "NewPass1");

    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: /change password/i }),
      ).toBeNull(),
    );
  });

  it("prikazuje API gresku iz response.data.message", async () => {
    changePasswordSpy.mockRejectedValueOnce({
      response: { data: { message: "Invalid credentials." } },
    });
    await fillAndSubmit("test@test.com", "OldPass1", "NewPass1");

    await waitFor(() =>
      expect(screen.getByText(/invalid credentials/i)).toBeTruthy(),
    );
  });

  it("ne prikazuje success screen kada API vrati gresku", async () => {
    changePasswordSpy.mockRejectedValueOnce({
      response: { data: { message: "Invalid credentials." } },
    });
    await fillAndSubmit("test@test.com", "OldPass1", "NewPass1");

    await waitFor(() =>
      expect(screen.queryByText(/password changed/i)).toBeNull(),
    );
  });

  it("ne poziva API kada validacija ne prođe", async () => {
    await fillAndSubmit("bad-email", "", "weak");
    expect(changePasswordSpy).not.toHaveBeenCalled();
  });
});
