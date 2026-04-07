import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { AppProvider } from "@/context/AppContext";
import Layout from "./Layout";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";

vi.mock("./Sidebar/Sidebar", () => ({
  default: ({ activePath }: { activePath: string }) => (
    <aside data-testid="sidebar" data-active-path={activePath}>
      Sidebar
    </aside>
  ),
}));

vi.mock("./Navbar/Navbar", () => ({
  default: ({ title }: { title?: string }) => (
    <nav data-testid="navbar">{title ?? ""}</nav>
  ),
}));

const wrapper = ({ children }: { children: ReactNode }) => (
  <MemoryRouter>
    <AppProvider>{children}</AppProvider>
  </MemoryRouter>
);

const renderLayout = (props = {}, loggedIn = true) => {
  if (loggedIn) {
    localStorage.setItem("token", "fake.token.here");
  } else {
    localStorage.removeItem("token");
  }

  return render(
    <Layout {...props}>
      <div data-testid="content">Page content</div>
    </Layout>,
    { wrapper },
  );
};

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe("Layout", () => {
  it("renderuje children", () => {
    renderLayout();
    expect(screen.getByTestId("content")).toBeTruthy();
    expect(screen.getByText("Page content")).toBeTruthy();
  });

  it("renderuje navbar", () => {
    renderLayout();
    expect(screen.getByTestId("navbar")).toBeTruthy();
  });

  it("prosledjuje pageTitle u navbar", () => {
    renderLayout({ pageTitle: "Repositories" });
    expect(screen.getByText("Repositories")).toBeTruthy();
  });

  it("prikazuje sidebar kad je korisnik ulogovan", () => {
    renderLayout({}, true);
    expect(screen.getByTestId("sidebar")).toBeTruthy();
  });

  it("ne prikazuje sidebar kad korisnik nije ulogovan", () => {
    renderLayout({}, false);
    expect(screen.queryByTestId("sidebar")).toBeNull();
  });

  it("ne prikazuje sidebar kad je showSidebar false", () => {
    renderLayout({ showSidebar: false }, true);
    expect(screen.queryByTestId("sidebar")).toBeNull();
  });

  it("prosledjuje pathname kao activePath u sidebar", () => {
    render(
      <MemoryRouter initialEntries={["/repositories"]}>
        <AppProvider>
          <Layout>
            <div>content</div>
          </Layout>
        </AppProvider>
      </MemoryRouter>,
    );
  });

  it("sidebar prima tacan activePath za trenutnu rutu", () => {
    localStorage.setItem("token", "fake.token.here");

    render(
      <MemoryRouter initialEntries={["/repositories"]}>
        <AppProvider>
          <Layout>
            <div>content</div>
          </Layout>
        </AppProvider>
      </MemoryRouter>,
    );

    const sidebar = screen.getByTestId("sidebar");
    expect(sidebar.getAttribute("data-active-path")).toBe("/repositories");
  });
});
