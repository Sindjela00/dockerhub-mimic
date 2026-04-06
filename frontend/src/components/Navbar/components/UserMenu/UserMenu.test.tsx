import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import UserMenu from "./UserMenu";

vi.mock("../UserDropdown/UserDropdown", () => ({
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
    it("renderuje dugme za otvaranje menija", () => {
      render(<UserMenu email="test@example.com" />);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("prikazuje prva dva slova emaila kao avatar (uppercase)", () => {
      render(<UserMenu email="john@example.com" />);
      expect(screen.getByText("JO")).toBeInTheDocument();
    });

    it("prikazuje username kada je prosledjen", () => {
      render(<UserMenu email="a@b.com" username="Alice" />);
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });

    it("ne prikazuje username kada nije prosledjen", () => {
      render(<UserMenu email="a@b.com" />);
      expect(screen.queryByText(/alice/i)).not.toBeInTheDocument();
    });

    it("dropdown nije prikazan po defaultu", () => {
      render(<UserMenu email="a@b.com" />);
      expect(screen.queryByTestId("user-dropdown")).not.toBeInTheDocument();
    });
  });

  describe("toggle dropdown", () => {
    it("otvara dropdown klikom na dugme", () => {
      render(<UserMenu email="a@b.com" />);

      fireEvent.click(screen.getByRole("button"));

      expect(screen.getByTestId("user-dropdown")).toBeInTheDocument();
    });

    it("zatvara dropdown drugim klikom na dugme", () => {
      render(<UserMenu email="a@b.com" />);
      const btn = screen.getByRole("button");

      fireEvent.click(btn);
      fireEvent.click(btn);

      expect(screen.queryByTestId("user-dropdown")).not.toBeInTheDocument();
    });

    it("zatvara dropdown klikom na Close unutar dropdowna", () => {
      render(<UserMenu email="a@b.com" />);

      fireEvent.click(screen.getByRole("button"));
      fireEvent.click(screen.getByText("Close"));

      expect(screen.queryByTestId("user-dropdown")).not.toBeInTheDocument();
    });

    it("prosledjuje email u UserDropdown", () => {
      render(<UserMenu email="user@example.com" />);

      fireEvent.click(screen.getByRole("button"));

      expect(screen.getByText("user@example.com")).toBeInTheDocument();
    });
  });

  describe("click outside", () => {
    it("zatvara dropdown klikom van komponente", () => {
      render(
        <div>
          <UserMenu email="a@b.com" />
          <div data-testid="outside">Outside</div>
        </div>,
      );

      fireEvent.click(screen.getByRole("button"));
      expect(screen.getByTestId("user-dropdown")).toBeInTheDocument();

      fireEvent.mouseDown(screen.getByTestId("outside"));

      expect(screen.queryByTestId("user-dropdown")).not.toBeInTheDocument();
    });

    it("ne zatvara dropdown klikom unutar komponente", () => {
      render(<UserMenu email="a@b.com" />);

      fireEvent.click(screen.getByRole("button"));
      expect(screen.getByTestId("user-dropdown")).toBeInTheDocument();

      fireEvent.mouseDown(screen.getByTestId("user-dropdown"));

      expect(screen.getByTestId("user-dropdown")).toBeInTheDocument();
    });

    it("uklanja event listener pri unmount-u", () => {
      const removeSpy = vi.spyOn(document, "removeEventListener");

      const { unmount } = render(<UserMenu email="a@b.com" />);
      unmount();

      expect(removeSpy).toHaveBeenCalledWith("mousedown", expect.any(Function));
    });
  });
});
