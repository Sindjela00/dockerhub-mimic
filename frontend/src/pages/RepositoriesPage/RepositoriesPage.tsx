import { Plus, Search } from "lucide-react";
import type {
  TimeRangeFilter,
  ViewMode,
  VisibilityFilter,
} from "./types/types";
import { useEffect, useMemo, useRef, useState } from "react";

import Button from "@/components/Button/Button";
import CreateRepositoryModal from "../../components/Modals/CreateRepositoryModal/CreateRepositoryModal";
import DeleteRepositoryModal from "../../components/Modals/DeleteRepositoryModal/DeleteRepositoryModal";
import EditRepositoryModal from "../../components/Modals/EditRepositoryModal/EditRepositoryModal";
import EmptyState from "./components/EmptyState/EmptyState";
import FilterTabs from "./components/FilterTabs/FilterTabs";
import Loader from "@/components/Loader/Loader";
import Pagination from "@/components/Pagination/Pagination";
import RepoCard from "../../components/Cards/RepoCard/RepoCard";
import RepoTable from "./components/RepoTable/RepoTable";
import { type Repository } from "@/services/repositories/repositories.api";
import ViewToggle from "./components/ViewToggle/ViewToggle";
import { useAuth } from "@/context/AppContext";
import { useNavigate } from "react-router-dom";
import { useRepositories } from "@/services/repositories/useRepositories/useRepositories";

