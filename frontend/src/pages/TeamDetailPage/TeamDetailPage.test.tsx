import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import TeamDetailPage from "./TeamDetailPage";

const useParamsMock = vi.fn(() => ({
  orgName: "org",
  teamName: "team",
}));

vi.mock("react-router-dom", () => ({
  useParams: () => useParamsMock(),
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

const defaultTeam = {
  name: "Team A",
  organizationName: "Org A",
  description: "Test team",
  createdAt: "2024-01-01",
  updatedAt: "2024-01-02",
  memberCount: 3,
  repositoryCount: 5,
};

const useTeamMock = vi.fn(() => ({
  team: defaultTeam,
  loading: false,
  error: null,
  updateTeam: updateTeamMock,
  deleteTeam: deleteTeamMock,
  deleteLoading: false,
  deleteError: null,
}));

vi.mock("@/services/organizations/useTeam/UseTeam", () => ({
  useTeam: () => useTeamMock(),
}));

describe("TeamDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useParamsMock.mockReturnValue({ orgName: "org", teamName: "team" });
    useTeamMock.mockReturnValue({
      team: defaultTeam,
      loading: false,
      error: null,
      updateTeam: updateTeamMock,
      deleteTeam: deleteTeamMock,
      deleteLoading: false,
      deleteError: null,
    });
  });

  it("shows a message when orgName or teamName is missing", () => {
    useParamsMock.mockReturnValue({ orgName: undefined, teamName: undefined });

    render(<TeamDetailPage />);

    expect(
      screen.getByText("Missing organization or team name"),
    ).toBeInTheDocument();
  });

  it("shows a loading state while the team is being fetched", () => {
    useTeamMock.mockReturnValue({
      team: null,
      loading: true,
      error: null,
      updateTeam: updateTeamMock,
      deleteTeam: deleteTeamMock,
      deleteLoading: false,
      deleteError: null,
    });

    render(<TeamDetailPage />);

    expect(screen.getByText("Loading team...")).toBeInTheDocument();
  });

  it("renders the error page when loading the team fails", () => {
    useTeamMock.mockReturnValue({
      team: null,
      loading: false,
      error: "Failed to load team",
      updateTeam: updateTeamMock,
      deleteTeam: deleteTeamMock,
      deleteLoading: false,
      deleteError: null,
    });

    render(<TeamDetailPage />);

    expect(screen.getByTestId("error-page")).toBeInTheDocument();
  });

  it("renders nothing when there is no team and no error", () => {
    useTeamMock.mockReturnValue({
      team: null,
      loading: false,
      error: null,
      updateTeam: updateTeamMock,
      deleteTeam: deleteTeamMock,
      deleteLoading: false,
      deleteError: null,
    });

    const { container } = render(<TeamDetailPage />);

    expect(container).toBeEmptyDOMElement();
  });

  it("falls back to 0 badges and '-' updated date when counts/date are missing", () => {
    useTeamMock.mockReturnValue({
      team: {
        ...defaultTeam,
        memberCount: undefined,
        repositoryCount: undefined,
        updatedAt: undefined,
        description: "",
      },
      loading: false,
      error: null,
      updateTeam: updateTeamMock,
      deleteTeam: deleteTeamMock,
      deleteLoading: false,
      deleteError: null,
    });

    render(<TeamDetailPage />);

    expect(screen.getByText(/Members: 0/i)).toBeInTheDocument();
    expect(screen.getByText(/Repositories: 0/i)).toBeInTheDocument();
    expect(screen.getByText(/Updated: -/i)).toBeInTheDocument();
    expect(screen.getByText("No description provided")).toBeInTheDocument();
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
