import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import OrganizationDetailPage from "./OrganizationPage";

// --- Mocks ---

const mockNavigate = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({ orgName: "acme" }),
}));

vi.mock("../../context/AppContext", () => ({
  useAuth: () => ({ token: "test-token" }),
}));

const mockRefetch = vi.fn();
const mockDeleteOrganization = vi.fn();
const mockFetchRepos = vi.fn();
const mockSetReposSearchQuery = vi.fn();

const defaultOrganization = {
  name: "acme",
  displayName: "Acme Corp",
  description: "We build things.",
  avatarUrl: "",
  createdAt: "2024-01-15T00:00:00Z",
  ownerUsername: "alice",
  currentUserRole: "owner",
  memberCount: 5,
  repositoryCount: 3,
};

vi.mock("@/services/organizations/useOrganization/useOrganization", () => ({
  useOrganization: () => ({
    organization: defaultOrganization,
    loading: false,
    error: null,
    refetch: mockRefetch,
    remove: mockDeleteOrganization,
    deleteLoading: false,
    deleteError: null,
  }),
}));

vi.mock(
  "@/services/organizations/useOrganizationRepositories/useOrganizationRepositories",
  () => ({
    useOrganizationRepositories: () => ({
      repositories: [],
      loading: false,
      fetchRepos: mockFetchRepos,
      searchQuery: "",
      setSearchQuery: mockSetReposSearchQuery,
    }),
  }),
);

vi.mock("@/components/Tabs/Tabs", () => ({
  default: ({
    tabs,
    active,
    onChange,
  }: {
    tabs: { value: string; label: string; badge?: number }[];
    active: string;
    onChange: (val: string) => void;
  }) => (
    <div>
      {tabs.map((tab) => (
        <button key={tab.value} onClick={() => onChange(tab.value as never)}>
          {tab.label}
          {tab.badge !== undefined && <span> ({tab.badge})</span>}
        </button>
      ))}
    </div>
  ),
}));

vi.mock("@/components/Cards/StatCard/StatCard", () => ({
  default: ({ label, value }: { label: string; value: string }) => (
    <div data-testid={`stat-${label.toLowerCase()}`}>
      {label}: {value}
    </div>
  ),
}));

