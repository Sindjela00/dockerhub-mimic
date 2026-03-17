import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { AppProvider } from "../../context/AppContext";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import RepositoriesPage from "./RepositoryPage";
import userEvent from "@testing-library/user-event";

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => vi.fn() };
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <MemoryRouter>
    <AppProvider>{children}</AppProvider>
  </MemoryRouter>
);

const renderPage = () => render(<RepositoriesPage />, { wrapper });

describe("RepositoriesPage", () => {
  it("renderuje naslov", () => {
    renderPage();
    expect(screen.getByText("Create repository and start!")).toBeTruthy();
  });

  it("renderuje New repository dugme", () => {
    renderPage();
    expect(
      screen.getByRole("button", { name: /new repository/i }),
    ).toBeTruthy();
  });

  it("renderuje filter tabove", () => {
    renderPage();
    expect(screen.getByText("All")).toBeTruthy();
    expect(screen.getByText("Public")).toBeTruthy();
    expect(screen.getByText("Private")).toBeTruthy();
  });

  it("renderuje view toggle dugmad", () => {
    renderPage();
    expect(screen.getByLabelText("Grid view")).toBeTruthy();
    expect(screen.getByLabelText("Table view")).toBeTruthy();
  });

  it("prikazuje mock repoe u grid prikazu", () => {
    renderPage();
    expect(screen.getByText("john.doe/nginx")).toBeTruthy();
    expect(screen.getByText("john.doe/my-api")).toBeTruthy();
  });

  it("prebacuje na table prikaz", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByLabelText("Table view"));

    // Tabela ima header kolone
    expect(screen.getByText("Name")).toBeTruthy();
    expect(screen.getByText("Pulls")).toBeTruthy();
  });

  it("prebacuje nazad na grid prikaz", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByLabelText("Table view"));
    await user.click(screen.getByLabelText("Grid view"));

    // Grid nema "Pulls" header
    expect(screen.queryByText("Pulls")).toBeNull();
  });

  it("filtrira po public", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByText("Public"));

    expect(screen.getByText("john.doe/nginx")).toBeTruthy();
    expect(screen.queryByText("john.doe/my-api")).toBeNull();
  });

  it("filtrira po private", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByText("Private"));

    expect(screen.queryByText("john.doe/nginx")).toBeNull();
    expect(screen.getByText("john.doe/my-api")).toBeTruthy();
  });

  it("pretražuje po imenu", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(
      screen.getByPlaceholderText(/search repositories/i),
      "nginx",
    );

    expect(screen.getByText("john.doe/nginx")).toBeTruthy();
    expect(screen.queryByText("john.doe/my-api")).toBeNull();
  });

  it("prikazuje no results poruku kad search nema rezultata", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(
      screen.getByPlaceholderText(/search repositories/i),
      "xxxxxx",
    );

    expect(screen.getByText(/no repositories match/i)).toBeTruthy();
  });

  it("clear search resetuje pretragu", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(
      screen.getByPlaceholderText(/search repositories/i),
      "xxxxxx",
    );
    await user.click(screen.getByText(/clear search/i));

    expect(screen.getByText("john.doe/nginx")).toBeTruthy();
  });
});
