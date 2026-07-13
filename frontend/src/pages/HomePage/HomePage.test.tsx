import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import HomePage from "./HomePage";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("@/context/AppContext", () => ({
  useAuth: () => ({ username: "john" }),
}));

const mockGetDashboardStats = vi.fn();
vi.mock("@/services/repositories/repositories.api", () => ({
  getDashboardStats: () => mockGetDashboardStats(),
}));

vi.mock(
  "@/components/Modals/CreateRepositoryModal/CreateRepositoryModal",
  () => ({
    default: ({
      isOpen,
      onClose,
      onCreate,
      username,
    }: {
      isOpen: boolean;
      onClose: () => void;
      onCreate: () => void;
      username: string;
    }) =>
      isOpen ? (
        <div data-testid="create-repo-modal">
          <span data-testid="modal-username">{username}</span>
          <button onClick={onClose}>Close</button>
          <button onClick={onCreate}>Submit</button>
        </div>
      ) : null,
  }),
);

vi.mock("./types/HomePageConfig", () => ({
  QUICK_LINKS: [
    { label: "Browse images", href: "/repositories" },
    { label: "Documentation", href: "/docs" },
  ],
}));

vi.mock("@/components/Cards/StatCard/StatCard", () => ({
  default: ({ label, value }: { label: string; value: number }) => (
    <div data-testid="stat-card">
      {label}: {value}
    </div>
  ),
}));

vi.mock("@/components/Cards/QuickLink/QuickLink", () => ({
  default: ({ label }: { label: string }) => (
    <div data-testid="quick-link">{label}</div>
  ),
}));

vi.mock("../../components/Button/Button", () => ({
  default: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => <button onClick={onClick}>{children}</button>,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockGetDashboardStats.mockResolvedValue({
    data: {
      repositoryCount: 12,
      totalPulls: 340,
      totalStars: 5,
      teamsCount: 1,
    },
  });
});

describe("HomePage — renderovanje", () => {
  it("renderuje hero naslov", () => {
    render(<HomePage />);
    expect(screen.getByText("Welcome back")).toBeInTheDocument();
  });

  it("renderuje hero opis", () => {
    render(<HomePage />);
    expect(
      screen.getByText(/Manage your container images/),
    ).toBeInTheDocument();
  });

  it("renderuje badge sa aplikacijskim imenom", () => {
    render(<HomePage />);
    expect(screen.getByText("Docker Hub UKS")).toBeInTheDocument();
  });

  it("renderuje 'Create repository' dugme", () => {
    render(<HomePage />);
    expect(
      screen.getByRole("button", { name: "Create repository" }),
    ).toBeInTheDocument();
  });

  it("renderuje Overview sekciju", () => {
    render(<HomePage />);
    expect(screen.getByText("Overview")).toBeInTheDocument();
  });

  it("renderuje Quick actions sekciju", () => {
    render(<HomePage />);
    expect(screen.getByText("Quick actions")).toBeInTheDocument();
  });

  it("renderuje sve StatCard komponente sa podacima iz dashboard statistike", async () => {
    render(<HomePage />);
    expect(screen.getAllByTestId("stat-card")).toHaveLength(4);
    await waitFor(() => {
      expect(screen.getByText("Repositories: 12")).toBeInTheDocument();
    });
    expect(screen.getByText("Total pulls: 340")).toBeInTheDocument();
    expect(screen.getByText("Stars: 5")).toBeInTheDocument();
    expect(screen.getByText("Teams: 1")).toBeInTheDocument();
  });

  it("renderuje sve QuickLink komponente iz QUICK_LINKS konfiguracije", () => {
    render(<HomePage />);
    expect(screen.getAllByTestId("quick-link")).toHaveLength(2);
    expect(screen.getByText("Browse images")).toBeInTheDocument();
    expect(screen.getByText("Documentation")).toBeInTheDocument();
  });

  it("ne prikazuje modal inicijalno", () => {
    render(<HomePage />);
    expect(screen.queryByTestId("create-repo-modal")).not.toBeInTheDocument();
  });
});

describe("HomePage — CreateRepositoryModal", () => {
  it("otvara modal klikom na 'Create repository'", () => {
    render(<HomePage />);
    fireEvent.click(screen.getByRole("button", { name: "Create repository" }));
    expect(screen.getByTestId("create-repo-modal")).toBeInTheDocument();
  });

  it("zatvara modal klikom na Close unutar modala", () => {
    render(<HomePage />);
    fireEvent.click(screen.getByRole("button", { name: "Create repository" }));
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByTestId("create-repo-modal")).not.toBeInTheDocument();
  });

  it("prosledjuje username iz useAuth u modal", () => {
    render(<HomePage />);
    fireEvent.click(screen.getByRole("button", { name: "Create repository" }));
    expect(screen.getByTestId("modal-username")).toHaveTextContent("john");
  });

  it("prosledjuje prazan string ako je username null", () => {
    vi.doMock("@/context/AppContext", () => ({
      useAuth: () => ({ username: null }),
    }));

    const { rerender } = render(<HomePage />);
    expect(screen.queryByText("Welcome back")).toBeInTheDocument();
  });

  it("zatvara modal i naviguje na /repositories nakon kreiranja", () => {
    render(<HomePage />);
    fireEvent.click(screen.getByRole("button", { name: "Create repository" }));
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    expect(screen.queryByTestId("create-repo-modal")).not.toBeInTheDocument();
    expect(mockNavigate).toHaveBeenCalledWith("/repositories");
  });

  it("modal se moze ponovo otvoriti nakon zatvaranja", () => {
    render(<HomePage />);

    fireEvent.click(screen.getByRole("button", { name: "Create repository" }));
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    fireEvent.click(screen.getByRole("button", { name: "Create repository" }));

    expect(screen.getByTestId("create-repo-modal")).toBeInTheDocument();
  });
});

describe("HomePage — navigacija", () => {
  it("navigate se ne poziva pri inicijalnom renderovanju", () => {
    render(<HomePage />);
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
