import { MemoryRouter, Route, Routes } from "react-router-dom";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useNavigate, useParams } from "react-router-dom";

import RepositoryDetailPage from "./RepositoryDetailPage";
import { useAuth } from "@/context/AppContext";
import { useRepository } from "@/services/repositories/useRepository/useRepository";
import { useStarRepository } from "@/services/repositories/useStarRepository/useStarRepository";
import { useTags } from "@/services/repositories/useTags/useTags";

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: vi.fn(), useParams: vi.fn() };
});

vi.mock("@/context/AppContext", () => ({ useAuth: vi.fn() }));
vi.mock("@/services/repositories/useRepository/useRepository", () => ({
  useRepository: vi.fn(),
}));
vi.mock("@/services/repositories/useTags/useTags", () => ({
  useTags: vi.fn(),
}));
vi.mock("@/services/repositories/useStarRepository/useStarRepository", () => ({
  useStarRepository: vi.fn(),
}));

// Lightweight stand-ins for child components
vi.mock("@/components/Loader/Loader", () => ({
  default: () => <div>Loading...</div>,
}));
vi.mock("../ErrorPage/ErrorPage", () => ({
  default: ({ title, message, onBack }: any) => (
    <div>
      <p>{title}</p>
      <p>{message}</p>
      <button onClick={onBack}>Go back</button>
    </div>
  ),
}));
vi.mock("@/components/Tabs/Tabs", () => ({
  default: ({ tabs, active, onChange }: any) => (
    <div>
      {tabs.map((t: any) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          data-active={active === t.key}
        >
          {t.label}
        </button>
      ))}
    </div>
  ),
}));
vi.mock("@/components/FavoriteStar/FavoriteStar", () => ({
  default: ({ starred, count, loading, onToggle }: any) => (
    <button onClick={onToggle} disabled={loading} data-starred={starred}>
      ★ {count}
    </button>
  ),
}));
vi.mock(
  "../../components/Modals/EditRepositoryModal/EditRepositoryModal",
  () => ({
    default: ({ isOpen, onClose, onSave, repo }: any) =>
      isOpen ? (
        <div role="dialog" aria-label="edit">
          <button onClick={onClose}>Close edit</button>
          <button onClick={() => onSave({ name: "updated" })}>Save</button>
        </div>
      ) : null,
  }),
);
vi.mock(
  "../../components/Modals/DeleteRepositoryModal/DeleteRepositoryModal",
  () => ({
    default: ({ isOpen, onClose, onDelete }: any) =>
      isOpen ? (
        <div role="dialog" aria-label="delete">
          <button onClick={onClose}>Close delete</button>
          <button onClick={onDelete}>Confirm delete</button>
        </div>
      ) : null,
  }),
);
vi.mock("./components/TabsContent/TabsContent", () => ({
  default: ({ tags, loading, error }: any) => (
    <div data-testid="tags-tab">
      {loading && <p>Tags loading...</p>}
      {error && <p>{error}</p>}
      {tags.map((t: any) => (
        <p key={t.id}>{t.name}</p>
      ))}
    </div>
  ),
}));
vi.mock("./components/TeamsTab/TeamsTab", () => ({
  default: ({ orgName }: any) => (
    <div data-testid="teams-tab">Teams: {orgName}</div>
  ),
}));
vi.mock("./components/StatBadge/StatBadge", () => ({
  StatBadge: ({ value, label }: any) => (
    <span>
      {value} {label}
    </span>
  ),
}));
vi.mock("@/utils/timeAgo", () => ({ timeAgo: () => "2 hours ago" }));
vi.mock("@/utils/formatDate", () => ({ formatDate: () => "Jan 1, 2024" }));

// ── Imports (after mocks) ─────────────────────────────────────────────────────

// ── Fixtures ──────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();

const mockRepo = {
  id: 1,
  name: "myrepo",
  fullName: "myorg/myrepo",
  description: "A test repository",
  visibility: "public",
  starCount: 42,
  isStarredByCurrentUser: false,
  updatedAt: "2024-01-01T00:00:00Z",
  createdAt: "2023-06-01T00:00:00Z",
  organization: { name: "myorg" },
};

const mockTag = { id: "t1", name: "v1.0.0" };

