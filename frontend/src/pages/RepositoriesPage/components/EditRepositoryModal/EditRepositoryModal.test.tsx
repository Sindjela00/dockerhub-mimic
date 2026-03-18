import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { AppProvider } from "@/context/AppContext";
import EditRepositoryModal from "./EditRepositoryModal";
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
    <EditRepositoryModal
      isOpen={true}
      onClose={vi.fn()}
      onSave={vi.fn()}
      repo={MOCK_REPO}
      {...props}
    />,
    { wrapper },
  );

describe("EditRepositoryModal", () => {
  it("ne renderuje ništa kad je zatvoren", () => {
    renderModal({ isOpen: false });
    expect(screen.queryByText(/save changes/i)).toBeNull();
  });

  it("renderuje naziv repoa u headeru", () => {
    renderModal();
    expect(screen.getByText("john.doe/nginx")).toBeTruthy();
  });

  it("učitava trenutni opis repoa", () => {
    renderModal();
    const textarea = screen.getByPlaceholderText(/short description/i);
    expect((textarea as HTMLTextAreaElement).value).toBe(
      "Official build of Nginx.",
    );
  });

  it("učitava trenutnu vidljivost repoa", () => {
    renderModal();
    const publicBtn = screen.getByRole("button", { name: /public/i });
    expect(publicBtn.className).toContain("border-brand");
  });

  it("učitava private vidljivost kad je repo privatan", () => {
    renderModal({ repo: { ...MOCK_REPO, visibility: "private" } });
    const privateBtn = screen.getByRole("button", { name: /private/i });
    expect(privateBtn.className).toContain("border-brand");
  });

  it("menja opis", async () => {
    const user = userEvent.setup();
    renderModal();

    const textarea = screen.getByPlaceholderText(/short description/i);
    await user.clear(textarea);
    await user.type(textarea, "New description");

    expect((textarea as HTMLTextAreaElement).value).toBe("New description");
  });

  it("menja vidljivost", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("button", { name: /private/i }));
    expect(screen.getByText(/only you and your team/i)).toBeTruthy();
  });

  it("poziva onSave sa ispravnim podacima", async () => {
    const handleSave = vi.fn();
    const user = userEvent.setup();

    renderModal({ onSave: handleSave });

    const textarea = screen.getByPlaceholderText(/short description/i);
    await user.clear(textarea);
    await user.type(textarea, "Updated description");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(handleSave).toHaveBeenCalledWith({
      id: "1",
      description: "Updated description",
      visibility: "public",
    });
  });

  it("poziva onClose nakon Save", async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();

    renderModal({ onClose: handleClose });
    await user.click(screen.getByRole("button", { name: /save changes/i }));

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
