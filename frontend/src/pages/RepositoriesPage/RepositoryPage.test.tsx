import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { AppProvider } from "@/context/AppContext";
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
      screen.getByRole("button", { name: /New repository/i }),
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

  it("prikazuje mock repoe", () => {
    renderPage();
    expect(screen.getByText("john.doe/nginx")).toBeTruthy();
    expect(screen.getByText("john.doe/my-api")).toBeTruthy();
  });

  it("prebacuje na table prikaz", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByLabelText("Table view"));
    expect(screen.getByText("Pulls")).toBeTruthy();
  });

  it("prebacuje nazad na grid prikaz", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByLabelText("Table view"));
    await user.click(screen.getByLabelText("Grid view"));
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

  it("prikazuje no results poruku", async () => {
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

  it("otvara edit modal na edit ikonicu", async () => {
    const user = userEvent.setup();
    renderPage();

    const editBtns = screen.getAllByTitle("Edit");
    await user.click(editBtns[0]);

    expect(screen.getByText(/save changes/i)).toBeTruthy();
  });

  it("edit modal sadrži trenutni opis repoa", async () => {
    const user = userEvent.setup();
    renderPage();

    const editBtns = screen.getAllByTitle("Edit");
    await user.click(editBtns[0]);

    const textarea = screen.getByPlaceholderText(/short description/i);
    expect((textarea as HTMLTextAreaElement).value).toBeTruthy();
  });

  it("zatvara edit modal na Cancel", async () => {
    const user = userEvent.setup();
    renderPage();

    const editBtns = screen.getAllByTitle("Edit");
    await user.click(editBtns[0]);
    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(screen.queryByText(/save changes/i)).toBeNull();
  });

  it("otvara delete modal na delete ikonicu", async () => {
    const user = userEvent.setup();
    renderPage();

    const deleteBtns = screen.getAllByTitle("Delete");
    await user.click(deleteBtns[0]);

    expect(screen.getByText(/this action cannot be undone/i)).toBeTruthy();
  });

  it("delete dugme je disabled dok naziv nije potvrđen", async () => {
    const user = userEvent.setup();
    renderPage();

    const deleteBtns = screen.getAllByTitle("Delete");
    await user.click(deleteBtns[0]);

    const deleteBtn = screen.getByRole("button", {
      name: /delete repository/i,
    });
    expect(deleteBtn).toBeDisabled();
  });

  it("delete dugme se aktivira kad se ukuca tačan naziv", async () => {
    const user = userEvent.setup();
    renderPage();

    const deleteBtns = screen.getAllByTitle("Delete");
    await user.click(deleteBtns[0]);

    const input = screen.getByPlaceholderText("john.doe/nginx");
    await user.type(input, "john.doe/nginx");

    const deleteBtn = screen.getByRole("button", {
      name: /delete repository/i,
    });
    expect(deleteBtn).not.toBeDisabled();
  });

  it("zatvara delete modal na Cancel", async () => {
    const user = userEvent.setup();
    renderPage();

    const deleteBtns = screen.getAllByTitle("Delete");
    await user.click(deleteBtns[0]);
    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(screen.queryByText(/this action cannot be undone/i)).toBeNull();
  });
});
