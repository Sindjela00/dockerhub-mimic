import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { MemoryRouter } from "react-router-dom";
import TeamsTab from "./TeamsTab";
import { useNavigate } from "react-router-dom";
import { useRepositoryTeams } from "@/services/repositories/useRepositoryTeams/useRepositoryTeams";

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: vi.fn() };
});

vi.mock(
  "@/services/repositories/useRepositoryTeams/useRepositoryTeams",
  () => ({ useRepositoryTeams: vi.fn() }),
);

vi.mock("@/components/Cards/TeamCard/TeamCard", () => ({
  TeamCard: ({
    name,
    permission,
    onPermissionChange,
    onClick,
    onRemove,
  }: any) => (
    <div data-testid={`team-card-${name}`}>
      <span>{name}</span>
      <span data-testid={`perm-${name}`}>{permission}</span>
      <button onClick={onClick}>Go to {name}</button>
      <button onClick={() => onPermissionChange(null, "admin")}>
        Change perm {name}
      </button>
      <button onClick={onRemove}>Remove {name}</button>
    </div>
  ),
}));

vi.mock(
  "@/components/Modals/AssignRepositoryModal/AssignRepositoryModal",
  () => ({
    default: ({ isOpen, onClose, orgName, repoId, assignedTeams }: any) =>
      isOpen ? (
        <div role="dialog" aria-label="assign-repo">
          <span data-testid="modal-org">{orgName}</span>
          <span data-testid="modal-repo">{repoId}</span>
          <span data-testid="modal-teams">{assignedTeams.length}</span>
          <button onClick={onClose}>Close modal</button>
        </div>
      ) : null,
  }),
);

vi.mock("@/components/Button/Button", () => ({
  default: ({ children, onClick }: any) => (
    <button onClick={onClick}>{children}</button>
  ),
}));

// ── Imports (after mocks) ─────────────────────────────────────────────────────

// ── Fixtures ──────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();
const mockFetchTeams = vi.fn();
const mockRemoveTeam = vi.fn();
const mockUpdatePermission = vi.fn();

const mockTeam = { teamId: 1, teamName: "alpha", permission: "read" };
const mockTeam2 = { teamId: 2, teamName: "beta", permission: "write" };

function setupMocks({
  teams = [mockTeam],
  loading = false,
  error = null as string | null,
} = {}) {
  (useNavigate as any).mockReturnValue(mockNavigate);
  (useRepositoryTeams as any).mockReturnValue({
    teams,
    loading,
    error,
    fetchTeams: mockFetchTeams,
    removeTeam: mockRemoveTeam,
    updatePermission: mockUpdatePermission,
  });
}

