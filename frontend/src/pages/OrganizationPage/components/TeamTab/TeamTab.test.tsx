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
  return render(
    <TeamsTab
      orgName="my-org"
      token="test-token"
      organization={makeOrg(role)}
    />,
  );
}

describe("TeamsTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("data fetching on mount", () => {
    it("calls fetchTeams on mount", () => {
      setupHooks();
      renderTab();
      expect(mockFetchTeams).toHaveBeenCalledWith("");
    });

    it("calls fetchTeams only once even on re-render", () => {
      setupHooks();
      const { rerender } = renderTab();
      rerender(
        <TeamsTab
          orgName="my-org"
          token="test-token"
          organization={makeOrg("owner")}
        />,
      );
      expect(mockFetchTeams).toHaveBeenCalledTimes(1);
    });

    it("passes token and orgName to useOrganizationTeams", () => {
      setupHooks();
      renderTab();
      expect(useOrganizationTeams).toHaveBeenCalledWith("test-token", "my-org");
    });
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

  describe("team list", () => {
    it("renders a TeamRow for each team", () => {
      setupHooks({ teams: [mockTeam, mockTeam2], total: 2 });
      renderTab();
      expect(screen.getByTestId("team-row-t1")).toBeInTheDocument();
      expect(screen.getByTestId("team-row-t2")).toBeInTheDocument();
    });

    it("renders team names", () => {
      setupHooks({ teams: [mockTeam, mockTeam2] });
      renderTab();
      expect(screen.getByText("alpha-team")).toBeInTheDocument();
      expect(screen.getByText("beta-team")).toBeInTheDocument();
    });

    it("shows team count", () => {
      setupHooks({ teams: [mockTeam, mockTeam2], total: 10 });
      renderTab();
      expect(screen.getByText("2 of 10 teams")).toBeInTheDocument();
    });

    it("passes orgName to each TeamRow", () => {
      setupHooks({ teams: [mockTeam] });
      renderTab();
      expect(screen.getByTestId("team-row-t1")).toBeInTheDocument();
    });
  });

  describe("privileged role controls", () => {
    it("shows New team button for owner", () => {
      setupHooks();
      renderTab("owner");
      expect(
        screen.getByRole("button", { name: /New team/i }),
      ).toBeInTheDocument();
    });

    it("shows New team button for admin", () => {
      setupHooks();
      renderTab("admin");
      expect(
        screen.getByRole("button", { name: /New team/i }),
      ).toBeInTheDocument();
    });

    it("hides New team button for member", () => {
      setupHooks();
      renderTab("member");
      expect(
        screen.queryByRole("button", { name: /New team/i }),
      ).not.toBeInTheDocument();
    });

    it("passes onDelete handler to TeamRow for privileged user", () => {
      setupHooks({ teams: [mockTeam] });
      renderTab("owner");
      expect(
        screen.getByRole("button", { name: /Delete alpha-team/i }),
      ).toBeInTheDocument();
    });

    it("does not pass onDelete handler to TeamRow for member", () => {
      setupHooks({ teams: [mockTeam] });
      renderTab("member");
      expect(
        screen.queryByRole("button", { name: /Delete alpha-team/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe("delete team", () => {
    it("calls deleteTeam with correct args on delete", async () => {
      (deleteTeam as any).mockResolvedValue(undefined);
      setupHooks({ teams: [mockTeam] });
      renderTab("owner");

      fireEvent.click(
        screen.getByRole("button", { name: /Delete alpha-team/i }),
      );

      await waitFor(() => {
        expect(deleteTeam).toHaveBeenCalledWith(
          "my-org",
          "alpha-team",
          "test-token",
        );
      });
    });

    it("re-fetches teams after successful delete", async () => {
      (deleteTeam as any).mockResolvedValue(undefined);
      setupHooks({ teams: [mockTeam] });
      renderTab("owner");

      fireEvent.click(
        screen.getByRole("button", { name: /Delete alpha-team/i }),
      );

      await waitFor(() => {
        expect(mockFetchTeams).toHaveBeenCalledTimes(2);
      });
    });

    it("silently handles delete failure without crashing", async () => {
      (deleteTeam as any).mockRejectedValue(new Error("Server error"));
      setupHooks({ teams: [mockTeam] });
      renderTab("owner");

      fireEvent.click(
        screen.getByRole("button", { name: /Delete alpha-team/i }),
      );

      await waitFor(() => {
        expect(deleteTeam).toHaveBeenCalled();
        expect(mockFetchTeams).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("create team modal", () => {
    it("opens modal when New team button clicked", () => {
      setupHooks();
      renderTab("owner");
      fireEvent.click(screen.getByRole("button", { name: /New team/i }));
      expect(
        screen.getByRole("dialog", { name: "create-team" }),
      ).toBeInTheDocument();
    });

    it("closes modal on close button click", () => {
      setupHooks();
      renderTab("owner");
      fireEvent.click(screen.getByRole("button", { name: /New team/i }));
      fireEvent.click(screen.getByText("Close"));
      expect(
        screen.queryByRole("dialog", { name: "create-team" }),
      ).not.toBeInTheDocument();
    });

    it("passes createTeam as onSave to modal", async () => {
      setupHooks();
      renderTab("owner");
      fireEvent.click(screen.getByRole("button", { name: /New team/i }));
      fireEvent.click(screen.getByText("Create"));
      await waitFor(() => {
        expect(mockCreateTeam).toHaveBeenCalledWith({ name: "new-team" });
      });
    });

    it("modal is closed by default", () => {
      setupHooks();
      renderTab("owner");
      expect(
        screen.queryByRole("dialog", { name: "create-team" }),
      ).not.toBeInTheDocument();
    });
  });
});
