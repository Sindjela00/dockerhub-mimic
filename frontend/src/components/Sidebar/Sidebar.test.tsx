import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { AppProvider } from "../../context/AppContext";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import userEvent from "@testing-library/user-event";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
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
  it("renderuje nav linkove", () => {
    renderSidebar();
    expect(screen.getByText("Home")).toBeTruthy();
    expect(screen.getAllByText("Explore").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Repositories")).toBeTruthy();
    expect(screen.getByText("Settings")).toBeTruthy();
  });

  it("renderuje logo", () => {
    renderSidebar();
    expect(screen.getByText("Docker Hub")).toBeTruthy();
  });

  it("poziva onNavigate kad se klikne nav item", async () => {
    const onNavigate = vi.fn();
    const user = userEvent.setup();

    renderSidebar({ onNavigate });
    const exploreButtons = screen.getAllByText("Explore");
    const exploreNavBtn = exploreButtons.find(
      (el) => el.closest("button") !== null,
    );
    await user.click(exploreNavBtn!.closest("button")!);

    expect(onNavigate).toHaveBeenCalledWith("/explore");
  });

  it("active nav item ima activePath klasu", () => {
    renderSidebar({ activePath: "/explore" });

    const exploreButtons = screen.getAllByText("Explore");
    const exploreNavBtn = exploreButtons.find(
      (el) => el.closest("button") !== null,
    );
    const btn = exploreNavBtn!.closest("button");
    expect(btn?.className).toContain("bg-brand-subtle");
  });

  it("collapse dugme sakriva labele", async () => {
    const user = userEvent.setup();
    renderSidebar();

    const collapseBtn = screen.getByLabelText("Toggle sidebar");
    await user.click(collapseBtn);

    const homeLabel = screen.getByText("Home");
    expect(homeLabel.style.opacity).toBe("0");
  });

  it("collapse dugme ima hidden klasu za mobilni", () => {
    renderSidebar();
    const collapseBtn = screen.getByLabelText("Toggle sidebar");
    expect(collapseBtn.className).toContain("hidden!");
  });

  it("prikazuje sekcijske naslove", () => {
    renderSidebar();
    expect(screen.getAllByText("Explore").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Personal")).toBeTruthy();
  });
});
