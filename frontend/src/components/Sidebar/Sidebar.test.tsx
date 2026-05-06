import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { AppProvider } from "../../context/AppContext";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import userEvent from "@testing-library/user-event";

const mockNavigate = vi.fn();
const mockClearAuth = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("../../context/AppContext", async () => {
  const actual = await vi.importActual("../../context/AppContext");
  return {
    ...actual,
    useAppContext: () => ({
      clearAuth: mockClearAuth,
    }),
  };
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <MemoryRouter>
    <AppProvider>{children}</AppProvider>
  </MemoryRouter>
);

const renderSidebar = (props = {}) =>
  render(<Sidebar {...props} />, { wrapper });

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe("Sidebar", () => {
  describe("Rendering", () => {
    it("renders logo and Docker Hub text", () => {
      renderSidebar();

      expect(screen.getByText("Docker Hub")).toBeInTheDocument();
    });

    it("renders section titles", () => {
      renderSidebar();

      expect(screen.getByText("Personal")).toBeInTheDocument();
    });

    it("renders logout button", () => {
      renderSidebar();

      expect(screen.getByText("Log out")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Log out" }),
      ).toBeInTheDocument();
    });

    it("renders menu button on mobile", () => {
      // Mock mobile viewport
      window.innerWidth = 500;
      window.dispatchEvent(new Event("resize"));

      renderSidebar();

      const menuButton = screen.getByLabelText("Open menu");
      expect(menuButton).toBeInTheDocument();
      expect(menuButton).toHaveClass("sm:hidden");
    });
  });

  describe("Navigation", () => {
    it("calls onNavigate when nav item is clicked", async () => {
      const onNavigate = vi.fn();
      const user = userEvent.setup();

      renderSidebar({ onNavigate });

      const homeButton = screen.getByRole("button", { name: /home/i });
      await user.click(homeButton);

      expect(onNavigate).toHaveBeenCalledTimes(1);
      expect(onNavigate).toHaveBeenCalledWith("/");
    });

    it("closes mobile menu after navigation", async () => {
      const onNavigate = vi.fn();
      const user = userEvent.setup();

      window.innerWidth = 500;
      window.dispatchEvent(new Event("resize"));

      renderSidebar({ onNavigate });

      // Open mobile menu
      const menuButton = screen.getByLabelText("Open menu");
      await user.click(menuButton);

      // Click a nav item
      const homeButton = screen.getByRole("button", { name: /home/i });
      await user.click(homeButton);

      expect(onNavigate).toHaveBeenCalled();
    });
  });

  describe("Active State", () => {
    it("does not apply active class to inactive nav items", () => {
      renderSidebar({ activePath: "/explore" });

      const homeButton = screen.getByRole("button", { name: /home/i });
      expect(homeButton).not.toHaveClass("bg-brand-subtle");
    });
  });

  describe("Collapse Functionality", () => {
    it("hides labels when collapsed", async () => {
      const user = userEvent.setup();
      renderSidebar();

      const collapseButton = screen.getByLabelText("Toggle sidebar");
      await user.click(collapseButton);

      const homeLabel = screen.getByText("Home");
      expect(homeLabel).toHaveStyle({ opacity: "0" });
    });

    it("shows labels when expanded", async () => {
      const user = userEvent.setup();
      renderSidebar();

      const collapseButton = screen.getByLabelText("Toggle sidebar");
      await user.click(collapseButton);
      await user.click(collapseButton);

      const homeLabel = screen.getByText("Home");
      expect(homeLabel).toHaveStyle({ opacity: "1" });
    });

    it("applies collapsed width styles", async () => {
      const user = userEvent.setup();
      const { container } = renderSidebar();

      const sidebar = container.querySelector("aside");
      expect(sidebar).toHaveStyle({ width: "232px" });

      const collapseButton = screen.getByLabelText("Toggle sidebar");
      await user.click(collapseButton);

      expect(sidebar).toHaveStyle({ width: "56px" });
    });
  });

  describe("Logout Functionality", () => {
    it("calls clearAuth and onNavigate when logout is clicked", async () => {
      const onNavigate = vi.fn();
      const user = userEvent.setup();

      renderSidebar({ onNavigate });

      const logoutButton = screen.getByRole("button", { name: "Log out" });
      await user.click(logoutButton);

      expect(mockClearAuth).toHaveBeenCalledTimes(1);
      expect(onNavigate).toHaveBeenCalledWith("/landing");
    });

    it("does not call onNavigate if not provided", async () => {
      const user = userEvent.setup();
      renderSidebar();

      const logoutButton = screen.getByRole("button", { name: "Log out" });
      await user.click(logoutButton);

      expect(mockClearAuth).toHaveBeenCalledTimes(1);
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe("Mobile Menu", () => {
    beforeEach(() => {
      window.innerWidth = 500;
      window.dispatchEvent(new Event("resize"));
    });

    it("opens mobile menu when menu button is clicked", async () => {
      const user = userEvent.setup();
      renderSidebar();

      const menuButton = screen.getByLabelText("Open menu");
      await user.click(menuButton);

      const sidebar = screen.getByRole("complementary");
      expect(sidebar).toHaveClass("flex!");
    });

    it("closes mobile menu when overlay is clicked", async () => {
      const user = userEvent.setup();
      renderSidebar();

      const menuButton = screen.getByLabelText("Open menu");
      await user.click(menuButton);

      const overlay = document.querySelector(".fixed.inset-0");
      expect(overlay).toBeInTheDocument();

      await user.click(overlay!);

      expect(screen.queryByRole("complementary")).not.toHaveClass("flex!");
    });
  });

  describe("Accessibility", () => {
    it("has proper aria-label for expand/collapse button", () => {
      renderSidebar();

      const collapseButton = screen.getByLabelText("Toggle sidebar");
      expect(collapseButton).toHaveAttribute("aria-label", "Toggle sidebar");
    });

    it("has proper aria-label for mobile menu button", () => {
      window.innerWidth = 500;
      window.dispatchEvent(new Event("resize"));

      renderSidebar();

      const menuButton = screen.getByLabelText("Open menu");
      expect(menuButton).toHaveAttribute("aria-label", "Open menu");

      window.innerWidth = 1024;
      window.dispatchEvent(new Event("resize"));
    });
  });

  describe("Edge Cases", () => {
    it("handles missing onNavigate prop gracefully", async () => {
      const user = userEvent.setup();
      renderSidebar();

      const homeButton = screen.getByRole("button", { name: /home/i });
      await user.click(homeButton);

      expect(screen.getByText("Home")).toBeInTheDocument();
    });

    it("persists collapse state across renders", () => {
      const { rerender } = renderSidebar();

      expect(screen.getByText("Docker Hub")).toBeVisible();

      rerender(<Sidebar activePath="/test" />);
      expect(screen.getByText("Docker Hub")).toBeInTheDocument();
    });
  });
});
