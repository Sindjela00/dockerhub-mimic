import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { TeamRow } from "./TeamRow";

const navigateMock = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigateMock,
}));

vi.mock("@/context/AppContext", () => ({
  useAuth: () => ({
    token: "token",
  }),
}));

vi.mock("@/components/Modals/DeleteConfirmModal/DeleteConfirmModal", () => ({
  default: ({ isOpen, onDelete, error, loading }: any) =>
    isOpen ? (
      <div data-testid="delete-modal">
        <button onClick={onDelete}>confirm-delete</button>
        {loading && <span>loading...</span>}
        {error && <span>{error}</span>}
      </div>
    ) : null,
}));

const fetchReposMock = vi.fn();

vi.mock("@/services/organizations/organizations.api", () => ({
  fetchTeamRepositories: (...args: any[]) => fetchReposMock(...args),
}));

const team = {
  name: "team-a",
  description: "Test team",
  memberCount: 2,
  repositoryCount: 1,
};

describe("TeamRow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders team info", () => {
    render(<TeamRow team={team as any} orgName="org" />);

    expect(screen.getByText("team-a")).toBeInTheDocument();
    expect(screen.getByText("Test team")).toBeInTheDocument();
    expect(screen.getByText("2 members")).toBeInTheDocument();
    expect(screen.getByText("1 repo")).toBeInTheDocument();
  });

  it("navigates to team detail on click", () => {
    render(<TeamRow team={team as any} orgName="org" />);

    fireEvent.click(screen.getByText("team-a"));

    expect(navigateMock).toHaveBeenCalledWith(
      "/organizations/org/teams/team-a",
    );
  });

  it("toggles expand and fetches repositories", async () => {
    fetchReposMock.mockResolvedValueOnce({
      repositories: [{ repositoryId: 1, fullName: "org/repo-1" }],
    });

    render(<TeamRow team={team as any} orgName="org" />);

    fireEvent.click(screen.getByRole("button"));

    expect(fetchReposMock).toHaveBeenCalledWith("org", "team-a", "token");

    await waitFor(() => {
      expect(screen.getByText("org/repo-1")).toBeInTheDocument();
    });
  });

  it("shows loading state when expanding", async () => {
    fetchReposMock.mockImplementation(() => new Promise(() => {}));

    render(<TeamRow team={team as any} orgName="org" />);

    fireEvent.click(screen.getByRole("button"));

    expect(screen.getByText(/loading repositories/i)).toBeInTheDocument();
  });

  it("shows empty state when no repos", async () => {
    fetchReposMock.mockResolvedValueOnce({ repositories: [] });

    render(<TeamRow team={team as any} orgName="org" />);

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(screen.getByText(/no repositories assigned/i)).toBeInTheDocument();
    });
  });

  it("navigates to repository on click", async () => {
    fetchReposMock.mockResolvedValueOnce({
      repositories: [{ repositoryId: 1, fullName: "org/repo-1" }],
    });

    render(<TeamRow team={team as any} orgName="org" />);

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      fireEvent.click(screen.getByText("org/repo-1"));
    });

    expect(navigateMock).toHaveBeenCalledWith("/repositories/1");
  });

  it("calls onDelete when confirmed", async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined);

    render(<TeamRow team={team as any} orgName="org" onDelete={onDelete} />);

    fireEvent.click(screen.getAllByRole("button")[1]);
    fireEvent.click(screen.getByText("confirm-delete"));

    await waitFor(() => {
      expect(onDelete).toHaveBeenCalledWith("team-a");
    });
  });

  it("shows delete error", async () => {
    const onDelete = vi.fn().mockRejectedValue(new Error());

    render(<TeamRow team={team as any} orgName="org" onDelete={onDelete} />);

    fireEvent.click(screen.getAllByRole("button")[1]);
    fireEvent.click(screen.getByText("confirm-delete"));

    await waitFor(() => {
      expect(screen.getByText(/failed to delete team/i)).toBeInTheDocument();
    });
  });
});
