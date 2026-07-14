import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { Organization } from "@/services/organizations/organizations.api";
import { RepositoriesTab } from "./RepositoriesTab";
import { Repository } from "@/services/repositories/repositories.api";

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

vi.mock("@/components/InputField/InputField", () => ({
  default: ({
    value,
    onChange,
    placeholder,
  }: {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
  }) => (
    <input
      aria-label="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  ),
}));

vi.mock("@/components/Cards/RepoCard/RepoCard", () => ({
  default: ({
    repo,
    onClick,
    onEdit,
    onDelete,
  }: {
    repo: Repository;
    onClick: (r: Repository) => void;
    onEdit: (r: Repository) => void;
    onDelete: (r: Repository) => void;
  }) => (
    <div data-testid={`repo-card-${repo.id}`}>
      <span>{repo.name}</span>
      <button onClick={() => onClick(repo)}>Open</button>
      <button onClick={() => onEdit(repo)}>Edit</button>
      <button onClick={() => onDelete(repo)}>Delete</button>
    </div>
  ),
}));

vi.mock(
  "@/components/Modals/CreateRepositoryModal/CreateRepositoryModal",
  () => ({
    default: ({
      isOpen,
      onClose,
      onCreate,
    }: {
      isOpen: boolean;
      onClose: () => void;
      onCreate: () => void;
    }) =>
      isOpen ? (
        <div role="dialog" aria-label="Create repository">
          <button onClick={onClose}>Close create</button>
          <button onClick={onCreate}>Confirm create</button>
        </div>
      ) : null,
  }),
);

vi.mock("lucide-react", () => ({
  Plus: () => null,
  Search: () => null,
}));

const mockRepos: Repository[] = [
  {
    id: "1",
    name: "repo-one",
    description: "First repo",
    isPrivate: false,
    defaultBranch: "main",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    ownerName: "acme",
    ownerType: "organization",
  } as unknown as Repository,
  {
    id: "2",
    name: "repo-two",
    description: "Second repo",
    isPrivate: true,
    defaultBranch: "main",
    createdAt: "2024-02-01T00:00:00Z",
    updatedAt: "2024-02-01T00:00:00Z",
    ownerName: "acme",
    ownerType: "organization",
  } as unknown as Repository,
];

const ownerOrganization = {
  currentUserRole: "owner",
} as Organization;

const memberOrganization = {
  currentUserRole: "member",
} as Organization;

const defaultProps = {
  repos: mockRepos,
  loading: false,
  owner: { name: "acme", displayName: "Acme Corp" },
  onRepoClick: vi.fn(),
  onRepoEdit: vi.fn(),
  onRepoDelete: vi.fn(),
  onRepoCreated: vi.fn(),
  searchValue: "",
  onSearchChange: vi.fn(),
  organization: ownerOrganization,
};

function renderTab(props = {}) {
  return render(<RepositoriesTab {...defaultProps} {...props} />);
}

describe("RepositoriesTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders the search input", () => {
      renderTab();
      expect(
        screen.getByPlaceholderText("Find a repository..."),
      ).toBeInTheDocument();
    });

    it("renders a repo card for each repository", () => {
      renderTab();
      expect(screen.getByTestId("repo-card-1")).toBeInTheDocument();
      expect(screen.getByTestId("repo-card-2")).toBeInTheDocument();
    });

    it("renders repo names", () => {
      renderTab();
      expect(screen.getByText("repo-one")).toBeInTheDocument();
      expect(screen.getByText("repo-two")).toBeInTheDocument();
    });

    it("shows New repository button for owner", () => {
      renderTab();
      expect(
        screen.getByRole("button", { name: /new repository/i }),
      ).toBeInTheDocument();
    });

    it("shows New repository button for admin", () => {
      renderTab({ organization: { currentUserRole: "admin" } as Organization });
      expect(
        screen.getByRole("button", { name: /new repository/i }),
      ).toBeInTheDocument();
    });
  });

  describe("empty and loading states", () => {
    it("shows loading text when loading is true", () => {
      renderTab({ loading: true });
      expect(screen.getByText("Loading repositories...")).toBeInTheDocument();
    });

    it("does not render repo cards while loading", () => {
      renderTab({ loading: true });
      expect(screen.queryByTestId("repo-card-1")).not.toBeInTheDocument();
    });

    it("shows generic empty message when repos is empty and no search query", () => {
      renderTab({ repos: [], searchValue: "" });
      expect(screen.getByText("No repositories found.")).toBeInTheDocument();
    });

    it("shows search empty message when repos is empty and search query is set", () => {
      renderTab({ repos: [], searchValue: "nothing" });
      expect(
        screen.getByText("No repositories match your search."),
      ).toBeInTheDocument();
    });

    it("shows generic empty message when search value is whitespace only", () => {
      renderTab({ repos: [], searchValue: "   " });
      expect(screen.getByText("No repositories found.")).toBeInTheDocument();
    });
  });

  describe("search", () => {
    it("calls onSearchChange when typing in the search input", () => {
      const onSearchChange = vi.fn();
      renderTab({ onSearchChange });
      fireEvent.change(screen.getByPlaceholderText("Find a repository..."), {
        target: { value: "repo" },
      });
      expect(onSearchChange).toHaveBeenCalledWith("repo");
    });

    it("renders the current searchValue in the input", () => {
      renderTab({ searchValue: "my-query" });
      expect(screen.getByPlaceholderText("Find a repository...")).toHaveValue(
        "my-query",
      );
    });
  });

  describe("repo card interactions", () => {
    it("calls onRepoClick when Open button is clicked", () => {
      const onRepoClick = vi.fn();
      renderTab({ onRepoClick });
      fireEvent.click(screen.getAllByRole("button", { name: /open/i })[0]);
      expect(onRepoClick).toHaveBeenCalledWith(mockRepos[0]);
    });

    it("calls onRepoEdit when Edit button is clicked", () => {
      const onRepoEdit = vi.fn();
      renderTab({ onRepoEdit });
      fireEvent.click(screen.getAllByRole("button", { name: /edit/i })[0]);
      expect(onRepoEdit).toHaveBeenCalledWith(mockRepos[0]);
    });

    it("calls onRepoDelete when Delete button is clicked", () => {
      const onRepoDelete = vi.fn();
      renderTab({ onRepoDelete });
      fireEvent.click(screen.getAllByRole("button", { name: /delete/i })[0]);
      expect(onRepoDelete).toHaveBeenCalledWith(mockRepos[0]);
    });

    it("does not throw when optional onRepoClick is not provided", () => {
      renderTab({ onRepoClick: undefined });
      expect(() =>
        fireEvent.click(screen.getAllByRole("button", { name: /open/i })[0]),
      ).not.toThrow();
    });

    it("does not throw when optional onRepoEdit is not provided", () => {
      renderTab({ onRepoEdit: undefined });
      expect(() =>
        fireEvent.click(screen.getAllByRole("button", { name: /edit/i })[0]),
      ).not.toThrow();
    });

    it("does not throw when optional onRepoDelete is not provided", () => {
      renderTab({ onRepoDelete: undefined });
      expect(() =>
        fireEvent.click(screen.getAllByRole("button", { name: /delete/i })[0]),
      ).not.toThrow();
    });
  });

  describe("create repository modal", () => {
    it("opens create modal when New repository button is clicked", () => {
      renderTab();
      fireEvent.click(screen.getByRole("button", { name: /new repository/i }));
      expect(
        screen.getByRole("dialog", { name: "Create repository" }),
      ).toBeInTheDocument();
    });

    it("closes create modal when close button is clicked", () => {
      renderTab();
      fireEvent.click(screen.getByRole("button", { name: /new repository/i }));
      fireEvent.click(screen.getByRole("button", { name: /close create/i }));
      expect(
        screen.queryByRole("dialog", { name: "Create repository" }),
      ).not.toBeInTheDocument();
    });

    it("closes modal and calls onRepoCreated when creation is confirmed", () => {
      const onRepoCreated = vi.fn();
      renderTab({ onRepoCreated });
      fireEvent.click(screen.getByRole("button", { name: /new repository/i }));
      fireEvent.click(screen.getByRole("button", { name: /confirm create/i }));
      expect(
        screen.queryByRole("dialog", { name: "Create repository" }),
      ).not.toBeInTheDocument();
      expect(onRepoCreated).toHaveBeenCalledTimes(1);
    });

    it("does not call onRepoCreated when modal is closed without confirming", () => {
      const onRepoCreated = vi.fn();
      renderTab({ onRepoCreated });
      fireEvent.click(screen.getByRole("button", { name: /new repository/i }));
      fireEvent.click(screen.getByRole("button", { name: /close create/i }));
      expect(onRepoCreated).not.toHaveBeenCalled();
    });

    it("does not throw when optional onRepoCreated is not provided", () => {
      renderTab({ onRepoCreated: undefined });
      fireEvent.click(screen.getByRole("button", { name: /new repository/i }));
      expect(() =>
        fireEvent.click(
          screen.getByRole("button", { name: /confirm create/i }),
        ),
      ).not.toThrow();
    });
  });
});
