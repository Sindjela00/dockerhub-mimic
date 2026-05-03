import * as organizationsApi from "@/services/organizations/organizations.api";
import * as useOrganizationMembersModule from "@/services/organizations/useOrganizationMembers/useOrganizationMembers";

import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import MembersTab from "./MembersTab";

// --- Mocks ---

vi.mock(
  "@/services/organizations/useOrganizationMembers/useOrganizationMembers",
);

vi.mock("@/services/organizations/organizations.api", () => ({
  removeOrganizationMember: vi.fn(),
}));

vi.mock("@/components/Avatar/Avatar", () => ({
  Avatar: ({ initials }: { initials: string }) => (
    <span data-testid="avatar">{initials}</span>
  ),
}));

vi.mock("@/components/Button/Button", () => ({
  default: ({
    children,
    onClick,
    disabled,
  }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/Tag/Tag", () => ({
  TagComponent: ({ children }: { children: React.ReactNode }) => (
    <span data-testid="tag">{children}</span>
  ),
}));

vi.mock("@/components/Table/Table", () => ({
  default: ({
    data,
    columns,
    emptyText,
    rowKey,
  }: {
    data: object[];
    columns: { key: string; render: (item: object) => React.ReactNode }[];
    emptyText: string;
    rowKey: (item: object) => string;
  }) =>
    data.length === 0 ? (
      <div data-testid="table-empty">{emptyText}</div>
    ) : (
      <div data-testid="table">
        {data.map((item) => (
          <div key={rowKey(item)} data-testid="table-row">
            {columns.map((col) => (
              <div key={col.key} data-testid={`col-${col.key}`}>
                {col.render(item)}
              </div>
            ))}
          </div>
        ))}
      </div>
    ),
}));

vi.mock("@/components/Modals/InviteMembersModal/InviteMembersModal", () => ({
  default: ({
    isOpen,
    onClose,
    onSave,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: object) => Promise<void>;
  }) =>
    isOpen ? (
      <div role="dialog" aria-label="Invite member">
        <button onClick={onClose}>Close invite</button>
        <button
          onClick={() => onSave({ email: "new@example.com", role: "member" })}
        >
          Send invite
        </button>
      </div>
    ) : null,
}));

vi.mock("@/components/Modals/DeleteConfirmModal/DeleteConfirmModal", () => ({
  default: ({
    isOpen,
    onClose,
    onDelete,
    entityName,
    loading,
    error,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onDelete: () => Promise<void>;
    entityName: string;
    loading: boolean;
    error: string | null;
  }) =>
    isOpen ? (
      <div role="dialog" aria-label="Remove Member">
        <p data-testid="delete-entity">{entityName}</p>
        <button onClick={onClose}>Close delete</button>
        <button onClick={onDelete} disabled={loading}>
          Confirm remove
        </button>
        {error && <p data-testid="delete-error">{error}</p>}
      </div>
    ) : null,
}));

vi.mock("@/utils/getInitials", () => ({
  getInitials: (name: string) => name.slice(0, 2).toUpperCase(),
}));

vi.mock("@/utils/accentStyle", () => ({
  getRoleAccent: () => "info",
}));

vi.mock("lucide-react", () => ({
  Plus: () => null,
  Search: () => null,
  Trash2: () => <span data-testid="trash-icon" />,
}));

// --- Fixtures ---

const mockMembers = [
  {
    userId: "1",
    username: "alice",
    email: "alice@example.com",
    role: "owner",
    addedAt: "2024-01-10T00:00:00Z",
  },
  {
    userId: "2",
    username: "bob",
    email: "bob@example.com",
    role: "member",
    addedAt: "2024-02-20T00:00:00Z",
  },
];

const ownerOrganization = {
  name: "acme",
  displayName: "Acme Corp",
  currentUserRole: "owner",
} as never;

const memberOrganization = {
  name: "acme",
  displayName: "Acme Corp",
  currentUserRole: "member",
} as never;

const defaultProps = {
  orgName: "acme",
  token: "test-token",
  organization: ownerOrganization,
};

const mockFetchMembers = vi.fn();
const mockInviteMember = vi.fn();

function mockHook(overrides: object = {}) {
  vi.mocked(
    useOrganizationMembersModule.useOrganizationMembers,
  ).mockReturnValue({
    members: mockMembers,
    total: mockMembers.length,
    loading: false,
    error: null,
    fetchMembers: mockFetchMembers,
    inviteMember: mockInviteMember,
    setSearchQuery: vi.fn(),
    ...overrides,
  } as never);
}

