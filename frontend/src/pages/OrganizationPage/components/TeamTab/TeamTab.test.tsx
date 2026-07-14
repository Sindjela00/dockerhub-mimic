import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { TeamsTab } from "./TeamTab";
import { deleteTeam } from "@/services/organizations/organizations.api";
import { useOrganizationTeams } from "@/services/organizations/useOrganizationsTeams/useOrganizationsTeams";

vi.mock("@/services/organizations/organizations.api", () => ({
  deleteTeam: vi.fn(),
}));

vi.mock(
  "@/services/organizations/useOrganizationsTeams/useOrganizationsTeams",
  () => ({ useOrganizationTeams: vi.fn() }),
);

vi.mock("@/components/Modals/CreateTeamModal/CreateTeamModal", () => ({
  default: ({ isOpen, onClose, onSave }: any) =>
    isOpen ? (
      <div role="dialog" aria-label="create-team">
        <button onClick={onClose}>Close</button>
        <button onClick={() => onSave({ name: "new-team" })}>Create</button>
      </div>
    ) : null,
}));

vi.mock("@/components/Cards/TeamComplexCard/TeamRow", () => ({
  TeamRow: ({ team, onDelete }: any) => (
    <div data-testid={`team-row-${team.id}`}>
      <span>{team.name}</span>
      {onDelete && (
        <button onClick={() => onDelete(team.name)}>Delete {team.name}</button>
      )}
    </div>
  ),
}));

vi.mock("@/components/Button/Button", () => ({
  default: ({ children, onClick, className }: any) => (
    <button onClick={onClick} className={className}>
      {children}
    </button>
  ),
}));

const mockFetchTeams = vi.fn();
const mockCreateTeam = vi.fn();

const mockTeam = { id: "t1", name: "alpha-team" };
const mockTeam2 = { id: "t2", name: "beta-team" };

function makeOrg(role: "owner" | "admin" | "member") {
  return { currentUserRole: role } as any;
}

function setupHooks({
  teams = [mockTeam],
  total = 1,
  loading = false,
  error = null as string | null,
} = {}) {
  (useOrganizationTeams as any).mockReturnValue({
    teams,
    total,
    loading,
    error,
    fetchTeams: mockFetchTeams,
    createTeam: mockCreateTeam,
  });
}

function renderTab(role: "owner" | "admin" | "member" = "owner") {
  return render(<TeamsTab orgName="my-org" organization={makeOrg(role)} />);
}

describe("TeamsTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("loading state", () => {
    it("shows loading message while fetching", () => {
      setupHooks({ loading: true, teams: [] });
      renderTab();
      expect(screen.getByText("Loading teams...")).toBeInTheDocument();
    });

    it("hides team list while loading", () => {
      setupHooks({ loading: true, teams: [mockTeam] });
      renderTab();
      expect(screen.queryByTestId("team-row-t1")).not.toBeInTheDocument();
    });
  });

  describe("error state", () => {
    it("shows error message when fetch fails", () => {
      setupHooks({ error: "Failed to load teams", teams: [], loading: false });
      renderTab();
      expect(screen.getByText("Failed to load teams")).toBeInTheDocument();
    });

    it("does not show error when loading", () => {
      setupHooks({ error: "Some error", teams: [], loading: true });
      renderTab();
      expect(screen.queryByText("Some error")).not.toBeInTheDocument();
    });

    it("hides team list when error is present", () => {
      setupHooks({ error: "Oops", teams: [mockTeam], loading: false });
      renderTab();
      expect(screen.queryByTestId("team-row-t1")).not.toBeInTheDocument();
    });
  });

  describe("empty state", () => {
    it("shows no teams message when list is empty", () => {
      setupHooks({ teams: [], total: 0 });
      renderTab();
      expect(screen.getByText("No teams found.")).toBeInTheDocument();
    });
  });
});
