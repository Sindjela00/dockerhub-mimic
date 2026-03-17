import { describe, expect, it, vi } from "vitest";

import LandingPage from "./LandingPage";
import { renderWithProviders } from "../../test/test.utils";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

describe("LandingPage", () => {
  it("renderuje hero naslov", () => {
    renderWithProviders(<LandingPage />);
    expect(screen.getByText(/build, share and run/i)).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: /build, share and run/i }),
    ).toBeTruthy();
  });

  it("renderuje hero opis", () => {
    renderWithProviders(<LandingPage />);
    expect(screen.getByText(/world's largest library/i)).toBeTruthy();
  });

  it("renderuje Get started dugme", () => {
    renderWithProviders(<LandingPage />);
    expect(
      screen.getByRole("button", { name: /get started for free/i }),
    ).toBeTruthy();
  });

  it("renderuje Sign in dugme", () => {
    renderWithProviders(<LandingPage />);
    expect(screen.getByRole("button", { name: /sign in/i })).toBeTruthy();
  });

  it("Get started navigira na /register", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LandingPage />);

    await user.click(
      screen.getByRole("button", { name: /get started for free/i }),
    );
    expect(mockNavigate).toHaveBeenCalledWith("/register");
  });

  it("Sign in navigira na /login", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LandingPage />);

    await user.click(screen.getByRole("button", { name: /sign in/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });

  it("renderuje stats sekciju", () => {
    renderWithProviders(<LandingPage />);
    expect(screen.getByText("Repositories")).toBeTruthy();
    expect(screen.getByText("Image pulls")).toBeTruthy();
    expect(screen.getByText("Developers")).toBeTruthy();
    expect(screen.getByText("Uptime")).toBeTruthy();
  });

  it("renderuje features sekciju", () => {
    renderWithProviders(<LandingPage />);
    expect(screen.getByText(/everything you need/i)).toBeTruthy();
  });

  it("renderuje sve feature kartice", () => {
    renderWithProviders(<LandingPage />);
    expect(screen.getByText("Container registry")).toBeTruthy();
    expect(screen.getByText("Security scanning")).toBeTruthy();
    expect(screen.getByText("Fast pulls")).toBeTruthy();
    expect(screen.getByText("Team collaboration")).toBeTruthy();
  });

  it("renderuje badge sa opisom registra", () => {
    renderWithProviders(<LandingPage />);
    expect(screen.getByText(/the container image registry/i)).toBeTruthy();
  });
});