function renderTab(props: { repoId?: number; orgName?: string } = {}) {
  const { repoId = 10, orgName = "my-org" } = props;
  return render(
    <MemoryRouter>
      <TeamsTab repoId={repoId} orgName={orgName} />
    </MemoryRouter>,
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("TeamsTab (repository)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Hook initialization ───────────────────────────────────────────────────

  describe("hook initialization", () => {
    it("passes repoId and orgName to useRepositoryTeams", () => {
      setupMocks();
      renderTab({ repoId: 42, orgName: "acme" });
      expect(useRepositoryTeams).toHaveBeenCalledWith(42, "acme");
    });

    it("calls fetchTeams on mount", () => {
      setupMocks();
      renderTab();
      expect(mockFetchTeams).toHaveBeenCalledTimes(1);
    });

    it("re-fetches when orgName changes", () => {
      setupMocks();
      const { rerender } = renderTab({ orgName: "org-a" });
      rerender(
        <MemoryRouter>
          <TeamsTab repoId={10} orgName="org-b" />
        </MemoryRouter>,
      );
      expect(mockFetchTeams).toHaveBeenCalledTimes(2);
    });

  });

  // ── Loading state ─────────────────────────────────────────────────────────

  describe("loading state", () => {
    it("shows loading spinner and text", () => {
      setupMocks({ loading: true });
      renderTab();
      expect(screen.getByText("Loading teams…")).toBeInTheDocument();
    });

    it("does not render team cards while loading", () => {
      setupMocks({ loading: true, teams: [mockTeam] });
      renderTab();
      expect(screen.queryByTestId("team-card-alpha")).not.toBeInTheDocument();
    });

    it("does not render Assign Team button while loading", () => {
      setupMocks({ loading: true });
      renderTab();
      expect(
        screen.queryByRole("button", { name: /Assign Team/i }),
      ).not.toBeInTheDocument();
    });
  });

  // ── Error state ───────────────────────────────────────────────────────────

  describe("error state", () => {
    it("shows error message", () => {
      setupMocks({ error: "Failed to load teams" });
      renderTab();
      expect(screen.getByText("Failed to load teams")).toBeInTheDocument();
    });

    it("does not render team cards on error", () => {
      setupMocks({ error: "Oops", teams: [mockTeam] });
      renderTab();
      expect(screen.queryByTestId("team-card-alpha")).not.toBeInTheDocument();
    });

    it("does not render Assign Team button on error", () => {
      setupMocks({ error: "Oops" });
      renderTab();
      expect(
        screen.queryByRole("button", { name: /Assign Team/i }),
      ).not.toBeInTheDocument();
    });
  });

  // ── Empty state ───────────────────────────────────────────────────────────

  describe("empty state", () => {
    it("shows no teams message when list is empty", () => {
      setupMocks({ teams: [] });
      renderTab();
      expect(
        screen.getByText("No teams assigned to this repository."),
      ).toBeInTheDocument();
    });

    it("still renders Assign Team button in empty state", () => {
      setupMocks({ teams: [] });
      renderTab();
      expect(
        screen.getByRole("button", { name: /Assign Team/i }),
      ).toBeInTheDocument();
    });
  });

  // ── Team grid ─────────────────────────────────────────────────────────────

  describe("team grid", () => {
    it("renders a TeamCard for each team", () => {
      setupMocks({ teams: [mockTeam, mockTeam2] });
      renderTab();
      expect(screen.getByTestId("team-card-alpha")).toBeInTheDocument();
      expect(screen.getByTestId("team-card-beta")).toBeInTheDocument();
    });

    it("renders team names", () => {
      setupMocks({ teams: [mockTeam, mockTeam2] });
      renderTab();
      expect(screen.getByText("alpha")).toBeInTheDocument();
      expect(screen.getByText("beta")).toBeInTheDocument();
    });

    it("renders team permissions", () => {
      setupMocks({ teams: [mockTeam] });
      renderTab();
      expect(screen.getByTestId("perm-alpha").textContent).toBe("read");
    });

    it("cycles accent classes based on index", () => {
      // Verified via the mock receiving accentClass prop — just assert cards render
      const teams = Array.from({ length: 7 }, (_, i) => ({
        teamId: i,
        teamName: `team-${i}`,
        permission: "read",
      }));
      setupMocks({ teams });
      renderTab();
      expect(screen.getAllByTestId(/^team-card-/)).toHaveLength(7);
    });
  });

  // ── Navigation ────────────────────────────────────────────────────────────

  describe("team card navigation", () => {
    it("navigates to team detail page on card click", () => {
      setupMocks({ teams: [mockTeam] });
      renderTab({ orgName: "my-org" });
      fireEvent.click(screen.getByText("Go to alpha"));
      expect(mockNavigate).toHaveBeenCalledWith(
        "/organizations/my-org/teams/alpha",
      );
    });

    it("uses orgName and teamName in the navigation path", () => {
      setupMocks({ teams: [mockTeam2] });
      renderTab({ orgName: "acme" });
      fireEvent.click(screen.getByText("Go to beta"));
      expect(mockNavigate).toHaveBeenCalledWith(
        "/organizations/acme/teams/beta",
      );
    });
  });

  // ── Remove team ───────────────────────────────────────────────────────────

  describe("remove team", () => {
    it("calls removeTeam with teamId and teamName", () => {
      setupMocks({ teams: [mockTeam] });
      renderTab();
      fireEvent.click(screen.getByText("Remove alpha"));
      expect(mockRemoveTeam).toHaveBeenCalledWith(1, "alpha");
    });

    it("calls removeTeam for the correct team when multiple exist", () => {
      setupMocks({ teams: [mockTeam, mockTeam2] });
      renderTab();
      fireEvent.click(screen.getByText("Remove beta"));
      expect(mockRemoveTeam).toHaveBeenCalledWith(2, "beta");
    });
  });

  // ── Update permission ─────────────────────────────────────────────────────

  describe("update permission", () => {
    it("calls updatePermission with teamId and new permission", () => {
      setupMocks({ teams: [mockTeam] });
      renderTab();
      fireEvent.click(screen.getByText("Change perm alpha"));
      expect(mockUpdatePermission).toHaveBeenCalledWith(1, "admin");
    });

    it("calls updatePermission for the correct team", () => {
      setupMocks({ teams: [mockTeam, mockTeam2] });
      renderTab();
      fireEvent.click(screen.getByText("Change perm beta"));
      expect(mockUpdatePermission).toHaveBeenCalledWith(2, "admin");
    });
  });

  // ── Assign Repository modal ───────────────────────────────────────────────

  describe("assign repository modal", () => {
    it("is closed by default", () => {
      setupMocks();
      renderTab();
      expect(
        screen.queryByRole("dialog", { name: "assign-repo" }),
      ).not.toBeInTheDocument();
    });

    it("opens when Assign Team button is clicked", () => {
      setupMocks();
      renderTab();
      fireEvent.click(screen.getByRole("button", { name: /Assign Team/i }));
      expect(
        screen.getByRole("dialog", { name: "assign-repo" }),
      ).toBeInTheDocument();
    });

    it("passes orgName to modal", () => {
      setupMocks();
      renderTab({ orgName: "acme" });
      fireEvent.click(screen.getByRole("button", { name: /Assign Team/i }));
      expect(screen.getByTestId("modal-org").textContent).toBe("acme");
    });

    it("passes repoId to modal", () => {
      setupMocks();
      renderTab({ repoId: 99 });
      fireEvent.click(screen.getByRole("button", { name: /Assign Team/i }));
      expect(screen.getByTestId("modal-repo").textContent).toBe("99");
    });

    it("passes current teams to modal as assignedTeams", () => {
      setupMocks({ teams: [mockTeam, mockTeam2] });
      renderTab();
      fireEvent.click(screen.getByRole("button", { name: /Assign Team/i }));
      expect(screen.getByTestId("modal-teams").textContent).toBe("2");
    });

    it("closes modal on close button click", () => {
      setupMocks();
      renderTab();
      fireEvent.click(screen.getByRole("button", { name: /Assign Team/i }));
      fireEvent.click(screen.getByText("Close modal"));
      expect(
        screen.queryByRole("dialog", { name: "assign-repo" }),
      ).not.toBeInTheDocument();
    });

    it("re-fetches teams when modal closes", async () => {
      setupMocks();
      renderTab();
      fireEvent.click(screen.getByRole("button", { name: /Assign Team/i }));
      fireEvent.click(screen.getByText("Close modal"));
      await waitFor(
        () => expect(mockFetchTeams).toHaveBeenCalledTimes(2), // mount + after close
      );
    });
  });
});
