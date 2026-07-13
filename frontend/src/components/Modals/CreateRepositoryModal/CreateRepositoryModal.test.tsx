import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { AppProvider } from "@/context/AppContext";
import CreateRepositoryModal from "./CreateRepositoryModal";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import { useCreateRepository } from "@/services/repositories/useCreateRepository/useCreateRepository";
import userEvent from "@testing-library/user-event";

vi.mock("@/services/repositories/useCreateRepository/useCreateRepository");

vi.mock("./components/OwnerSelect/OwnerSelect", () => ({
  OwnerSelect: ({ value, owners, onChange }: any) => (
    <div>
      <span data-testid="owner-value">{value}</span>
      {owners.map((o: any) => (
        <button key={o.value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  ),
}));

vi.mock("./components/VisibilityToggle/VisibilityToggle", () => ({
  VisibilityToggle: ({ value, onChange }: any) => (
    <div>
      <button
        onClick={() => onChange("public")}
        aria-pressed={value === "public"}
      >
        Public
      </button>
      <button
        onClick={() => onChange("private")}
        aria-pressed={value === "private"}
      >
        Private
      </button>
    </div>
  ),
}));

const mockUseCreateRepository = vi.mocked(useCreateRepository);

const mockHook = (overrides = {}) => {
  mockUseCreateRepository.mockReturnValue({
    loading: false,
    error: "",
    handleCreate: vi.fn().mockResolvedValue({ id: 1, name: "my-image" }),
    ...overrides,
  });
};

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
      username="john.doe"
      {...props}
    />,
    { wrapper },
  );

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  mockHook();
});

describe("CreateRepositoryModal", () => {
  it("renderuje formu kad je otvoren", () => {
    renderModal();
    expect(screen.getByText("Create repository")).toBeTruthy();
  });

  it("ne renderuje nista kad je zatvoren", () => {
    renderModal({ isOpen: false });
    expect(screen.queryByText("Create new repository")).toBeNull();
  });

  it("pretvara naziv u lowercase", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByLabelText(/repository name/i), "MyImage");
    expect(screen.getByLabelText(/repository name/i)).toHaveValue("myimage");
  });

  it("prikazuje gresku za prazan naziv", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(
      screen.getByRole("button", { name: /create repository/i }),
    );
    expect(screen.getByText(/name is required/i)).toBeTruthy();
  });

  it("prikazuje gresku za neispravan naziv", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByLabelText(/repository name/i), "My Repo!");
    await user.click(
      screen.getByRole("button", { name: /create repository/i }),
    );
    expect(screen.getByText(/lowercase letters/i)).toBeTruthy();
  });

  it("ne poziva handleCreate kad validacija ne prodje", async () => {
    const handleCreate = vi.fn().mockResolvedValue(null);
    mockHook({ handleCreate });
    const user = userEvent.setup();
    renderModal();

    await user.click(
      screen.getByRole("button", { name: /create repository/i }),
    );
    expect(handleCreate).not.toHaveBeenCalled();
  });

  it("poziva handleCreate sa ispravnim payload-om", async () => {
    const handleCreate = vi.fn().mockResolvedValue({ id: 1 });
    mockHook({ handleCreate });
    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByLabelText(/repository name/i), "my-image");
    await user.type(
      screen.getByPlaceholderText(/short description/i),
      "My desc",
    );
    await user.click(
      screen.getByRole("button", { name: /create repository/i }),
    );

    expect(handleCreate).toHaveBeenCalledWith({
      name: "my-image",
      description: "My desc",
      visibility: "public",
    });
  });

  it("poziva onCreate nakon uspesnog kreiranja", async () => {
    const onCreate = vi.fn();
    const user = userEvent.setup();
    renderModal({ onCreate });

    await user.type(screen.getByLabelText(/repository name/i), "my-image");
    await user.click(
      screen.getByRole("button", { name: /create repository/i }),
    );

    expect(onCreate).toHaveBeenCalledOnce();
  });

  it("poziva onClose nakon uspesnog kreiranja", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderModal({ onClose });

    await user.type(screen.getByLabelText(/repository name/i), "my-image");
    await user.click(
      screen.getByRole("button", { name: /create repository/i }),
    );

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("ne poziva onCreate ako handleCreate vrati null", async () => {
    const onCreate = vi.fn();
    mockHook({ handleCreate: vi.fn().mockResolvedValue(null) });
    const user = userEvent.setup();
    renderModal({ onCreate });

    await user.type(screen.getByLabelText(/repository name/i), "my-image");
    await user.click(
      screen.getByRole("button", { name: /create repository/i }),
    );

    expect(onCreate).not.toHaveBeenCalled();
  });

  it("prikazuje API gresku", () => {
    mockHook({ error: "Name already taken.", handleCreate: vi.fn() });
    renderModal();
    expect(screen.getByText("Name already taken.")).toBeTruthy();
  });

  it("dugme prikazuje Creating... tokom loading-a", () => {
    mockHook({ loading: true, handleCreate: vi.fn() });
    renderModal();
    expect(screen.getByRole("button", { name: /creating/i })).toBeTruthy();
  });

  it("dugmad su disabled tokom loading-a", () => {
    mockHook({ loading: true, handleCreate: vi.fn() });
    renderModal();
    expect(screen.getByRole("button", { name: /creating/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeDisabled();
  });

  it("poziva onClose na Cancel", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderModal({ onClose });

    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("resetuje formu na Cancel", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByLabelText(/repository name/i), "my-image");
    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(screen.queryByDisplayValue("my-image")).toBeNull();
  });

  describe("Official repository toggle", () => {
    it("ne prikazuje toggle za obicnog korisnika", () => {
      localStorage.setItem("role", "User");
      renderModal();

      expect(screen.queryByText("Official repository")).toBeNull();
    });

    it("prikazuje toggle za administratora", () => {
      localStorage.setItem("role", "Administrator");
      renderModal();

      expect(screen.getByText("Official repository")).toBeInTheDocument();
    });

    it("ne prikazuje toggle kada se kreira repo za organizaciju, cak i za admina", () => {
      localStorage.setItem("role", "Administrator");
      renderModal({
        username: "",
        owner: { name: "acme", displayName: "Acme" },
      });

      expect(screen.queryByText("Official repository")).toBeNull();
    });

    it("salje isOfficial:true i public vidljivost kada je toggle oznacen", async () => {
      localStorage.setItem("role", "Administrator");
      const handleCreate = vi.fn().mockResolvedValue({ id: 1 });
      mockHook({ handleCreate });
      const user = userEvent.setup();
      renderModal();

      await user.type(screen.getByLabelText(/repository name/i), "nginx");
      await user.click(screen.getByRole("checkbox"));
      await user.click(
        screen.getByRole("button", { name: /create repository/i }),
      );

      expect(handleCreate).toHaveBeenCalledWith({
        name: "nginx",
        description: "",
        visibility: "public",
        isOfficial: true,
      });
    });

    it("sakriva prefiks i vidljivost kada je toggle oznacen", async () => {
      localStorage.setItem("role", "Administrator");
      const user = userEvent.setup();
      renderModal();

      await user.click(screen.getByRole("checkbox"));

      expect(screen.queryByText("john.doe/")).toBeNull();
      expect(screen.queryByText("Public")).toBeNull();
      expect(screen.queryByText("Private")).toBeNull();
    });
  });
});
