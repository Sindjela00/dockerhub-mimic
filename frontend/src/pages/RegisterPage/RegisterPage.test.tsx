import * as authApi from "../../services/auth/auth.api";

import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";

import RegisterPage from "./RegisterPage";
import { renderWithProviders } from "../../test/test.utils";
import userEvent from "@testing-library/user-event";

const registerSpy = vi.spyOn(authApi, "register");

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe("RegisterPage", () => {
  it("renderuje formu sa svim poljima", () => {
    renderWithProviders(<RegisterPage />);
    expect(screen.getByLabelText(/username/i)).toBeTruthy();
    expect(screen.getByLabelText(/email/i)).toBeTruthy();
    expect(screen.getByLabelText(/^password$/i)).toBeTruthy();
    expect(screen.getByLabelText(/confirm password/i)).toBeTruthy();
  });

  it("prikazuje grešku za kratak username", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    await user.type(screen.getByLabelText(/username/i), "ab");
    await user.type(screen.getByLabelText(/email/i), "test@test.com");
    await user.type(screen.getByLabelText(/^password$/i), "Password1");
    await user.type(screen.getByLabelText(/confirm password/i), "Password1");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(screen.getByText(/at least 3 characters/i)).toBeTruthy();
  });

  it("prikazuje grešku kad se lozinke ne poklapaju", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    await user.type(screen.getByLabelText(/username/i), "john.doe");
    await user.type(screen.getByLabelText(/email/i), "test@test.com");
    await user.type(screen.getByLabelText(/^password$/i), "Password1");
    await user.type(screen.getByLabelText(/confirm password/i), "Different1");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(screen.getByText(/do not match/i)).toBeTruthy();
  });

  it("uspešna registracija navigira na /login", async () => {
    registerSpy.mockResolvedValueOnce({
      data: { message: "User registered." },
    } as any);

    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    await user.type(screen.getByLabelText(/username/i), "fakeUsername");
    await user.type(screen.getByLabelText(/email/i), "test@test.com");
    await user.type(screen.getByLabelText(/^password$/i), "Password1");
    await user.type(screen.getByLabelText(/confirm password/i), "Password1");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/login"));
  });

  it("šalje username u API payload", async () => {
    registerSpy.mockResolvedValueOnce({
      data: { message: "User registered." },
    } as any);

    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    await user.type(screen.getByLabelText(/username/i), "john.doe");
    await user.type(screen.getByLabelText(/email/i), "test@test.com");
    await user.type(screen.getByLabelText(/^password$/i), "Password1");
    await user.type(screen.getByLabelText(/confirm password/i), "Password1");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() =>
      expect(registerSpy).toHaveBeenCalledWith({
        username: "fakeUsername",
        email: "test@test.com",
        password: "Password1",
      }),
    );
  });

  it("prikazuje API grešku", async () => {
    registerSpy.mockRejectedValueOnce({
      response: { data: { message: "Email already in use." } },
    });

    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    await user.type(screen.getByLabelText(/username/i), "john.doe");
    await user.type(screen.getByLabelText(/email/i), "test@test.com");
    await user.type(screen.getByLabelText(/^password$/i), "Password1");
    await user.type(screen.getByLabelText(/confirm password/i), "Password1");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() =>
      expect(screen.getByText(/email already in use/i)).toBeTruthy(),
    );
  });
});
