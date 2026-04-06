import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import UserMenu from "./UserMenu";

vi.mock("./UserDropdown", () => ({
  default: ({
    email,
    onClose,
  }: {
    email: string;
    role?: string;
    onClose: () => void;
  }) => (
    <div data-testid="user-dropdown">
      <span>{email}</span>
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

describe("UserMenu", () => {
  afterEach(() => {
    cleanup();
  });

  describe("rendering", () => {
    it("renders the toggle button", () => {
      render(<UserMenu email="test@example.com" />);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("shows the first two uppercase letters of the email as avatar", () => {
      render(<UserMenu email="john@example.com" />);
      expect(screen.getByText("JO")).toBeInTheDocument();
    });

    it("shows the username when provided", () => {
      render(<UserMenu email="a@b.com" username="Alice" />);
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });

    it("does not show username text when omitted", () => {
      render(<UserMenu email="a@b.com" />);
      expect(screen.queryByText(/alice/i)).not.toBeInTheDocument();
    });

    it("does not render the dropdown by default", () => {
      render(<UserMenu email="a@b.com" />);
      expect(screen.queryByTestId("user-dropdown")).not.toBeInTheDocument();
    });
  });
});
