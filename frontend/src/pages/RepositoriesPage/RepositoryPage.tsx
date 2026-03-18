import type { Filter, Repository, ViewMode } from "./types/types";
import { Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";

import Button from "@/components/Button/Button";
import CreateRepositoryModal from "./components/CreateRepositoryModal/CreateRepositoryModal";
import DeleteRepositoryModal from "./components/DeleteRepositoryModal/DeleteRepositoryModal";
import EditRepositoryModal from "./components/EditRepositoryModal/EditRepositoryModal";
import EmptyState from "./components/EmptyState/EmptyState";
import FilterTabs from "./components/FilterTabs/FilterTabs";
import { MOCK_REPOSITORIES } from "./types/mock";
import RepoCard from "../../components/Cards/RepoCard/RepoCard";
import RepoTable from "./components/RepoTable/RepoTable";
import ViewToggle from "./components/ViewToggle/ViewToggle";

export default function RepositoriesPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [view, setView] = useState<ViewMode>("grid");
  const [modalOpen, setModalOpen] = useState(false);

  const [editRepo, setEditRepo] = useState<Repository | null>(null);
  const [deleteRepo, setDeleteRepo] = useState<Repository | null>(null);

  const repos = MOCK_REPOSITORIES;

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
          r.description.toLowerCase().includes(q) ||
          r.tags.some((t) => t.toLowerCase().includes(q))
        );
      });
  }, [repos, filter, search]);

  const handleCreateRepo = () => {
    setModalOpen(true);
  };

  const handleRepoClick = (repo: Repository) => {
    console.log("Open repo", repo.name);
  };

  const handleRepoCreated = (newRepo: any) => {
    // TODO: API call
    console.log("New repo:", newRepo);
  };

  const handleEdit = (repo: Repository) => setEditRepo(repo);
  const handleDelete = (repo: Repository) => setDeleteRepo(repo);

  const handleSaveEdit = (updated: any) => {
    // TODO: API call
    console.log("Save edit:", updated);
  };

  const handleConfirmDelete = (id: string) => {
    // TODO: API call
    console.log("Delete:", id);
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">
            Create repository and start!
          </h1>
          <p className="text-sm text-text-muted mt-0.5">
            {repos.length} {repos.length === 1 ? "repository" : "repositories"}
          </p>
        </div>
        <Button variant="primary" size="md" onClick={handleCreateRepo}>
          <Plus size={15} />
          New repository
        </Button>
      </div>

      {repos.length === 0 ? (
        <EmptyState onCreate={handleCreateRepo} />
      ) : (
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filtered.map((repo) => (
                <RepoCard
                  key={repo.id}
                  repo={repo}
                  onClick={handleRepoClick}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <RepoTable
              repos={filtered}
              onClick={handleRepoClick}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </>
      )}
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
      <CreateRepositoryModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleRepoCreated}
        namespace={""}
      />
    </div>
  );
}