export default function RepositoriesPage() {
  const navigate = useNavigate();
  const { username } = useAuth();
  const { repos, total, page, pageSize, loading, error, fetchRepositories } =
    useRepositories();

  const [search, setSearch] = useState("");
  const [visibility, setVisibility] = useState<VisibilityFilter>("all");
  const [mineOnly, setMineOnly] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRangeFilter>("all");
  const [view, setView] = useState<ViewMode>("grid");
  const [modalOpen, setModalOpen] = useState(false);
  const [editRepo, setEditRepo] = useState<Repository | null>(null);
  const [deleteRepo, setDeleteRepo] = useState<Repository | null>(null);
  const searchFetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const selectedVisibility = visibility === "all" ? undefined : visibility;

  const counts: Record<VisibilityFilter, number> = {
    all: repos.length,
    public: repos.filter((r) => r.visibility === "public").length,
    private: repos.filter((r) => r.visibility === "private").length,
  };

  const trimmedSearch = search.trim();
  const hasActiveFilters =
    mineOnly ||
    visibility !== "all" ||
    timeRange !== "all" ||
    trimmedSearch.length > 0;

  const selectedSearch = trimmedSearch.length > 0 ? trimmedSearch : undefined;
  const filtered = useMemo(() => {
    const now = Date.now();
    const msForRange =
      timeRange === "all"
        ? 0
        : timeRange === "7d"
          ? 7 * 24 * 60 * 60 * 1000
          : timeRange === "30d"
            ? 30 * 24 * 60 * 60 * 1000
            : 90 * 24 * 60 * 60 * 1000;
    const createdAfter = timeRange === "all" ? 0 : now - msForRange;

    return repos
      .filter((r) => {
        if (visibility === "all") return true;
        return r.visibility === visibility;
      })
      .filter((r) => {
        if (timeRange === "all") return true;
        return new Date(r.createdAt).getTime() >= createdAfter;
      })
      .filter((r) => {
        const q = search.toLowerCase();
        return (
          r.name.toLowerCase().includes(q) ||
          r.fullName.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.tags.some((t) => t.toLowerCase().includes(q))
        );
      });
  }, [repos, visibility, timeRange, search]);

  const handleRepoClick = (repo: Repository) => {
    navigate(`/repositories/${repo.id}`);
  };

  const handleRepoCreated = () => {
    setModalOpen(false);
    if (searchFetchTimeoutRef.current) {
      clearTimeout(searchFetchTimeoutRef.current);
    }
    fetchRepositories(
      1,
      mineOnly ? true : undefined,
      selectedVisibility,
      selectedSearch,
    );
  };

  const handleSaveEdit = () => {
    setEditRepo(null);
    if (searchFetchTimeoutRef.current) {
      clearTimeout(searchFetchTimeoutRef.current);
    }
    fetchRepositories(
      page,
      mineOnly ? true : undefined,
      selectedVisibility,
      selectedSearch,
    );
  };

  const handleConfirmDelete = () => {
    setDeleteRepo(null);
    if (searchFetchTimeoutRef.current) {
      clearTimeout(searchFetchTimeoutRef.current);
    }
    fetchRepositories(
      page,
      mineOnly ? true : undefined,
      selectedVisibility,
      selectedSearch,
    );
  };

  const handleVisibilityChange = (next: VisibilityFilter) => {
    setVisibility(next);
    if (searchFetchTimeoutRef.current) {
      clearTimeout(searchFetchTimeoutRef.current);
    }
    fetchRepositories(
      1,
      mineOnly ? true : undefined,
      next === "all" ? undefined : next,
      selectedSearch,
    );
  };

  const handleMineOnlyChange = (checked: boolean) => {
    setMineOnly(checked);
    if (searchFetchTimeoutRef.current) {
      clearTimeout(searchFetchTimeoutRef.current);
    }
    fetchRepositories(
      1,
      checked ? true : undefined,
      selectedVisibility,
      selectedSearch,
    );
  };

  const refetchPage = (newPage: number) => {
    if (searchFetchTimeoutRef.current) {
      clearTimeout(searchFetchTimeoutRef.current);
    }
    fetchRepositories(
      newPage,
      mineOnly ? true : undefined,
      selectedVisibility,
      selectedSearch,
    );
  };

  const handleClearSearch = () => {
    setSearch("");
    if (searchFetchTimeoutRef.current) {
      clearTimeout(searchFetchTimeoutRef.current);
    }

    fetchRepositories(
      1,
      mineOnly ? true : undefined,
      selectedVisibility,
      undefined,
    );
  };

  useEffect(() => {
    return () => {
      if (searchFetchTimeoutRef.current) {
        clearTimeout(searchFetchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">
            Repositories
          </h1>
          <p className="text-sm text-text-muted mt-0.5">
            {total} {total === 1 ? "repository" : "repositories"}
          </p>
        </div>
        <Button variant="primary" size="md" onClick={() => setModalOpen(true)}>
          <Plus size={15} />
          New repository
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div
          className="px-4 py-3 rounded-lg bg-danger-muted border border-danger/20
                        text-xs text-danger"
        >
          {error}
        </div>
      )}

      {/* Content */}
      {!error && (
        <>
          {/* Toolbar */}
          <div className="flex items-center gap-3 flex-wrap">
            <div
              className="flex items-center gap-2 flex-1 min-w-50 h-10 px-3
                            rounded-lg bg-bg-elevated border border-border
                            focus-within:border-border-strong transition-colors"
            >
              <Search size={14} className="text-text-muted shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  const next = e.target.value;
                  setSearch(next);
                  // Debounce BE fetch so the input stays focused while typing.
                  if (searchFetchTimeoutRef.current) {
                    clearTimeout(searchFetchTimeoutRef.current);
                  }
                  searchFetchTimeoutRef.current = setTimeout(() => {
                    fetchRepositories(
                      1,
                      mineOnly ? true : undefined,
                      selectedVisibility,
                      next.trim().length > 0 ? next.trim() : undefined,
                    );
                  }, 300);
                }}
                placeholder="Search repositories..."
                className="flex-1 h-full min-w-0 bg-transparent text-sm
                           text-text-primary placeholder:text-text-muted
                           focus:outline-none"
              />
            </div>
            <label
              className="flex items-center gap-2 shrink-0 h-10 px-3 rounded-lg
                         bg-bg-elevated border border-border cursor-pointer
                         text-sm text-text-secondary hover:text-text-primary
                         transition-colors select-none"
            >
              <input
                type="checkbox"
                checked={mineOnly}
                onChange={(e) => handleMineOnlyChange(e.target.checked)}
                className="rounded border-border text-brand focus:ring-brand
                           focus:ring-offset-0 focus:ring-2 cursor-pointer"
              />
              <span>Mine only</span>
            </label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRangeFilter)}
              aria-label="Filter by upload time"
              className="shrink-0 h-10 px-3 rounded-lg bg-bg-elevated border
                         border-border text-sm text-text-primary cursor-pointer
                         focus:outline-none focus:border-border-strong
                         transition-colors"
            >
              <option value="all">Any time</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            <FilterTabs
              active={visibility}
              onChange={handleVisibilityChange}
              counts={counts}
            />
            <ViewToggle view={view} onChange={setView} />
          </div>

          {/* Results */}
          {loading ? (
            <div className="py-16">
              <Loader />
            </div>
          ) : repos.length === 0 && !hasActiveFilters ? (
            <EmptyState onCreate={() => setModalOpen(true)} />
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <p className="text-sm text-text-secondary">
                No repositories match
              </p>
              <button
                onClick={handleClearSearch}
                className="mt-2 text-xs text-brand hover:underline cursor-pointer"
              >
                Clear search
              </button>
            </div>
          ) : view === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {filtered.map((repo) => (
                <RepoCard
                  key={repo.id}
                  repo={repo}
                  onClick={handleRepoClick}
                  onEdit={setEditRepo}
                  onDelete={setDeleteRepo}
                />
              ))}
            </div>
          ) : (
            <RepoTable
              repos={filtered}
              onClick={handleRepoClick}
              onEdit={setEditRepo}
              onDelete={setDeleteRepo}
            />
          )}
        </>
      )}

      {!loading && repos.length > 0 && (
        <>
          <Pagination
            page={page}
            total={total}
            pageSize={pageSize}
            onChange={refetchPage}
          />
        </>
      )}

      {/* Modals */}
      <CreateRepositoryModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleRepoCreated}
        username={username ?? ""}
      />
      <EditRepositoryModal
        isOpen={!!editRepo}
        onClose={() => setEditRepo(null)}
        onSave={handleSaveEdit}
        repo={editRepo}
      />
      <DeleteRepositoryModal
        isOpen={!!deleteRepo}
        onClose={() => setDeleteRepo(null)}
        onDelete={handleConfirmDelete}
        repo={deleteRepo}
      />
    </div>
  );
}
