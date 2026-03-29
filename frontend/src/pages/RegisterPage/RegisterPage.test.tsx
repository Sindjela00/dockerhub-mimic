/**
 * @vitest-environment jsdom
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { AppProvider } from "@/context/AppContext";
import { MemoryRouter } from "react-router-dom";
import RegisterPage from "./RegisterPage";
import { useRegister as useRegisterMock } from "../../services/auth/useRegister/useRegister";
import userEvent from "@testing-library/user-event";

vi.mock("lucide-react", () => ({
  UserPlus: () => <span data-testid="userplus" />,
}));

const mockHandleRegister = vi.fn();
vi.mock("../../services/auth/useRegister/useRegister", () => ({
  useRegister: () => ({
    loading: false,
    error: "",
    handleRegister: mockHandleRegister,
  }),
}));

const renderPage = () =>
  render(
    <MemoryRouter>
      <AppProvider>
        <RegisterPage />
      </AppProvider>
    </MemoryRouter>,
  );

describe("RegisterPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderuje sve inpute i dugme", () => {
    renderPage();

    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create account/i }),
    ).toBeInTheDocument();
  });

  it("prikazuje grešku za slab password", async () => {
    renderPage();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/^password$/i), "abc");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(
      await screen.findByText(/password must be at least 8 characters/i),
    ).toBeInTheDocument();
    expect(mockHandleRegister).not.toHaveBeenCalled();
  });

  it("prikazuje grešku kada password i confirm password ne poklapaju", async () => {
    renderPage();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/^password$/i), "Abcd1234");
    await user.type(screen.getByLabelText(/confirm password/i), "Abcd12345");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(
      await screen.findByText(/passwords do not match/i),
    ).toBeInTheDocument();
    expect(mockHandleRegister).not.toHaveBeenCalled();
  });

  it("prikazuje grešku kada username prekratak", async () => {
    renderPage();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/username/i), "ab");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(
      await screen.findByText(/username must be at least 3 characters/i),
    ).toBeInTheDocument();
    expect(mockHandleRegister).not.toHaveBeenCalled();
  });

  it("poziva handleRegister kada je forma validna", async () => {
    renderPage();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/username/i), "john");
    await user.type(screen.getByLabelText(/email/i), "john@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "Abcd1234");
    await user.type(screen.getByLabelText(/confirm password/i), "Abcd1234");

    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(mockHandleRegister).toHaveBeenCalledOnce();
    expect(mockHandleRegister).toHaveBeenCalledWith({
      username: "john",
      email: "john@example.com",
      password: "Abcd1234",
    });
  });

  vi.mock("../../services/auth/useRegister/useRegister", () => ({
    useRegister: vi.fn(() => ({
      loading: false,
      error: "",
      handleRegister: mockHandleRegister,
    })),
  }));

  it("prikazuje error sa servera", () => {
    // @ts-ignore
    useRegisterMock.mockReturnValue({
      loading: false,
      error: "Server error",
      handleRegister: vi.fn(),
    });

    renderPage();
    expect(screen.getByText("Server error")).toBeInTheDocument();
  });
});
