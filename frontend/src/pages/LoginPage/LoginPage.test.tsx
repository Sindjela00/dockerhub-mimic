import * as authApi from "../../services/auth/auth.api";

import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";

import LoginPage from "./LoginPage";
import { renderWithProviders } from "../../test/test.utils";
import userEvent from "@testing-library/user-event";

const loginSpy = vi.spyOn(authApi, "login");

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe("LoginPage", () => {
  it("renderuje formu", () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByLabelText(/email/i)).toBeTruthy();
    expect(screen.getByLabelText(/password/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeTruthy();
  });

  it("prikazuje validacione greške za prazna polja", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(screen.getByText(/valid email/i)).toBeTruthy();
    expect(screen.getByText(/password is required/i)).toBeTruthy();
  });

  it("uspešan login navigira na /", async () => {
    loginSpy.mockResolvedValueOnce({
      data: { token: "jwt-token", role: "User", message: "Login successful." },
    } as any);

    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "test@test.com");
    await user.type(screen.getByLabelText(/password/i), "Password1");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/"));
  });

  it("prikazuje API grešku", async () => {
    loginSpy.mockRejectedValueOnce({
      response: { data: { message: "Invalid credentials." } },
    });

    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "test@test.com");
    await user.type(screen.getByLabelText(/password/i), "Password1");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() =>
      expect(screen.getByText(/invalid credentials/i)).toBeTruthy(),
    );
  });
});
