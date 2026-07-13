import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import MembersTab from "./MembersTab";
import { removeOrganizationMember } from "@/services/organizations/organizations.api";
import { useOrganizationInvites } from "@/services/organizations/useOrganizationInvites/useOrganizationInvites";
import { useOrganizationMembers } from "@/services/organizations/useOrganizationMembers/useOrganizationMembers";

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/services/organizations/organizations.api", () => ({
  removeOrganizationMember: vi.fn(),
}));

const mockFetchMembers = vi.fn();
const mockInviteMember = vi.fn();
const mockFetchInvites = vi.fn();
const mockCancelInvite = vi.fn();

vi.mock(
  "@/services/organizations/useOrganizationMembers/useOrganizationMembers",
  () => ({
    useOrganizationMembers: vi.fn(),
  }),
);

vi.mock(
  "@/services/organizations/useOrganizationInvites/useOrganizationInvites",
  () => ({
    useOrganizationInvites: vi.fn(),
  }),
);

// ── Helpers ──────────────────────────────────────────────────────────────────

const mockMember = {
  userId: "u1",
  username: "alice",
  email: "alice@example.com",
  role: "member",
  addedAt: "2024-01-15T00:00:00Z",
};

const mockAdminMember = {
  userId: "u2",
  username: "bob",
  email: "bob@example.com",
  role: "admin",
  addedAt: "2024-02-10T00:00:00Z",
};

const mockInvite = {
  id: "inv1",
  email: "charlie@example.com",
  role: "member",
  status: "pending",
  invitedByUsername: "alice",
  createdAt: "2024-03-01T00:00:00Z",
  expiresAt: "2024-04-01T00:00:00Z",
};

function makeOrg(role: "owner" | "admin" | "member") {
  return {
    name: "my-org",
    currentUserRole: role,
  } as any;
}

function setupHooks({
  members = [mockMember],
  total = 1,
  loading = false,
  error = null,
  invites = [mockInvite],
  invitesLoading = false,
  invitesError = null,
} = {}) {
  (useOrganizationMembers as any).mockReturnValue({
    members,
    total,
    loading,
    error,
    fetchMembers: mockFetchMembers,
    inviteMember: mockInviteMember,
  });

  (useOrganizationInvites as any).mockReturnValue({
    invites,
    loading: invitesLoading,
    error: invitesError,
    fetchInvites: mockFetchInvites,
    cancelInvite: mockCancelInvite,
  });
}

function renderTab(orgRole: "owner" | "admin" | "member" = "owner") {
  return render(
    <MembersTab orgName="my-org" organization={makeOrg(orgRole)} />,
  );
}

