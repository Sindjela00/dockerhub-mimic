import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import TeamDetailPage from "./TeamDetailPage";

vi.mock("react-router-dom", () => ({
  useParams: () => ({
    orgName: "org",
    teamName: "team",
  }),
}));

vi.mock("@/context/AppContext", () => ({
  useAuth: () => ({
    token: "token",
  }),
}));

vi.mock("../ErrorPage/ErrorPage", () => ({
  default: () => <div data-testid="error-page">Error</div>,
}));

vi.mock("@/components/Tabs/Tabs", () => ({
  default: ({ tabs, active, onChange }: any) => (
    <div>
      {tabs.map((t: any) => (
        <button key={t.value} onClick={() => onChange(t.value)}>
          {t.label}
        </button>
      ))}
      <span data-testid="active-tab">{active}</span>
    </div>
  ),
}));

vi.mock("./components/MembersTab/MembersTab", () => ({
  MembersTab: () => <div data-testid="members-tab">Members Tab</div>,
}));

vi.mock("./components/RepositoriesTab/RepositoriesTab", () => ({
  RepositoriesTab: () => <div data-testid="repos-tab">Repositories Tab</div>,
}));

vi.mock("@/components/Button/Button", () => ({
  default: ({ children, onClick }: any) => (
    <button onClick={onClick}>{children}</button>
  ),
}));

vi.mock("@/components/Cards/StatCard/StatCard", () => ({
  default: ({ label, value }: any) => (
    <div>
      {label}: {value}
    </div>
  ),
}));

vi.mock("@/components/Tag/Tag", () => ({
  TagComponent: ({ children }: any) => <span>{children}</span>,
}));

vi.mock("@/components/Modals/EditTeamModal/EditTeamModal", () => ({
  default: ({ isOpen }: any) =>
    isOpen ? <div data-testid="edit-modal">Edit Modal</div> : null,
}));

vi.mock("@/components/Modals/DeleteConfirmModal/DeleteConfirmModal", () => ({
  default: ({ isOpen, onDelete }: any) =>
    isOpen ? (
      <div data-testid="delete-modal">
        <button onClick={onDelete}>confirm-delete</button>
      </div>
    ) : null,
}));

const updateTeamMock = vi.fn();
const deleteTeamMock = vi.fn();

vi.mock("@/services/organizations/useTeam/UseTeam", () => ({
  useTeam: () => ({
    team: {
      name: "Team A",
      organizationName: "Org A",
      description: "Test team",
      createdAt: "2024-01-01",
      updatedAt: "2024-01-02",
      memberCount: 3,
      repositoryCount: 5,
    },
    loading: false,
    error: null,
    updateTeam: updateTeamMock,
    deleteTeam: deleteTeamMock,
    deleteLoading: false,
    deleteError: null,
  }),
}));

describe("TeamDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders team info", () => {
    render(<TeamDetailPage />);

    expect(screen.getByText("Team A")).toBeInTheDocument();
    expect(screen.getByText("Org A / Team A")).toBeInTheDocument();
    expect(screen.getByText("Test team")).toBeInTheDocument();
  });

  it("renders stats", () => {
    render(<TeamDetailPage />);

    expect(screen.getByText(/Members: 3/i)).toBeInTheDocument();
    expect(screen.getByText(/Repositories: 5/i)).toBeInTheDocument();
  });

  it("renders members tab by default", () => {
    render(<TeamDetailPage />);

    expect(screen.getByTestId("members-tab")).toBeInTheDocument();
  });

  it("switches to repositories tab", () => {
    render(<TeamDetailPage />);

    fireEvent.click(screen.getByText("Repositories"));

    expect(screen.getByTestId("repos-tab")).toBeInTheDocument();
  });

  it("opens edit modal", () => {
    render(<TeamDetailPage />);

    fireEvent.click(screen.getByText(/edit team/i));

    expect(screen.getByTestId("edit-modal")).toBeInTheDocument();
  });

  it("opens delete modal and confirms delete", () => {
    render(<TeamDetailPage />);

    fireEvent.click(screen.getByText(/delete team/i));

    expect(screen.getByTestId("delete-modal")).toBeInTheDocument();

    fireEvent.click(screen.getByText("confirm-delete"));

    expect(deleteTeamMock).toHaveBeenCalled();
  });
});
