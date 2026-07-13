import { Plus, Search } from "lucide-react";
import type {
  TimeRangeFilter,
  ViewMode,
  VisibilityFilter,
} from "./types/types";
import { useEffect, useMemo, useRef, useState } from "react";

import BadgeFilter, {
  type BadgeOption,
} from "./components/BadgeFilter/BadgeFilter";
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
import { useNavigate, useSearchParams } from "react-router-dom";
import { useRepositories } from "@/services/repositories/useRepositories/useRepositories";
import InputField from "@/components/InputField/InputField";

type SortOption = {
  label: string;
  sortBy: "createdAt" | "stars" | "pulls";
  sortDir: "asc" | "desc";
};

const sortOptions: SortOption[] = [
  { label: "Newest", sortBy: "createdAt", sortDir: "desc" },
  { label: "Oldest", sortBy: "createdAt", sortDir: "asc" },
  { label: "Most stars", sortBy: "stars", sortDir: "desc" },
  { label: "Least stars", sortBy: "stars", sortDir: "asc" },
  { label: "Most pulled", sortBy: "pulls", sortDir: "desc" },
];

export default function RepositoriesPage() {
  const navigate = useNavigate();
  const { username } = useAuth();
  const { repos, total, page, pageSize, loading, error, fetchRepositories } =
    useRepositories();
  const [searchParams] = useSearchParams();

  const [search, setSearch] = useState("");
  const [visibility, setVisibility] = useState<VisibilityFilter>("all");
  const [mineOnly, setMineOnly] = useState(false);
  const [starredOnly, setStarredOnly] = useState(
    searchParams.get("starred") === "true",
  );
  const [timeRange, setTimeRange] = useState<TimeRangeFilter>("all");
  const [badges, setBadges] = useState<BadgeOption[]>([]);
  const [selectedSort, setSelectedSort] = useState<SortOption>(
    () =>
      sortOptions.find((o) => o.sortBy === searchParams.get("sortBy")) ??
      sortOptions[0],
  );
  const [view, setView] = useState<ViewMode>("grid");
  const [modalOpen, setModalOpen] = useState(false);
  const [editRepo, setEditRepo] = useState<Repository | null>(null);
  const [deleteRepo, setDeleteRepo] = useState<Repository | null>(null);

  const searchFetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const initialFetchDone = useRef(false);

  const trimmedSearch = search.trim();

  const hasActiveFilters =
    mineOnly ||
    visibility !== "all" ||
    timeRange !== "all" ||
    trimmedSearch.length > 0 ||
    starredOnly ||
    badges.length > 0;

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
      .filter((r) =>
        visibility === "all" ? true : r.visibility === visibility,
      )
      .filter((r) =>
        timeRange === "all"
          ? true
          : new Date(r.createdAt).getTime() >= createdAfter,
      )
      .filter((r) => {
        const q = trimmedSearch.toLowerCase();
        return (
          r.name.toLowerCase().includes(q) ||
          r.fullName.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.tags.some((t) => t.toLowerCase().includes(q))
        );
      });
  }, [repos, visibility, timeRange, trimmedSearch]);

  const clearSearchTimeout = () => {
    if (searchFetchTimeoutRef.current)
      clearTimeout(searchFetchTimeoutRef.current);
  };

  useEffect(() => {
    if (initialFetchDone.current) return;
    initialFetchDone.current = true;
    fetchRepositories(
      1,
      mineOnly || undefined,
      visibility === "all" ? undefined : visibility,
      trimmedSearch || undefined,
      selectedSort.sortBy,
      selectedSort.sortDir,
      starredOnly || undefined,
      badges.length ? badges : undefined,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => clearSearchTimeout();
  }, []);

  const handleRepoClick = (repo: Repository) =>
    navigate(`/repositories/${repo.id}`);

  const handleRepoCreated = () => {
    setModalOpen(false);
    clearSearchTimeout();
    fetchRepositories(
      1,
      mineOnly || undefined,
      visibility === "all" ? undefined : visibility,
      trimmedSearch || undefined,
      selectedSort.sortBy,
      selectedSort.sortDir,
      starredOnly || undefined,
      badges.length ? badges : undefined,
    );
  };

  const handleSaveEdit = () => {
    setEditRepo(null);
    clearSearchTimeout();
    fetchRepositories(
      page,
      mineOnly || undefined,
      visibility === "all" ? undefined : visibility,
      trimmedSearch || undefined,
      selectedSort.sortBy,
      selectedSort.sortDir,
      starredOnly || undefined,
      badges.length ? badges : undefined,
    );
  };

  const handleConfirmDelete = () => {
    setDeleteRepo(null);
    clearSearchTimeout();
    fetchRepositories(
      page,
      mineOnly || undefined,
      visibility === "all" ? undefined : visibility,
      trimmedSearch || undefined,
      selectedSort.sortBy,
      selectedSort.sortDir,
      starredOnly || undefined,
      badges.length ? badges : undefined,
    );
  };

  const handleVisibilityChange = (next: VisibilityFilter) => {
    setVisibility(next);
    setStarredOnly(false);
    fetchRepositories(
      1,
      mineOnly || undefined,
      next === "all" ? undefined : next,
      trimmedSearch || undefined,
      selectedSort.sortBy,
      selectedSort.sortDir,
      undefined,
      badges.length ? badges : undefined,
    );
  };

  const handleMineOnlyChange = (checked: boolean) => {
    setMineOnly(checked);
    fetchRepositories(
      1,
      checked || undefined,
      visibility === "all" ? undefined : visibility,
      trimmedSearch || undefined,
      selectedSort.sortBy,
      selectedSort.sortDir,
      starredOnly || undefined,
      badges.length ? badges : undefined,
    );
  };

  const handleStarredChange = (next: boolean) => {
    setStarredOnly(next);
    fetchRepositories(
      1,
      mineOnly || undefined,
      visibility === "all" ? undefined : visibility,
      trimmedSearch || undefined,
      selectedSort.sortBy,
      selectedSort.sortDir,
      next ? true : undefined,
      badges.length ? badges : undefined,
    );
  };

  const handleBadgesChange = (next: BadgeOption[]) => {
    setBadges(next);
    fetchRepositories(
      1,
      mineOnly || undefined,
      visibility === "all" ? undefined : visibility,
      trimmedSearch || undefined,
      selectedSort.sortBy,
      selectedSort.sortDir,
      starredOnly || undefined,
      next.length ? next : undefined,
    );
  };

  const handleSortChange = (option: SortOption) => {
    setSelectedSort(option);
    fetchRepositories(
      1,
      mineOnly || undefined,
      visibility === "all" ? undefined : visibility,
      trimmedSearch || undefined,
      option.sortBy,
      option.sortDir,
      starredOnly || undefined,
      badges.length ? badges : undefined,
    );
  };

  const handleSearchChange = (next: string) => {
    setSearch(next);
    clearSearchTimeout();
    searchFetchTimeoutRef.current = setTimeout(() => {
      const trimmed = next.trim();
      fetchRepositories(
        1,
        mineOnly || undefined,
        visibility === "all" ? undefined : visibility,
        trimmed || undefined,
        selectedSort.sortBy,
        selectedSort.sortDir,
        starredOnly || undefined,
        badges.length ? badges : undefined,
      );
    }, 300);
  };

  const handleClearSearch = () => {
    setSearch("");
    clearSearchTimeout();
    fetchRepositories(
      1,
      mineOnly || undefined,
      visibility === "all" ? undefined : visibility,
      undefined,
      selectedSort.sortBy,
      selectedSort.sortDir,
      starredOnly || undefined,
      badges.length ? badges : undefined,
    );
  };

  const refetchPage = (newPage: number) => {
    clearSearchTimeout();
    fetchRepositories(
      newPage,
      mineOnly || undefined,
      visibility === "all" ? undefined : visibility,
      trimmedSearch || undefined,
      selectedSort.sortBy,
      selectedSort.sortDir,
      starredOnly || undefined,
      badges.length ? badges : undefined,
    );
  };

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
          <Plus size={15} /> New repository
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-3 rounded-lg bg-danger-muted border border-danger/20 text-xs text-danger">
          {error}
        </div>
      )}

      {/* Toolbar */}
      {!error && (
        <>
          <div className="flex flex-col gap-2.5 mt-4">
            <div className="flex items-center gap-3 flex-wrap">
              <InputField
                value={search}
                onChangeRaw={(e) => handleSearchChange(e.target.value)}
                placeholder="Search repositories..."
                startIcon={<Search size={14} />}
                className="flex-1 min-w-50"
              />

              <label className="flex items-center gap-2 shrink-0 h-10 px-3 rounded-lg bg-bg-elevated border border-border cursor-pointer text-sm text-text-secondary hover:text-text-primary transition-colors select-none">
                <input
                  type="checkbox"
                  checked={mineOnly}
                  onChange={(e) => handleMineOnlyChange(e.target.checked)}
                  className="rounded border-border text-brand focus:ring-brand focus:ring-offset-0 focus:ring-2 cursor-pointer"
                />
                <span>Mine only</span>
              </label>

              <select
                value={selectedSort.label}
                onChange={(e) =>
                  handleSortChange(
                    sortOptions.find((o) => o.label === e.target.value)!,
                  )
                }
                className="shrink-0 h-10 px-3 rounded-lg bg-bg-elevated border border-border text-sm text-text-primary cursor-pointer focus:outline-none focus:border-border-strong transition-colors"
              >
                {sortOptions.map((option) => (
                  <option key={option.label} value={option.label}>
                    {option.label}
                  </option>
                ))}
              </select>

              <FilterTabs
                active={visibility}
                onChange={handleVisibilityChange}
                counts={total}
                starredOnly={starredOnly}
                onStarredChange={handleStarredChange}
              />
              <ViewToggle view={view} onChange={setView} />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-text-muted shrink-0">Badges</span>
              <BadgeFilter active={badges} onChange={handleBadgesChange} />
            </div>
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
        <Pagination
          page={page}
          total={total}
          pageSize={pageSize}
          onChange={refetchPage}
        />
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
