import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import AuthButtons from "./AuthButtons";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("@/components/Button/Button", () => ({
  default: ({
    children,
    onClick,
    variant,
    size,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: string;
    size?: string;
  }) => (
    <button onClick={onClick} data-variant={variant} data-size={size}>
      {children}
    </button>
  ),
}));

describe("AuthButtons", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders both buttons", () => {
      render(<AuthButtons />);
      expect(screen.getByText(/login/i)).toBeInTheDocument();
      expect(screen.getByText(/register/i)).toBeInTheDocument();
    });

    it("renders Login button with ghost variant", () => {
      render(<AuthButtons />);
      const loginBtn = screen.getByText(/login/i).closest("button");
      expect(loginBtn).toHaveAttribute("data-variant", "ghost");
    });

    it("renders Register button with primary variant", () => {
      render(<AuthButtons />);
      const registerBtn = screen.getByText(/register/i).closest("button");
      expect(registerBtn).toHaveAttribute("data-variant", "primary");
    });

    it("renders both buttons with sm size", () => {
      render(<AuthButtons />);
      const buttons = screen.getAllByRole("button");
      buttons.forEach((btn) => {
        expect(btn).toHaveAttribute("data-size", "sm");
      });
    });
  });

  describe("navigation", () => {
    it("navigates to /login when Login is clicked", () => {
      render(<AuthButtons />);
      fireEvent.click(screen.getByText(/login/i));
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });

    it("navigates to /register when Register is clicked", () => {
      render(<AuthButtons />);
      fireEvent.click(screen.getByText(/register/i));
      expect(mockNavigate).toHaveBeenCalledWith("/register");
    });

    it("does not navigate on render without interaction", () => {
      render(<AuthButtons />);
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("navigates only once per click", () => {
      render(<AuthButtons />);
      fireEvent.click(screen.getByText(/login/i));
      expect(mockNavigate).toHaveBeenCalledTimes(1);
    });

    it("does not call /register when Login is clicked", () => {
      render(<AuthButtons />);
      fireEvent.click(screen.getByText(/login/i));
      expect(mockNavigate).not.toHaveBeenCalledWith("/register");
    });

    it("does not call /login when Register is clicked", () => {
      render(<AuthButtons />);
      fireEvent.click(screen.getByText(/register/i));
      expect(mockNavigate).not.toHaveBeenCalledWith("/login");
    });
  });
});