describe("MembersTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("data fetching on mount", () => {
    it("fetches members on mount", () => {
      setupHooks();
      renderTab("owner");
      expect(mockFetchMembers).toHaveBeenCalledWith("");
    });

    it("fetches invites on mount when user is owner", () => {
      setupHooks();
      renderTab("owner");
      expect(mockFetchInvites).toHaveBeenCalled();
    });

    it("does not fetch invites on mount when user is admin", () => {
      setupHooks();
      renderTab("admin");
      expect(mockFetchInvites).not.toHaveBeenCalled();
    });

    it("does not fetch invites on mount when user is member", () => {
      setupHooks();
      renderTab("member");
      expect(mockFetchInvites).not.toHaveBeenCalled();
    });
  });

  describe("members tab", () => {
    it("shows member count", () => {
      setupHooks({ members: [mockMember], total: 5 });
      renderTab();
      expect(screen.getByText("1 of 5 members")).toBeInTheDocument();
    });

    it("shows loading state", () => {
      setupHooks({ loading: true, members: [] });
      renderTab();
      expect(screen.getByText("Loading members...")).toBeInTheDocument();
    });

    it("shows error state", () => {
      setupHooks({ error: "Network error", members: [], loading: false });
      renderTab();
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });

    it("shows empty state when no members", () => {
      setupHooks({ members: [], total: 0 });
      renderTab();
      expect(screen.getByText("No members found.")).toBeInTheDocument();
    });

    it("renders role tag for member", () => {
      setupHooks({ members: [mockMember] });
      renderTab();
      expect(screen.getByText("member")).toBeInTheDocument();
    });

    it("renders joined date", () => {
      setupHooks({ members: [mockMember] });
      renderTab();
      expect(screen.getByText("Jan 15, 2024")).toBeInTheDocument();
    });
  });

  describe("tab switching", () => {
    it("shows Members and Invites tabs for owner", () => {
      setupHooks();
      renderTab("owner");
      expect(
        screen.getByRole("button", { name: /Members/ }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Invites/ }),
      ).toBeInTheDocument();
    });

    it("does not show tab switcher for admin", () => {
      setupHooks();
      renderTab("admin");
      expect(
        screen.queryByRole("button", { name: /Invites/ }),
      ).not.toBeInTheDocument();
    });

    it("switches to invites tab on click", () => {
      setupHooks();
      renderTab("owner");
      fireEvent.click(screen.getByRole("button", { name: /Invites/ }));
      expect(screen.getByText("1 pending invite")).toBeInTheDocument();
    });

    it("hides badge when no pending invites", () => {
      setupHooks({ invites: [] });
      renderTab("owner");
      const badges = screen.queryAllByText("0");
      expect(badges).toHaveLength(0);
    });
  });

  describe("invites tab", () => {
    beforeEach(() => {
      setupHooks({ invites: [mockInvite] });
    });

    it("renders pending invite email", () => {
      renderTab("owner");
      fireEvent.click(screen.getByRole("button", { name: /Invites/ }));
      expect(screen.getByText("charlie@example.com")).toBeInTheDocument();
    });

    it("renders invited-by username", () => {
      renderTab("owner");
      fireEvent.click(screen.getByRole("button", { name: /Invites/ }));
      expect(screen.getByText("@alice")).toBeInTheDocument();
    });

    it("shows empty invites state", () => {
      setupHooks({ invites: [] });
      renderTab("owner");
      fireEvent.click(screen.getByRole("button", { name: /Invites/ }));
      expect(screen.getByText("No pending invites")).toBeInTheDocument();
    });

    it("shows invites loading state", () => {
      setupHooks({ invitesLoading: true, invites: [] });
      renderTab("owner");
      fireEvent.click(screen.getByRole("button", { name: /Invites/ }));
      expect(screen.getByText("Loading invites...")).toBeInTheDocument();
    });

    it("shows invites error state", () => {
      setupHooks({ invitesError: "Failed to load", invites: [] });
      renderTab("owner");
      fireEvent.click(screen.getByRole("button", { name: /Invites/ }));
      expect(screen.getByText("Failed to load")).toBeInTheDocument();
    });

    it("filters out non-pending invites", () => {
      setupHooks({
        invites: [
          mockInvite,
          {
            ...mockInvite,
            id: "inv2",
            email: "done@example.com",
            status: "accepted",
          },
        ],
      });
      renderTab("owner");
      fireEvent.click(screen.getByRole("button", { name: /Invites/ }));
      expect(screen.queryByText("done@example.com")).not.toBeInTheDocument();
      expect(screen.getByText("charlie@example.com")).toBeInTheDocument();
    });
  });

  describe("remove member", () => {
    it("shows trash icon for privileged user", () => {
      setupHooks({ members: [mockMember] });
      renderTab("owner");
      expect(document.querySelector("button svg.lucide-trash-2")).toBeTruthy();
    });

    it("does not show trash icon for plain member", () => {
      setupHooks({ members: [mockMember] });
      renderTab("member");
      expect(document.querySelector("button svg.lucide-trash-2")).toBeFalsy();
    });
  });

  describe("cancel invite", () => {
    it("opens cancel confirm modal on X click", async () => {
      setupHooks({ invites: [mockInvite] });
      renderTab("owner");
      fireEvent.click(screen.getByRole("button", { name: /Invites/ }));

      const cancelBtn = screen.getByTitle("Cancel invite");
      fireEvent.click(cancelBtn);

      await waitFor(() =>
        expect(screen.getByText("Cancel Invite")).toBeInTheDocument(),
      );
    });
  });

  describe("invite member modal", () => {
    it("shows Invite member button for privileged users", () => {
      setupHooks();
      renderTab("owner");
      expect(
        screen.getByRole("button", { name: /Invite member/i }),
      ).toBeInTheDocument();
    });

    it("shows Invite member button for admin", () => {
      setupHooks();
      renderTab("admin");
      expect(
        screen.getByRole("button", { name: /Invite member/i }),
      ).toBeInTheDocument();
    });

    it("hides Invite member button for plain member", () => {
      setupHooks();
      renderTab("member");
      expect(
        screen.queryByRole("button", { name: /Invite member/i }),
      ).not.toBeInTheDocument();
    });

    it("opens invite modal on button click", () => {
      setupHooks();
      renderTab("owner");
      fireEvent.click(screen.getByRole("button", { name: /Invite member/i }));
      expect(
        screen.getByRole("dialog") ??
          document.querySelector("[data-testid='invite-modal']"),
      ).toBeTruthy();
    });
  });

  describe("sorting", () => {
    it("sorts members by username ascending by default", () => {
      setupHooks({ members: [mockAdminMember, mockMember], total: 2 });
      renderTab("owner");
      const rows = screen.getAllByText(/@(alice|bob)/i);
      expect(rows[0].textContent).toMatch(/alice/i);
    });
  });
});
