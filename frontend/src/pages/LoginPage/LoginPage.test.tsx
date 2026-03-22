import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { AppProvider } from "@/context/AppContext";
import LoginPage from "./LoginPage";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import { useLogin } from "../../services/auth/useLogin/useLogin";
import userEvent from "@testing-library/user-event";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("../../services/auth/useLogin/useLogin");

// ─── Hook helper ──────────────────────────────────────────────────────────────

const mockUseLogin = vi.mocked(useLogin);

const mockHook = (overrides = {}) => {
  mockUseLogin.mockReturnValue({
    loading: false,
    error: "",
    handleLogin: vi.fn(),
    ...overrides,
  });
};

const wrapper = ({ children }: { children: ReactNode }) => (
  <MemoryRouter>
    <AppProvider>{children}</AppProvider>
  </MemoryRouter>
);

const renderPage = () => render(<LoginPage />, { wrapper });

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  mockHook();
});

describe("LoginPage", () => {
  // ─── Renderovanje ─────────────────────────────────────────────────────────

  it("renderuje formu", () => {
    renderPage();
    expect(screen.getByLabelText(/email\/username/i)).toBeTruthy();
    expect(screen.getByLabelText(/password/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeTruthy();
  });

  it("renderuje naslov i opis", () => {
    renderPage();
    expect(screen.getByText("Welcome back")).toBeTruthy();
    expect(
      screen.getByText(/sign in to your docker hub account/i),
    ).toBeTruthy();
  });

  it("renderuje link ka registraciji", () => {
    renderPage();
    expect(screen.getByRole("link", { name: /register/i })).toBeTruthy();
  });

  // ─── Validacija ───────────────────────────────────────────────────────────

  it("prikazuje grešku za praznu lozinku", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: /sign in/i }));
    expect(screen.getByText(/password is required/i)).toBeTruthy();
  });

  it("ne poziva handleLogin kad validacija ne prođe", async () => {
    const handleLogin = vi.fn();
    mockHook({ handleLogin });
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: /sign in/i }));
    expect(handleLogin).not.toHaveBeenCalled();
  });

  // ─── Submit ───────────────────────────────────────────────────────────────

  it("poziva handleLogin sa username-om", async () => {
    const handleLogin = vi.fn();
    mockHook({ handleLogin });
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/email\/username/i), "john.doe");
    await user.type(screen.getByLabelText(/password/i), "Password1");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(handleLogin).toHaveBeenCalledWith({
      identifier: "john.doe",
      password: "Password1",
    });
  });

  it("poziva handleLogin sa email-om", async () => {
    const handleLogin = vi.fn();
    mockHook({ handleLogin });
    const user = userEvent.setup();
    renderPage();

    await user.type(
      screen.getByLabelText(/email\/username/i),
      "john@example.com",
    );
    await user.type(screen.getByLabelText(/password/i), "Password1");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(handleLogin).toHaveBeenCalledWith({
      identifier: "john@example.com",
      password: "Password1",
    });
  });

  // ─── API error ────────────────────────────────────────────────────────────

  it("prikazuje API grešku", () => {
    mockHook({ error: "Invalid credentials." });
    renderPage();
    expect(screen.getByText("Invalid credentials.")).toBeTruthy();
  });

  // ─── Loading state ────────────────────────────────────────────────────────

  it("dugme prikazuje Signing in... tokom loading-a", () => {
    mockHook({ loading: true });
    renderPage();
    expect(screen.getByRole("button", { name: /signing in/i })).toBeTruthy();
  });

  it("dugme je disabled tokom loading-a", () => {
    mockHook({ loading: true });
    renderPage();
    expect(screen.getByRole("button", { name: /signing in/i })).toBeDisabled();
  });
});
