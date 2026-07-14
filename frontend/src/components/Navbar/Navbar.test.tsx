import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import Navbar from "./Navbar";

vi.mock("./components/AuthButtons/AuthButtons", () => ({
  default: () => <div data-testid="auth-buttons">AuthButtons</div>,
}));

vi.mock("./components/UserMenu/UserMenu", () => ({
  default: ({
    email,
    role,
    username,
  }: {
    email: string;
    role: string;
    username: string;
  }) => (
    <div
      data-testid="user-menu"
      data-email={email}
      data-role={role}
      data-username={username}
    >
      UserMenu
    </div>
  ),
}));

const mockUseAuth = vi.fn();
vi.mock("../../context/AppContext", () => ({
  useAuth: () => mockUseAuth(),
}));

describe("Navbar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("kada korisnik NIJE ulogovan", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isLoggedIn: false,
        username: "",
        email: "",
        role: "",
      });
    });

    it("prikazuje AuthButtons komponent", () => {
      render(<Navbar />);
      expect(screen.getByTestId("auth-buttons")).toBeInTheDocument();
    });

    it("ne prikazuje UserMenu komponent", () => {
      render(<Navbar />);
      expect(screen.queryByTestId("user-menu")).not.toBeInTheDocument();
    });
  });

  describe("kada je korisnik ulogovan", () => {
    const mockUser = {
      isLoggedIn: true,
      username: "pera",
      email: "pera@example.com",
      role: "admin",
    };

    beforeEach(() => {
      mockUseAuth.mockReturnValue(mockUser);
    });

    it("prikazuje UserMenu komponent", () => {
      render(<Navbar />);
      expect(screen.getByTestId("user-menu")).toBeInTheDocument();
    });

    it("ne prikazuje AuthButtons komponent", () => {
      render(<Navbar />);
      expect(screen.queryByTestId("auth-buttons")).not.toBeInTheDocument();
    });

    it("prosleđuje ispravne props u UserMenu", () => {
      render(<Navbar />);
      const userMenu = screen.getByTestId("user-menu");
      expect(userMenu).toHaveAttribute("data-email", mockUser.email);
      expect(userMenu).toHaveAttribute("data-role", mockUser.role);
      expect(userMenu).toHaveAttribute("data-username", mockUser.username);
    });
  });

  describe("title prop", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isLoggedIn: false,
        username: "",
        email: "",
        role: "",
      });
    });

    it("prikazuje prosleđeni title", () => {
      render(<Navbar title="Moj Dashboard" />);
      expect(
        screen.getByRole("heading", { name: "Moj Dashboard" }),
      ).toBeInTheDocument();
    });

    it("prikazuje prazan string kao podrazumevani title", () => {
      render(<Navbar />);
      const heading = screen.getByRole("heading");
      expect(heading).toHaveTextContent("");
    });

    it("renderuje header element", () => {
      render(<Navbar title="Test" />);
      expect(screen.getByRole("banner")).toBeInTheDocument();
    });
  });
});