vi.mock("@/components/Tag/Tag", () => ({
  TagComponent: ({ children }: { children: React.ReactNode }) => (
    <span data-testid="role-tag">{children}</span>
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

vi.mock(
  "@/components/Modals/EditOrganizationModal/EditOrganizationModal",
  () => ({
    default: ({
      isOpen,
      onClose,
      onSave,
    }: {
      isOpen: boolean;
      onClose: () => void;
      onSave: (data: object) => void;
    }) =>
      isOpen ? (
        <div role="dialog" aria-label="Edit organization">
          <button onClick={onClose}>Close edit</button>
          <button
            onClick={() =>
              onSave({ displayName: "Updated", description: "", avatarUrl: "" })
            }
          >
            Save
          </button>
        </div>
      ) : null,
  }),
);

vi.mock("@/components/Modals/DeleteConfirmModal/DeleteConfirmModal", () => ({
  default: ({
    isOpen,
    onClose,
    onDelete,
    loading,
    error,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onDelete: () => Promise<void>;
    loading: boolean;
    error: string | null;
  }) =>
    isOpen ? (
      <div role="dialog" aria-label="Delete organization">
        <button onClick={onClose}>Close delete</button>
        <button onClick={onDelete} disabled={loading}>
          Confirm delete
        </button>
        {error && <p>{error}</p>}
      </div>
    ) : null,
}));

vi.mock("./components/RepositoriesTab/RepositoriesTab", () => ({
  RepositoriesTab: () => (
    <div data-testid="repositories-tab">Repositories content</div>
  ),
}));

vi.mock("./components/TeamTab/TeamTab", () => ({
  TeamsTab: () => <div data-testid="teams-tab">Teams content</div>,
}));

vi.mock("./components/MembersTab/MembersTab", () => ({
  default: () => <div data-testid="members-tab">Members content</div>,
}));

vi.mock("../ErrorPage/ErrorPage", () => ({
  default: () => <div data-testid="error-page">Error</div>,
}));

vi.mock("lucide-react", () => ({
  Building2: () => null,
  Calendar: () => null,
  Pencil: () => null,
  Trash2: () => null,
}));

// --- Helpers ---

function renderPage() {
  return render(<OrganizationDetailPage />);
}

function withOrgHook(overrides: object) {
  vi.doMock("@/services/organizations/useOrganization/useOrganization", () => ({
    useOrganization: () => ({
      organization: defaultOrganization,
      loading: false,
      error: null,
      refetch: mockRefetch,
      remove: mockDeleteOrganization,
      deleteLoading: false,
      deleteError: null,
      ...overrides,
    }),
  }));
}

// --- Tests ---

describe("OrganizationDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDeleteOrganization.mockResolvedValue(undefined);
  });

  describe("rendering", () => {
    it("renders organization display name", () => {
      renderPage();
      expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    });

    it("renders organization handle", () => {
      renderPage();
      expect(screen.getByText("@acme")).toBeInTheDocument();
    });

    it("renders organization description", () => {
      renderPage();
      expect(screen.getByText("We build things.")).toBeInTheDocument();
    });

    it("renders owner username", () => {
      renderPage();
      expect(screen.getByText(/owned by @alice/i)).toBeInTheDocument();
    });

    it("renders formatted creation date", () => {
      renderPage();
      expect(screen.getByText(/january 15, 2024/i)).toBeInTheDocument();
    });

    it("renders stat cards", () => {
      renderPage();
      expect(screen.getByTestId("stat-members")).toHaveTextContent("5");
      expect(screen.getByTestId("stat-repositories")).toHaveTextContent("3");
      expect(screen.getByTestId("stat-role")).toHaveTextContent("owner");
    });

    it("renders repositories tab content by default", () => {
      renderPage();
      expect(screen.getByTestId("repositories-tab")).toBeInTheDocument();
    });
  });

  describe("role tag", () => {
    it("shows Owner tag for owner role", () => {
      renderPage();
      expect(screen.getByTestId("role-tag")).toHaveTextContent("Owner");
    });
  });

  describe("edit and delete buttons visibility", () => {
    it("shows Edit organization button for owner", () => {
      renderPage();
      expect(
        screen.getByRole("button", { name: /edit organization/i }),
      ).toBeInTheDocument();
    });

    it("shows Delete button for owner", () => {
      renderPage();
      expect(
        screen.getByRole("button", { name: /delete/i }),
      ).toBeInTheDocument();
    });
  });

  describe("tab switching", () => {
    it("shows teams tab content when Teams tab is clicked", () => {
      renderPage();
      fireEvent.click(screen.getByRole("button", { name: /teams/i }));
      expect(screen.getByTestId("teams-tab")).toBeInTheDocument();
    });

    it("shows members tab content when Members tab is clicked", () => {
      renderPage();
      fireEvent.click(screen.getByRole("button", { name: /members/i }));
      expect(screen.getByTestId("members-tab")).toBeInTheDocument();
    });

    it("shows repositories tab content when Repositories tab is clicked after switching", () => {
      renderPage();
      fireEvent.click(screen.getByRole("button", { name: /teams/i }));
      fireEvent.click(screen.getByRole("button", { name: /repositories/i }));
      expect(screen.getByTestId("repositories-tab")).toBeInTheDocument();
    });
  });

  describe("edit modal", () => {
    it("opens edit modal when Edit organization button is clicked", () => {
      renderPage();
      fireEvent.click(
        screen.getByRole("button", { name: /edit organization/i }),
      );
      expect(
        screen.getByRole("dialog", { name: "Edit organization" }),
      ).toBeInTheDocument();
    });

    it("closes edit modal when close button inside modal is clicked", () => {
      renderPage();
      fireEvent.click(
        screen.getByRole("button", { name: /edit organization/i }),
      );
      fireEvent.click(screen.getByRole("button", { name: /close edit/i }));
      expect(
        screen.queryByRole("dialog", { name: "Edit organization" }),
      ).not.toBeInTheDocument();
    });

    it("calls refetch when edit form is saved", async () => {
      renderPage();
      fireEvent.click(
        screen.getByRole("button", { name: /edit organization/i }),
      );
      fireEvent.click(screen.getByRole("button", { name: /save/i }));
      await waitFor(() => {
        expect(mockRefetch).toHaveBeenCalled();
      });
    });
  });

  describe("delete modal", () => {
    it("opens delete modal when Delete button is clicked", () => {
      renderPage();
      fireEvent.click(screen.getByRole("button", { name: /^delete$/i }));
      expect(
        screen.getByRole("dialog", { name: "Delete organization" }),
      ).toBeInTheDocument();
    });

    it("closes delete modal when close button inside modal is clicked", () => {
      renderPage();
      fireEvent.click(screen.getByRole("button", { name: /^delete$/i }));
      fireEvent.click(screen.getByRole("button", { name: /close delete/i }));
      expect(
        screen.queryByRole("dialog", { name: "Delete organization" }),
      ).not.toBeInTheDocument();
    });

    it("calls deleteOrganization when confirm delete is clicked", async () => {
      renderPage();
      fireEvent.click(screen.getByRole("button", { name: /^delete$/i }));
      fireEvent.click(screen.getByRole("button", { name: /confirm delete/i }));
      await waitFor(() => {
        expect(mockDeleteOrganization).toHaveBeenCalled();
      });
    });
  });

  describe("initial repo fetch", () => {
    it("fetches repos on initial load when organization is available", () => {
      renderPage();
      expect(mockFetchRepos).toHaveBeenCalledWith("");
    });

    it("fetches repos only once on initial render", () => {
      renderPage();
      expect(mockFetchRepos).toHaveBeenCalledTimes(1);
    });
  });
});
