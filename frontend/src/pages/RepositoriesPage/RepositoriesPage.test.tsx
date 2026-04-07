import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { AppProvider } from "@/context/AppContext";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import RepositoriesPage from "./RepositoriesPage";
import { Repository } from "@/services/repositories/repositories.api";
import { useRepositories } from "@/services/repositories/useRepositories/useRepositories";
import userEvent from "@testing-library/user-event";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("@/services/repositories/useRepositories/useRepositories");

vi.mock(
  "../../components/Modals/CreateRepositoryModal/CreateRepositoryModal",
  () => ({
    default: ({ isOpen, onClose, onCreate }: any) =>
      isOpen ? (
        <div data-testid="create-modal">
          <button onClick={onClose}>Cancel</button>
          <button onClick={onCreate}>Confirm create</button>
        </div>
      ) : null,
  }),
);

vi.mock(
  "../../components/Modals/EditRepositoryModal/EditRepositoryModal",
  () => ({
    default: ({ isOpen, onClose, onSave }: any) =>
      isOpen ? (
        <div data-testid="edit-modal">
          <button onClick={onClose}>Cancel</button>
          <button onClick={onSave}>Confirm save</button>
        </div>
      ) : null,
  }),
);

vi.mock(
  "../../components/Modals/DeleteRepositoryModal/DeleteRepositoryModal",
  () => ({
    default: ({ isOpen, onClose, onDelete }: any) =>
      isOpen ? (
        <div data-testid="delete-modal">
          <button onClick={onClose}>Cancel</button>
          <button onClick={onDelete}>Confirm delete</button>
        </div>
      ) : null,
  }),
);

const MOCK_REPOS: Repository[] = [
  {
    id: 1,
    name: "nginx",
    fullName: "john.doe/nginx",
    description: "Official build of Nginx.",
    visibility: "public",
    ownerEmail: "john@example.com",
    createdAt: "2023-01-15T08:00:00Z",
    updatedAt: "2025-03-10T12:00:00Z",
    isOfficial: false,
    starCount: 48,
    tags: ["latest"],
  },
  {
    id: 2,
    name: "my-api",
    fullName: "john.doe/my-api",
    description: "REST API.",
    visibility: "private",
    ownerEmail: "john@example.com",
    createdAt: "2023-02-01T08:00:00Z",
    updatedAt: "2025-03-14T08:30:00Z",
    isOfficial: false,
    starCount: 5,
    tags: [],
  },
];

const mockUseRepositories = vi.mocked(useRepositories);

const mockHook = (overrides = {}) => {
  mockUseRepositories.mockReturnValue({
    repos: MOCK_REPOS,
    total: MOCK_REPOS.length,
    loading: false,
    error: "",
    fetchRepositories: vi.fn(),
    ...overrides,
    page: 0,
    pageSize: 0,
  });
};

const wrapper = ({ children }: { children: ReactNode }) => (
  <MemoryRouter>
    <AppProvider>{children}</AppProvider>
  </MemoryRouter>
);

const renderPage = () => render(<RepositoriesPage />, { wrapper });

beforeEach(() => {
  vi.clearAllMocks();
  mockHook();
});

