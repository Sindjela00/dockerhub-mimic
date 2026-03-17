import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { AppProvider } from "@/context/AppContext";
import CreateRepositoryModal from "./CreateRepositoryModal";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import userEvent from "@testing-library/user-event";

const wrapper = ({ children }: { children: ReactNode }) => (
  <MemoryRouter>
    <AppProvider>{children}</AppProvider>
  </MemoryRouter>
);

const renderModal = (props = {}) =>
  render(
    <CreateRepositoryModal
      isOpen={true}
      onClose={vi.fn()}
      onCreate={vi.fn()}
      {...props}
    />,
    { wrapper },
  );

describe("CreateRepositoryModal", () => {
  it("renderuje formu sa svim poljima", () => {
    renderModal();
    expect(screen.getByText("Owner")).toBeTruthy();
    expect(screen.getByLabelText(/repository name/i)).toBeTruthy();
    expect(screen.getByPlaceholderText(/short description/i)).toBeTruthy();
    expect(screen.getByText("Public")).toBeTruthy();
    expect(screen.getByText("Private")).toBeTruthy();
  });

  it("prikazuje username kao default owner", () => {
    renderModal({ username: "fakeUsername" });
    expect(screen.getByText("fakeUsername")).toBeTruthy();
  });

  it("prikazuje preview sa owner/name", () => {
    renderModal();
    expect(screen.getByText("fakeUsername/")).toBeTruthy();
  });

  it("ažurira preview kad se kuca naziv", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(
      screen.getByLabelText(/repository name/i),
      "Repository name",
    );
    expect(screen.getByText("Repository name")).toBeTruthy();
  });

  it("pretvara naziv u lowercase", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByLabelText(/repository name/i), "MyImage");
    expect(screen.getByLabelText(/repository name/i)).toHaveValue("myimage");
  });

  it("prikazuje organizacije u owner dropdown-u", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByText("fakeUsername"));
    expect(screen.getByText("Acme Corp")).toBeTruthy();
    expect(screen.getByText("Dev Team")).toBeTruthy();
  });

  it("menja owner na organizaciju", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByText("fakeUsername"));
    await user.click(screen.getByText("Acme Corp"));

    expect(screen.getByText("acme-corp/")).toBeTruthy();
  });

  it("prikazuje grešku za prazan naziv", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(
      screen.getByRole("button", { name: /create repository/i }),
    );
    expect(screen.getByText(/name is required/i)).toBeTruthy();
  });

  it("prikazuje grešku za neispravan naziv", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByLabelText(/repository name/i), "My Repo!");
    await user.click(
      screen.getByRole("button", { name: /create repository/i }),
    );

    expect(screen.getByText(/lowercase letters/i)).toBeTruthy();
  });

  it("public je default visibility", () => {
    renderModal();
    const publicBtn = screen.getByRole("button", { name: /public/i });
    expect(publicBtn.className).toContain("border-brand");
  });

  it("menja visibility na private", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("button", { name: /private/i }));
    expect(screen.getByText(/only you and your team/i)).toBeTruthy();
  });

  it("poziva onCreate sa ispravnim podacima", async () => {
    const handleCreate = vi.fn();
    const user = userEvent.setup();

    renderModal({ onCreate: handleCreate });

    await user.type(screen.getByLabelText(/repository name/i), "my-image");
    await user.type(
      screen.getByPlaceholderText(/short description/i),
      "My description",
    );
    await user.click(
      screen.getByRole("button", { name: /create repository/i }),
    );

    expect(handleCreate).toHaveBeenCalledWith({
      name: "my-image",
      description: "My description",
      visibility: "public",
      namespace: "fakeUsername",
    });
  });

  it("šalje namespace organizacije kad je org izabrana", async () => {
    const handleCreate = vi.fn();
    const user = userEvent.setup();

    renderModal({ onCreate: handleCreate });

    await user.click(screen.getByText("fakeUsername"));
    await user.click(screen.getByText("Acme Corp"));
    await user.type(screen.getByLabelText(/repository name/i), "my-image");
    await user.click(
      screen.getByRole("button", { name: /create repository/i }),
    );

    expect(handleCreate).toHaveBeenCalledWith(
      expect.objectContaining({ namespace: "acme-corp" }),
    );
  });

  it("poziva onClose nakon uspešnog kreiranja", async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();

    renderModal({ onClose: handleClose });

    await user.type(screen.getByLabelText(/repository name/i), "my-image");
    await user.click(
      screen.getByRole("button", { name: /create repository/i }),
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
