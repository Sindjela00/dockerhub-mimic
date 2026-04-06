import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import UserDropdown from "./UserDropdown";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

const mockClearAuth = vi.fn();
const mockToggleTheme = vi.fn();
let mockTheme = "light";

vi.mock("@/context/AppContext", () => ({
  useAppContext: () => ({ clearAuth: mockClearAuth }),
  useTheme: () => ({ theme: mockTheme, toggleTheme: mockToggleTheme }),
}));

const defaultProps = {
  email: "user@example.com",
  role: "Admin" as const,
  onClose: vi.fn(),
};

function renderDropdown(props = {}) {
  return render(<UserDropdown {...defaultProps} {...props} />);
}

describe("UserDropdown", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockTheme = "light";
  });

  describe("rendering", () => {
    it("prikazuje email korisnika", () => {
      renderDropdown();
      expect(screen.getByText("user@example.com")).toBeInTheDocument();
    });

    it("prikazuje rolu kao undefined kada nije prosleđena", () => {
      renderDropdown({ role: undefined });
      const roleParagraph = screen
        .getByText("user@example.com")
        .parentElement?.querySelector("p:last-child");
      expect(roleParagraph).toBeEmptyDOMElement();
    });

    it("prikazuje sve stavke menija", () => {
      renderDropdown();
      expect(screen.getByText("Account")).toBeInTheDocument();
      expect(screen.getByText("Change password")).toBeInTheDocument();
      expect(screen.getByText("Log out")).toBeInTheDocument();
    });
  });

  describe("tema", () => {
    it("prikazuje 'Dark mode' kada je tema light", () => {
      mockTheme = "light";
      renderDropdown();
      expect(screen.getByText("Dark mode")).toBeInTheDocument();
    });

    it("prikazuje 'Light mode' kada je tema dark", () => {
      mockTheme = "dark";
      renderDropdown();
      expect(screen.getByText("Light mode")).toBeInTheDocument();
    });

    it("poziva toggleTheme klikom na dugme za temu", () => {
      mockTheme = "light";
      renderDropdown();
      fireEvent.click(screen.getByText("Dark mode"));
      expect(mockToggleTheme).toHaveBeenCalledTimes(1);
    });
  });

  describe("navigacija", () => {
    it("navigira na /account i zatvara dropdown", () => {
      const onClose = vi.fn();
      renderDropdown({ onClose });

      fireEvent.click(screen.getByText("Account"));

      expect(mockNavigate).toHaveBeenCalledWith("/account");
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("navigira na /change-password i zatvara dropdown", () => {
      const onClose = vi.fn();
      renderDropdown({ onClose });

      fireEvent.click(screen.getByText("Change password"));

      expect(mockNavigate).toHaveBeenCalledWith("/change-password");
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("logout", () => {
    it("poziva clearAuth, navigira na /landing i zatvara dropdown", () => {
      const onClose = vi.fn();
      renderDropdown({ onClose });

      fireEvent.click(screen.getByText("Log out"));

      expect(mockClearAuth).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith("/landing");
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("poziva clearAuth pre navigacije", () => {
      const callOrder: string[] = [];
      mockClearAuth.mockImplementation(() => callOrder.push("clearAuth"));
      mockNavigate.mockImplementation(() => callOrder.push("navigate"));

      renderDropdown();
      fireEvent.click(screen.getByText("Log out"));

      expect(callOrder).toEqual(["clearAuth", "navigate"]);
    });
  });

  describe("DropdownItem danger prop", () => {
    it("Log out dugme ima danger klase", () => {
      renderDropdown();
      const logoutBtn = screen.getByText("Log out").closest("button");
      expect(logoutBtn?.className).toMatch(/text-danger/);
      expect(logoutBtn?.className).toMatch(/hover:bg-danger-muted/);
    });

    it("Account dugme nema danger klase", () => {
      renderDropdown();
      const accountBtn = screen.getByText("Account").closest("button");
      expect(accountBtn?.className).not.toMatch(/text-danger/);
    });
  });
});