function renderTab(props = {}) {
  return render(<MembersTab {...defaultProps} {...props} />);
}

// --- Tests ---

describe("MembersTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHook();
    vi.mocked(organizationsApi.removeOrganizationMember).mockResolvedValue(
      undefined as never,
    );
    mockInviteMember.mockResolvedValue(undefined);
  });

  describe("rendering", () => {
    it("renders member count summary", () => {
      renderTab();
      expect(
        screen.getByText(
          `${mockMembers.length} of ${mockMembers.length} members`,
        ),
      ).toBeInTheDocument();
    });

    it("renders member rows in the table", () => {
      renderTab();
      expect(screen.getAllByTestId("table-row")).toHaveLength(
        mockMembers.length,
      );
    });

    it("renders username in member column", () => {
      renderTab();
      expect(screen.getByText("alice")).toBeInTheDocument();
      expect(screen.getByText("bob")).toBeInTheDocument();
    });

    it("renders email in member column", () => {
      renderTab();
      expect(screen.getAllByText("alice@example.com").length).toBeGreaterThan(
        0,
      );
    });

    it("renders formatted joined date", () => {
      renderTab();
      expect(screen.getByText(/jan 10, 2024/i)).toBeInTheDocument();
    });

    it("renders role tags", () => {
      renderTab();
      const tags = screen.getAllByTestId("tag");
      const tagTexts = tags.map((t) => t.textContent);
      expect(tagTexts).toContain("owner");
      expect(tagTexts).toContain("member");
    });

    it("renders empty state when no members", () => {
      mockHook({ members: [], total: 0 });
      renderTab();
      expect(screen.getByTestId("table-empty")).toHaveTextContent(
        "No members found.",
      );
    });
  });

  describe("initial fetch", () => {
    it("calls fetchMembers with empty string on mount", () => {
      renderTab();
      expect(mockFetchMembers).toHaveBeenCalledWith("");
    });

    it("calls fetchMembers only once on mount", () => {
      renderTab();
      expect(mockFetchMembers).toHaveBeenCalledTimes(1);
    });
  });

  describe("loading state", () => {
    it("shows loading indicator when loading is true", () => {
      mockHook({ members: [], total: 0, loading: true });
      renderTab();
      expect(screen.getByText(/loading members/i)).toBeInTheDocument();
    });

    it("does not render table while loading", () => {
      mockHook({ members: [], total: 0, loading: true });
      renderTab();
      expect(screen.queryByTestId("table")).not.toBeInTheDocument();
    });
  });

  describe("error state", () => {
    it("shows error message when error is present", () => {
      mockHook({ members: [], total: 0, error: "Failed to fetch members." });
      renderTab();
      expect(screen.getByText("Failed to fetch members.")).toBeInTheDocument();
    });
  });

  describe("invite member", () => {
    it("shows Invite member button for owner", () => {
      renderTab();
      expect(
        screen.getByRole("button", { name: /invite member/i }),
      ).toBeInTheDocument();
    });

    it("opens invite modal when Invite member button is clicked", () => {
      renderTab();
      fireEvent.click(screen.getByRole("button", { name: /invite member/i }));
      expect(
        screen.getByRole("dialog", { name: "Invite member" }),
      ).toBeInTheDocument();
    });

    it("closes invite modal when close button is clicked", () => {
      renderTab();
      fireEvent.click(screen.getByRole("button", { name: /invite member/i }));
      fireEvent.click(screen.getByRole("button", { name: /close invite/i }));
      expect(
        screen.queryByRole("dialog", { name: "Invite member" }),
      ).not.toBeInTheDocument();
    });

    it("calls inviteMember when send invite is clicked", async () => {
      renderTab();
      fireEvent.click(screen.getByRole("button", { name: /invite member/i }));
      fireEvent.click(screen.getByRole("button", { name: /send invite/i }));
      await waitFor(() => {
        expect(mockInviteMember).toHaveBeenCalledWith({
          email: "new@example.com",
          role: "member",
        });
      });
    });
  });

  describe("remove member", () => {
    it("renders trash icon for each member row when privileged", () => {
      renderTab();
      expect(screen.getAllByTestId("trash-icon")).toHaveLength(
        mockMembers.length,
      );
    });

    it("does not render trash icons for regular member role", () => {
      renderTab({ organization: memberOrganization });
      expect(screen.queryAllByTestId("trash-icon")).toHaveLength(0);
    });

    it("opens delete modal with correct member name when trash is clicked", () => {
      renderTab();
      const trashButtons = screen
        .getAllByTestId("trash-icon")
        .map((el) => el.closest("button")!);
      fireEvent.click(trashButtons[0]);
      expect(
        screen.getByRole("dialog", { name: "Remove Member" }),
      ).toBeInTheDocument();
      expect(screen.getByTestId("delete-entity")).toHaveTextContent("alice");
    });

    it("closes delete modal when close button is clicked", () => {
      renderTab();
      const trashButtons = screen
        .getAllByTestId("trash-icon")
        .map((el) => el.closest("button")!);
      fireEvent.click(trashButtons[0]);
      fireEvent.click(screen.getByRole("button", { name: /close delete/i }));
      expect(
        screen.queryByRole("dialog", { name: "Remove Member" }),
      ).not.toBeInTheDocument();
    });

    it("calls removeOrganizationMember with correct args on confirm", async () => {
      renderTab();
      const trashButtons = screen
        .getAllByTestId("trash-icon")
        .map((el) => el.closest("button")!);
      fireEvent.click(trashButtons[0]);
      fireEvent.click(screen.getByRole("button", { name: /confirm remove/i }));
      await waitFor(() => {
        expect(
          vi.mocked(organizationsApi.removeOrganizationMember),
        ).toHaveBeenCalledWith("acme", "1", "test-token");
      });
    });

    it("closes delete modal after successful removal", async () => {
      renderTab();
      const trashButtons = screen
        .getAllByTestId("trash-icon")
        .map((el) => el.closest("button")!);
      fireEvent.click(trashButtons[0]);
      fireEvent.click(screen.getByRole("button", { name: /confirm remove/i }));
      await waitFor(() => {
        expect(
          screen.queryByRole("dialog", { name: "Remove Member" }),
        ).not.toBeInTheDocument();
      });
    });

    it("refetches members after successful removal", async () => {
      renderTab();
      const trashButtons = screen
        .getAllByTestId("trash-icon")
        .map((el) => el.closest("button")!);
      fireEvent.click(trashButtons[0]);
      fireEvent.click(screen.getByRole("button", { name: /confirm remove/i }));
      await waitFor(() => {
        expect(mockFetchMembers).toHaveBeenCalledWith("");
      });
    });

    it("shows error message when removal fails", async () => {
      vi.mocked(
        organizationsApi.removeOrganizationMember,
      ).mockRejectedValueOnce(new Error("Server error"));
      renderTab();
      const trashButtons = screen
        .getAllByTestId("trash-icon")
        .map((el) => el.closest("button")!);
      fireEvent.click(trashButtons[0]);
      fireEvent.click(screen.getByRole("button", { name: /confirm remove/i }));
      await waitFor(() => {
        expect(screen.getByTestId("delete-error")).toHaveTextContent(
          "Failed to remove member.",
        );
      });
    });

    it("keeps delete modal open when removal fails", async () => {
      vi.mocked(
        organizationsApi.removeOrganizationMember,
      ).mockRejectedValueOnce(new Error("Server error"));
      renderTab();
      const trashButtons = screen
        .getAllByTestId("trash-icon")
        .map((el) => el.closest("button")!);
      fireEvent.click(trashButtons[0]);
      fireEvent.click(screen.getByRole("button", { name: /confirm remove/i }));
      await waitFor(() => {
        expect(
          screen.getByRole("dialog", { name: "Remove Member" }),
        ).toBeInTheDocument();
      });
    });

    it("clears delete error when modal is closed", async () => {
      vi.mocked(
        organizationsApi.removeOrganizationMember,
      ).mockRejectedValueOnce(new Error("Server error"));
      renderTab();
      const trashButtons = screen
        .getAllByTestId("trash-icon")
        .map((el) => el.closest("button")!);
      fireEvent.click(trashButtons[0]);
      fireEvent.click(screen.getByRole("button", { name: /confirm remove/i }));
      await screen.findByTestId("delete-error");
      fireEvent.click(screen.getByRole("button", { name: /close delete/i }));
      expect(screen.queryByTestId("delete-error")).not.toBeInTheDocument();
    });
  });

  describe("sorting", () => {
    it("renders username column as sortable", () => {
      renderTab();
      const usernameCols = screen.getAllByTestId("col-username");
      expect(usernameCols.length).toBeGreaterThan(0);
    });

    it("renders addedAt column values for each member", () => {
      renderTab();
      expect(screen.getByText(/jan 10, 2024/i)).toBeInTheDocument();
      expect(screen.getByText(/feb 20, 2024/i)).toBeInTheDocument();
    });
  });
});
