import type { Filter, ViewMode } from "./types/types";
import { Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";

import Button from "@/components/Button/Button";
import CreateRepositoryModal from "../../components/Modals/CreateRepositoryModal/CreateRepositoryModal";
import DeleteRepositoryModal from "../../components/Modals/DeleteRepositoryModal/DeleteRepositoryModal";
import EditRepositoryModal from "../../components/Modals/EditRepositoryModal/EditRepositoryModal";
import EmptyState from "./components/EmptyState/EmptyState";
import FilterTabs from "./components/FilterTabs/FilterTabs";
import Loader from "@/components/Loader/Loader";
import RepoCard from "../../components/Cards/RepoCard/RepoCard";
import RepoTable from "./components/RepoTable/RepoTable";
import { Repository } from "@/services/repositories/repositories.api";
import ViewToggle from "./components/ViewToggle/ViewToggle";
import { useAuth } from "@/context/AppContext";
import { useNavigate } from "react-router-dom";
import { useRepositories } from "@/services/repositories/useRepositories/useRepositories";

export default function RepositoriesPage() {
  const navigate = useNavigate();
  const { username } = useAuth();
  const { repos, total, loading, error, fetchRepositories } = useRepositories();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [view, setView] = useState<ViewMode>("grid");
  const [modalOpen, setModalOpen] = useState(false);
  const [editRepo, setEditRepo] = useState<Repository | null>(null);
  const [deleteRepo, setDeleteRepo] = useState<Repository | null>(null);

  const counts: Record<Filter, number> = {
    all: repos.length,
    public: repos.filter((r) => r.visibility === "public").length,
    private: repos.filter((r) => r.visibility === "private").length,
  };

  const filtered = useMemo(() => {
    return repos
      .filter((r) => filter === "all" || r.visibility === filter)
      .filter((r) => {
        const q = search.toLowerCase();
        return (
          r.name.toLowerCase().includes(q) ||
          r.fullName.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.tags.some((t: string) => t.toLowerCase().includes(q))
        );
      });
  }, [repos, filter, search]);

  const handleRepoClick = (repo: Repository) => {
    navigate(`/repositories/${repo.fullName}`);
  };

  const handleRepoCreated = () => {
    setModalOpen(false);
    fetchRepositories();
  };

  const handleSaveEdit = () => {
    setEditRepo(null);
    fetchRepositories();
  };

  const handleConfirmDelete = () => {
    setDeleteRepo(null);
    fetchRepositories();
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

      {/* Loading */}
      {loading && <Loader />}

      {/* Empty state */}
      {!loading && !error && repos.length === 0 && (
        <EmptyState onCreate={() => setModalOpen(true)} />
      )}

      {/* Content */}
      {!loading && repos.length > 0 && (
        <>
          {/* Toolbar */}
          <div className="flex items-center gap-3 flex-wrap">
            <div
              className="flex items-center gap-2 flex-1 min-w-50
                            px-3 py-2 rounded-lg bg-bg-elevated
                            border border-border focus-within:border-border-strong
                            transition-colors"
            >
              <Search size={14} className="text-text-muted shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search repositories..."
                className="flex-1 bg-transparent text-sm text-text-primary
                           placeholder:text-text-muted focus:outline-none"
              />
            </div>
            <FilterTabs active={filter} onChange={setFilter} counts={counts} />
            <ViewToggle view={view} onChange={setView} />
          </div>

          {/* Results */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <p className="text-sm text-text-secondary">
                No repositories match{" "}
                <span className="text-text-primary">"{search}"</span>
              </p>
              <button
                onClick={() => setSearch("")}
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
