import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { RepositoriesTab } from "./RepositoriesTab";

const navigateMock = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => navigateMock,
}));

vi.mock("@/components/Button/Button", () => ({
  default: ({ children, onClick }: any) => (
    <button onClick={onClick}>{children}</button>
  ),
}));

vi.mock("@/components/Tag/Tag", () => ({
  TagComponent: ({ children }: any) => <span>{children}</span>,
}));

vi.mock(
  "@/components/Modals/AddTeamRepositoryModal/AddTeamRepositoryModal",
  () => ({
    default: ({ isOpen, onSave }: any) =>
      isOpen ? (
        <div data-testid="add-modal">
          Add Modal
          <button onClick={() => onSave("2", "READ")}>confirm-add</button>
        </div>
      ) : null,
  }),
);

vi.mock("@/components/Modals/DeleteConfirmModal/DeleteConfirmModal", () => ({
  default: ({ isOpen, onClose, onDelete, loading, error, description }: any) =>
    isOpen ? (
      <div data-testid="delete-modal">
        <button onClick={onDelete}>confirm-delete</button>
        <button onClick={onClose}>close-delete</button>
        <div>{description}</div>
        {loading && <span>loading...</span>}
        {error && <span>{error}</span>}
      </div>
    ) : null,
}));

const fetchReposMock = vi.fn();
const fetchOrgReposMock = vi.fn();
const addRepositoryMock = vi.fn();
const removeRepositoryMock = vi.fn();

const baseRepo = {
  repositoryId: "1",
  repositoryName: "repo-1",
  fullName: "org/repo-1",
  permission: "WRITE",
};

const useTeamRepositoriesMock = vi.fn(() => ({
  repositories: [baseRepo],
  total: 1,
  loading: false,
  error: null,
  fetchRepos: fetchReposMock,
  addRepository: addRepositoryMock,
  removeRepository: removeRepositoryMock,
}));

vi.mock(
  "@/services/organizations/useTeamRepositories/useTeamRepositories",
  () => ({
    useTeamRepositories: () => useTeamRepositoriesMock(),
  }),
);

vi.mock(
  "@/services/organizations/useOrganizationRepositories/useOrganizationRepositories",
  () => ({
    useOrganizationRepositories: () => ({
      repositories: [
        baseRepo,
        {
          repositoryId: "2",
          repositoryName: "repo-2",
        },
      ],
      fetchRepos: fetchOrgReposMock,
    }),
  }),
);

describe("RepositoriesTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls fetch on mount", () => {
    render(<RepositoriesTab orgName="org" teamName="team" />);

    expect(fetchReposMock).toHaveBeenCalledTimes(1);
    expect(fetchOrgReposMock).toHaveBeenCalledWith("");
  });

  it("renders repository list", () => {
    render(<RepositoriesTab orgName="org" teamName="team" />);

    expect(screen.getByText("repo-1")).toBeInTheDocument();
    expect(screen.getByText("org/repo-1")).toBeInTheDocument();
    expect(screen.getByText("1 repositories")).toBeInTheDocument();
  });

  it("navigates on repo click", () => {
    render(<RepositoriesTab orgName="org" teamName="team" />);

    fireEvent.click(screen.getByText("repo-1"));

    expect(navigateMock).toHaveBeenCalledWith("/repositories/1");
  });

  it("opens add modal", () => {
    render(<RepositoriesTab orgName="org" teamName="team" />);

    fireEvent.click(screen.getByText(/add repository/i));

    expect(screen.getByTestId("add-modal")).toBeInTheDocument();
  });

  it("opens delete modal", () => {
    render(<RepositoriesTab orgName="org" teamName="team" />);

    fireEvent.click(screen.getByTitle("Remove from team"));

    expect(screen.getByTestId("delete-modal")).toBeInTheDocument();
  });

  it("handles successful delete", async () => {
    removeRepositoryMock.mockResolvedValueOnce(undefined);

    render(<RepositoriesTab orgName="org" teamName="team" />);

    fireEvent.click(screen.getByTitle("Remove from team"));
    fireEvent.click(screen.getByText("confirm-delete"));

    await waitFor(() => {
      expect(removeRepositoryMock).toHaveBeenCalledWith("1");
    });
  });

  it("handles delete error", async () => {
    removeRepositoryMock.mockRejectedValueOnce(new Error("fail"));

    render(<RepositoriesTab orgName="org" teamName="team" />);

    fireEvent.click(screen.getByTitle("Remove from team"));
    fireEvent.click(screen.getByText("confirm-delete"));

    await waitFor(() => {
      expect(
        screen.getByText("Failed to remove repository."),
      ).toBeInTheDocument();
    });
  });

  it("closes delete modal without deleting when close is clicked", () => {
    render(<RepositoriesTab orgName="org" teamName="team" />);

    fireEvent.click(screen.getByTitle("Remove from team"));
    fireEvent.click(screen.getByText("close-delete"));

    expect(screen.queryByTestId("delete-modal")).not.toBeInTheDocument();
    expect(removeRepositoryMock).not.toHaveBeenCalled();
  });

  it("shows the repository name in the delete confirmation description", () => {
    render(<RepositoriesTab orgName="org" teamName="team" />);

    fireEvent.click(screen.getByTitle("Remove from team"));

    expect(screen.getByText(/will revoke this team's access/i)).toBeInTheDocument();
    expect(screen.getByTestId("delete-modal")).toHaveTextContent("repo-1");
  });

  it("calls addRepository with the selected repo and permission when add modal is confirmed", () => {
    render(<RepositoriesTab orgName="org" teamName="team" />);

    fireEvent.click(screen.getByText(/add repository/i));
    fireEvent.click(screen.getByText("confirm-add"));

    expect(addRepositoryMock).toHaveBeenCalledWith({
      repositoryId: "2",
      permission: "READ",
    });
  });

  it("shows the empty state when there are no repositories", () => {
    useTeamRepositoriesMock.mockReturnValue({
      repositories: [],
      total: 0,
      loading: false,
      error: null,
      fetchRepos: fetchReposMock,
      addRepository: addRepositoryMock,
      removeRepository: removeRepositoryMock,
    });

    render(<RepositoriesTab orgName="org" teamName="team" />);

    expect(
      screen.getByText("No repositories added yet."),
    ).toBeInTheDocument();
  });

  it("shows a loading state and hides the repository list", () => {
    useTeamRepositoriesMock.mockReturnValue({
      repositories: [],
      total: 0,
      loading: true,
      error: null,
      fetchRepos: fetchReposMock,
      addRepository: addRepositoryMock,
      removeRepository: removeRepositoryMock,
    });

    render(<RepositoriesTab orgName="org" teamName="team" />);

    expect(screen.getByText("Loading repositories...")).toBeInTheDocument();
    expect(screen.queryByText("repo-1")).not.toBeInTheDocument();
  });

  it("shows an error message and hides the repository list", () => {
    useTeamRepositoriesMock.mockReturnValue({
      repositories: [],
      total: 0,
      loading: false,
      error: "Failed to load repositories.",
      fetchRepos: fetchReposMock,
      addRepository: addRepositoryMock,
      removeRepository: removeRepositoryMock,
    });

    render(<RepositoriesTab orgName="org" teamName="team" />);

    expect(
      screen.getByText("Failed to load repositories."),
    ).toBeInTheDocument();
    expect(screen.queryByText("repo-1")).not.toBeInTheDocument();
  });
});
