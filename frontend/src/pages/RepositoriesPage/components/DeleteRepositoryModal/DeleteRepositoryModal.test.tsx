import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { AppProvider } from "@/context/AppContext";
import DeleteRepositoryModal from "./DeleteRepositoryModal";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import type { Repository } from "@/pages/RepositoriesPage/types/types";
import userEvent from "@testing-library/user-event";

const wrapper = ({ children }: { children: ReactNode }) => (
  <MemoryRouter>
    <AppProvider>{children}</AppProvider>
  </MemoryRouter>
);

const MOCK_REPO: Repository = {
  id: "1",
  name: "nginx",
  namespace: "john.doe",
  description: "Official build of Nginx.",
  visibility: "public",
  pullCount: 142300,
  stars: 48,
  tags: ["latest"],
  updatedAt: "2025-03-10T12:00:00Z",
};

const renderModal = (props = {}) =>
  render(
    <DeleteRepositoryModal
      isOpen={true}
      onClose={vi.fn()}
      onDelete={vi.fn()}
      repo={MOCK_REPO}
      {...props}
    />,
    { wrapper },
  );

describe("DeleteRepositoryModal", () => {
  it("ne renderuje ništa kad je zatvoren", () => {
    renderModal({ isOpen: false });
    expect(screen.queryByText(/cannot be undone/i)).toBeNull();
  });

  it("renderuje warning poruku", () => {
    renderModal();
    expect(screen.getByText(/this action cannot be undone/i)).toBeTruthy();
  });

  it("prikazuje puno ime repoa u warning-u", () => {
    renderModal();
    expect(screen.getByText("john.doe/nginx")).toBeTruthy();
  });

  it("prikazuje confirm input sa placeholder-om", () => {
    renderModal();
    expect(screen.getByPlaceholderText("john.doe/nginx")).toBeTruthy();
  });

  it("delete dugme je disabled na početku", () => {
    renderModal();
    expect(
      screen.getByRole("button", { name: /delete repository/i }),
    ).toBeDisabled();
  });

  it("delete dugme ostaje disabled za pogrešan naziv", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByPlaceholderText("john.doe/nginx"), "wrong");
    expect(
      screen.getByRole("button", { name: /delete repository/i }),
    ).toBeDisabled();
  });

  it("delete dugme se aktivira za tačan naziv", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(
      screen.getByPlaceholderText("john.doe/nginx"),
      "john.doe/nginx",
    );
    expect(
      screen.getByRole("button", { name: /delete repository/i }),
    ).not.toBeDisabled();
  });

  it("poziva onDelete sa id-em repoa", async () => {
    const handleDelete = vi.fn();
    const user = userEvent.setup();

    renderModal({ onDelete: handleDelete });

    await user.type(
      screen.getByPlaceholderText("john.doe/nginx"),
      "john.doe/nginx",
    );
    await user.click(
      screen.getByRole("button", { name: /delete repository/i }),
    );

    expect(handleDelete).toHaveBeenCalledWith("1");
  });

  it("poziva onClose nakon brisanja", async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();

    renderModal({ onClose: handleClose });

    await user.type(
      screen.getByPlaceholderText("john.doe/nginx"),
      "john.doe/nginx",
    );
    await user.click(
      screen.getByRole("button", { name: /delete repository/i }),
    );

    expect(handleClose).toHaveBeenCalledOnce();
  });

  it("poziva onClose na Cancel", async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();

    renderModal({ onClose: handleClose });
    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(handleClose).toHaveBeenCalledOnce();
  });
});
