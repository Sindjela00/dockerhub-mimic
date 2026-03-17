import { describe, expect, it, vi } from "vitest";

import HomePage from "./HomePage";
import { renderWithProviders } from "../../test/test.utils";
import { screen } from "@testing-library/react";

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => vi.fn() };
});

describe("HomePage", () => {
  it("renderuje welcome banner", () => {
    renderWithProviders(<HomePage />);
    expect(screen.getByText("Welcome back")).toBeTruthy();
  });

  it("renderuje opis u banneru", () => {
    renderWithProviders(<HomePage />);
    expect(screen.getByText(/manage your container images/i)).toBeTruthy();
  });

  it("renderuje Create repository dugme", () => {
    renderWithProviders(<HomePage />);
    expect(
      screen.getByRole("button", { name: /create repository/i }),
    ).toBeTruthy();
  });

  it("renderuje Explore images dugme", () => {
    renderWithProviders(<HomePage />);
    expect(
      screen.getByRole("button", { name: /explore images/i }),
    ).toBeTruthy();
  });

  it("renderuje Overview sekciju", () => {
    renderWithProviders(<HomePage />);
    expect(screen.getByText(/overview/i)).toBeTruthy();
  });

  it("renderuje stat kartice", () => {
    renderWithProviders(<HomePage />);
    expect(screen.getByText("Repositories")).toBeTruthy();
    expect(screen.getByText("Total pulls")).toBeTruthy();
    expect(screen.getByText("Stars")).toBeTruthy();
    expect(screen.getByText("Teams")).toBeTruthy();
  });

  it("renderuje Quick actions sekciju", () => {
    renderWithProviders(<HomePage />);
    expect(screen.getByText(/quick actions/i)).toBeTruthy();
  });

  it("renderuje quick link kartice", () => {
    renderWithProviders(<HomePage />);
    expect(screen.getByText("My repositories")).toBeTruthy();
    expect(screen.getByText("Recent pulls")).toBeTruthy();
    expect(screen.getByText("Starred images")).toBeTruthy();
  });

  it("renderuje Docker Hub badge", () => {
    renderWithProviders(<HomePage />);
    expect(screen.getByText(/docker hub/i)).toBeTruthy();
  });
});
