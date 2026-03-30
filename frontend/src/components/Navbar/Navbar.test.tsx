import * as auth from "../../context/AppContext";

import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import Navbar from "./Navbar";

vi.mock("../../context/AppContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("./components/AuthButtons", () => ({
  default: () => <div>AuthButtons</div>,
}));

vi.mock("./components/UserMenu", () => ({
  default: ({ username }: any) => <div>UserMenu: {username}</div>,
}));

const mockedUseAuth = auth.useAuth as unknown as ReturnType<typeof vi.fn>;

describe("Navbar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders title", () => {
    mockedUseAuth.mockReturnValue({
      isLoggedIn: false,
    });

    render(<Navbar title="Dashboard" />);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("renders AuthButtons when user is not logged in", () => {
    mockedUseAuth.mockReturnValue({
      isLoggedIn: false,
    });

    render(<Navbar />);

    expect(screen.getByText("AuthButtons")).toBeInTheDocument();
  });

  it("renders UserMenu when user is logged in", () => {
    mockedUseAuth.mockReturnValue({
      isLoggedIn: true,
      username: "marija",
      email: "marija@test.com",
      role: "user",
    });

    render(<Navbar />);

    expect(screen.getByText(/UserMenu: marija/i)).toBeInTheDocument();
  });

  it("passes correct props to UserMenu", () => {
    mockedUseAuth.mockReturnValue({
      isLoggedIn: true,
      username: "marija",
      email: "marija@test.com",
      role: "admin",
    });

    render(<Navbar />);

    expect(screen.getByText(/UserMenu: marija/i)).toBeInTheDocument();
  });

  it("renders empty title by default", () => {
    mockedUseAuth.mockReturnValue({
      isLoggedIn: false,
    });

    render(<Navbar />);

    const heading = screen.getByRole("heading");
    expect(heading).toBeInTheDocument();
    expect(heading.textContent).toBe("");
  });
});