function setupMocks({
  repo = mockRepo,
  repoLoading = false,
  repoError = null,
  tags = [mockTag],
  tagsLoading = false,
  tagsError = null,
  tagsTotal = 1,
  starred = false,
  starCount = 42,
  starLoading = false,
  role = "Admin",
} = {}) {
  (useNavigate as any).mockReturnValue(mockNavigate);
  (useParams as any).mockReturnValue({ id: "1" });
  (useAuth as any).mockReturnValue({ role });

  (useRepository as any).mockReturnValue({
    repo: repoLoading ? null : repo,
    loading: repoLoading,
    error: repoError,
    setRepo: vi.fn(),
  });

  (useTags as any).mockReturnValue({
    tags,
    total: tagsTotal,
    page: 1,
    pageSize: 10,
    search: "",
    sortBy: "name",
    sortDir: "asc",
    setSearch: vi.fn(),
    setSortBy: vi.fn(),
    setSortDir: vi.fn(),
    changePage: vi.fn(),
    loading: tagsLoading,
    error: tagsError,
    deleteTags: vi.fn(),
  });

  (useStarRepository as any).mockReturnValue({
    starred,
    count: starCount,
    loading: starLoading,
    toggle: vi.fn(),
  });
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/repositories/1"]}>
      <Routes>
        <Route path="/repositories/:id" element={<RepositoryDetailPage />} />
        <Route path="/repositories" element={<div>Repositories list</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("RepositoryDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  describe("loading and error states", () => {
    it("shows loader while repository is loading", () => {
      setupMocks({ repoLoading: true });
      renderPage();
      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("shows error page when repo fetch fails", () => {
      setupMocks({ repo: null as any, repoError: "Not found" });
      renderPage();
      expect(screen.getByText("Repository not found")).toBeInTheDocument();
      expect(screen.getByText("Not found")).toBeInTheDocument();
    });

    it("shows default error message when repo is null with no error", () => {
      setupMocks({ repo: null as any, repoError: null });
      renderPage();
      expect(screen.getByText(/does not exist/i)).toBeInTheDocument();
    });

    it("navigates back to /repositories from error page", () => {
      setupMocks({ repo: null as any, repoError: "Oops" });
      renderPage();
      fireEvent.click(screen.getByText("Go back"));
      expect(mockNavigate).toHaveBeenCalledWith("/repositories");
    });
  });

  describe("header", () => {
    it("renders repo full name", () => {
      setupMocks();
      renderPage();
      expect(screen.getByText("myorg/myrepo")).toBeInTheDocument();
    });

    it("renders repo description", () => {
      setupMocks();
      renderPage();
      expect(screen.getByText("A test repository")).toBeInTheDocument();
    });

    it("renders public visibility badge", () => {
      setupMocks();
      renderPage();
      expect(screen.getByText("public")).toBeInTheDocument();
    });

    it("renders private visibility badge", () => {
      setupMocks({ repo: { ...mockRepo, visibility: "private" } });
      renderPage();
      expect(screen.getByText("private")).toBeInTheDocument();
    });

    it("renders initials avatar from repo name", () => {
      setupMocks();
      renderPage();
      expect(screen.getByText("MY")).toBeInTheDocument();
    });
  });

  describe("stat badges", () => {
    it("shows star count", () => {
      setupMocks({ starCount: 7 });
      renderPage();
      expect(screen.getByText("7 stars")).toBeInTheDocument();
    });

    it("shows tags total", () => {
      setupMocks({ tagsTotal: 5 });
      renderPage();
      expect(screen.getByText("5 tags")).toBeInTheDocument();
    });

    it("shows last push time", () => {
      setupMocks();
      renderPage();
      expect(screen.getByText("2 hours ago last push")).toBeInTheDocument();
    });

    it("shows created date", () => {
      setupMocks();
      renderPage();
      expect(screen.getByText("Jan 1, 2024 created")).toBeInTheDocument();
    });
  });

  describe("pull command", () => {
    it("renders docker pull command with repo fullName", () => {
      setupMocks();
      renderPage();
      expect(
        screen.getByText("docker pull myorg/myrepo:latest"),
      ).toBeInTheDocument();
    });

    it("copies command to clipboard on copy button click", async () => {
      setupMocks();
      renderPage();
      fireEvent.click(screen.getByTitle("Copy"));
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        "docker pull myorg/myrepo:latest",
      );
    });
  });

  describe("admin controls", () => {
    it("shows Edit and Delete buttons for Admin role", () => {
      setupMocks({ role: "Admin" });
      renderPage();
      expect(screen.getByRole("button", { name: /Edit/i })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Delete/i }),
      ).toBeInTheDocument();
    });

    it("hides Edit and Delete buttons for non-Admin role", () => {
      setupMocks({ role: "User" });
      renderPage();
      const editBtn = screen.queryByRole("button", { name: /Edit/i });
      const deleteBtn = screen.queryByRole("button", { name: /Delete/i });
      expect(editBtn?.closest("div")?.classList).toContain("hidden");
      expect(deleteBtn?.closest("div")?.classList).toContain("hidden");
    });
  });

  describe("edit modal", () => {
    it("opens edit modal when Edit button clicked", () => {
      setupMocks();
      renderPage();
      fireEvent.click(screen.getByRole("button", { name: /Edit/i }));
      expect(screen.getByRole("dialog", { name: "edit" })).toBeInTheDocument();
    });

    it("closes edit modal on close", () => {
      setupMocks();
      renderPage();
      fireEvent.click(screen.getByRole("button", { name: /Edit/i }));
      fireEvent.click(screen.getByText("Close edit"));
      expect(
        screen.queryByRole("dialog", { name: "edit" }),
      ).not.toBeInTheDocument();
    });

    it("calls setRepo with updated data on save", () => {
      const setRepo = vi.fn();
      (useRepository as any).mockReturnValue({
        repo: mockRepo,
        loading: false,
        error: null,
        setRepo,
      });
      setupMocks();
      (useRepository as any).mockReturnValue({
        repo: mockRepo,
        loading: false,
        error: null,
        setRepo,
      });
      renderPage();
      fireEvent.click(screen.getByRole("button", { name: /Edit/i }));
      fireEvent.click(screen.getByText("Save"));
      expect(setRepo).toHaveBeenCalled();
    });
  });

  describe("delete modal", () => {
    it("opens delete modal when Delete button clicked", () => {
      setupMocks();
      renderPage();
      fireEvent.click(screen.getByRole("button", { name: /Delete/i }));
      expect(
        screen.getByRole("dialog", { name: "delete" }),
      ).toBeInTheDocument();
    });

    it("closes delete modal on close", () => {
      setupMocks();
      renderPage();
      fireEvent.click(screen.getByRole("button", { name: /Delete/i }));
      fireEvent.click(screen.getByText("Close delete"));
      expect(
        screen.queryByRole("dialog", { name: "delete" }),
      ).not.toBeInTheDocument();
    });

    it("navigates to /repositories after successful delete", () => {
      setupMocks();
      renderPage();
      fireEvent.click(screen.getByRole("button", { name: /Delete/i }));
      fireEvent.click(screen.getByText("Confirm delete"));
      expect(mockNavigate).toHaveBeenCalledWith("/repositories");
    });
  });

  describe("star repository", () => {
    it("renders star button with count", () => {
      setupMocks({ starCount: 10, starred: false });
      renderPage();
      expect(screen.getByText("★ 10")).toBeInTheDocument();
    });

    it("calls toggleStar on star button click", () => {
      const toggle = vi.fn();
      (useStarRepository as any).mockReturnValue({
        starred: false,
        count: 42,
        loading: false,
        toggle,
      });
      renderPage();
      fireEvent.click(screen.getByText("★ 42"));
      expect(toggle).toHaveBeenCalled();
    });

    it("disables star button while loading", () => {
      setupMocks({ starLoading: true });
      renderPage();
      expect(screen.getByText(/★/)).toBeDisabled();
    });
  });

  describe("tabs", () => {
    it("renders overview tab by default with tags", () => {
      setupMocks({ tags: [mockTag] });
      renderPage();
      expect(screen.getByTestId("tags-tab")).toBeInTheDocument();
      expect(screen.getByText("v1.0.0")).toBeInTheDocument();
    });

    it("shows 'View all' link in overview that switches to tags tab", () => {
      setupMocks();
      renderPage();
      fireEvent.click(screen.getByText("View all"));
      expect(screen.getByTestId("tags-tab")).toBeInTheDocument();
    });
  });

  describe("hook initialization", () => {
    it("passes numeric id to useRepository", () => {
      setupMocks();
      renderPage();
      expect(useRepository).toHaveBeenCalledWith(1);
    });

    it("passes numeric id to useTags", () => {
      setupMocks();
      renderPage();
      expect(useTags).toHaveBeenCalledWith(1);
    });

    it("initializes useStarRepository with repo star state", () => {
      setupMocks({ starred: true, starCount: 5 });
      renderPage();
      expect(useStarRepository).toHaveBeenCalledWith(1, false, 42);
    });
  });
});