describe("RepositoriesPage", () => {
  it("renderuje naslov", () => {
    renderPage();
    expect(screen.getByText("Repositories")).toBeTruthy();
  });

  it("prikazuje total broj repoa", () => {
    renderPage();
    expect(screen.getByText(/2 repositories/i)).toBeTruthy();
  });

  it("renderuje New repository dugme", () => {
    renderPage();
    expect(
      screen.getByRole("button", { name: /new repository/i }),
    ).toBeTruthy();
  });

  it("prikazuje repoe iz hook-a", () => {
    renderPage();
    expect(screen.getByText("john.doe/nginx")).toBeTruthy();
    expect(screen.getByText("john.doe/my-api")).toBeTruthy();
  });

  it("prikazuje loader dok se ucitava", () => {
    mockHook({ loading: true, repos: [], total: 0 });
    const { container } = renderPage();
    expect(container.querySelector(".animate-spin")).toBeTruthy();
  });

  it("prikazuje error poruku", () => {
    mockHook({ error: "Failed to load.", repos: [], total: 0 });
    renderPage();
    expect(screen.getByText("Failed to load.")).toBeTruthy();
  });

  it("prikazuje empty state kad nema repoa", () => {
    mockHook({ repos: [], total: 0 });
    renderPage();
    expect(screen.getByText(/no repositories yet/i)).toBeTruthy();
  });

  it("renderuje view toggle dugmad", () => {
    renderPage();
    expect(screen.getByLabelText("Grid view")).toBeTruthy();
    expect(screen.getByLabelText("Table view")).toBeTruthy();
  });

  it("prebacuje na table prikaz", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByLabelText("Table view"));
    expect(screen.getByText("Stars")).toBeTruthy();
  });

  it("prebacuje nazad na grid prikaz", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByLabelText("Table view"));
    await user.click(screen.getByLabelText("Grid view"));
    expect(screen.queryByText("Stars")).toBeNull();
  });

  it("renderuje filter tabove", () => {
    renderPage();
    expect(screen.getByText("All")).toBeTruthy();
    expect(screen.getByText("Public")).toBeTruthy();
    expect(screen.getByText("Private")).toBeTruthy();
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

  it("pretrazuje po imenu", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(
      screen.getByPlaceholderText(/search repositories/i),
      "nginx",
    );
    expect(screen.getByText("john.doe/nginx")).toBeTruthy();
    expect(screen.queryByText("john.doe/my-api")).toBeNull();
  });

  it("pretrazuje po fullName", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(
      screen.getByPlaceholderText(/search repositories/i),
      "john.doe/my",
    );
    expect(screen.getByText("john.doe/my-api")).toBeTruthy();
    expect(screen.queryByText("john.doe/nginx")).toBeNull();
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

  it("zatvara create modal na Cancel", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: /new repository/i }));
    await user.click(screen.getByText("Cancel"));
    expect(screen.queryByTestId("create-modal")).toBeNull();
  });

  it("poziva fetchRepositories nakon kreiranja", async () => {
    const fetchRepositories = vi.fn();
    mockHook({ fetchRepositories });
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: /new repository/i }));
    await user.click(screen.getByText("Confirm create"));
    expect(fetchRepositories).toHaveBeenCalled();
  });

  it("otvara edit modal na edit ikonicu", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getAllByTitle("Edit")[0]);
    expect(screen.getByTestId("edit-modal")).toBeTruthy();
  });

  it("zatvara edit modal na Cancel", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getAllByTitle("Edit")[0]);
    await user.click(screen.getByText("Cancel"));
    expect(screen.queryByTestId("edit-modal")).toBeNull();
  });

  it("poziva fetchRepositories nakon edit-a", async () => {
    const fetchRepositories = vi.fn();
    mockHook({ fetchRepositories });
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getAllByTitle("Edit")[0]);
    await user.click(screen.getByText("Confirm save"));
    expect(fetchRepositories).toHaveBeenCalled();
  });

  it("otvara delete modal na delete ikonicu", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getAllByTitle("Delete")[0]);
    expect(screen.getByTestId("delete-modal")).toBeTruthy();
  });

  it("zatvara delete modal na Cancel", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getAllByTitle("Delete")[0]);
    await user.click(screen.getByText("Cancel"));
    expect(screen.queryByTestId("delete-modal")).toBeNull();
  });

  it("poziva fetchRepositories nakon brisanja", async () => {
    const fetchRepositories = vi.fn();
    mockHook({ fetchRepositories });
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getAllByTitle("Delete")[0]);
    await user.click(screen.getByText("Confirm delete"));
    expect(fetchRepositories).toHaveBeenCalled();
  });
});
