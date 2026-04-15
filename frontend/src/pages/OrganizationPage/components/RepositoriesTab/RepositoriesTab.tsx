import { Plus, Search } from "lucide-react";
import { useCallback, useState } from "react";

import Button from "@/components/Button/Button";
import CreateRepositoryModal from "@/components/Modals/CreateRepositoryModal/CreateRepositoryModal";
import InputField from "@/components/InputField/InputField";
import RepoCard from "@/components/Cards/RepoCard/RepoCard";
import { Repository } from "@/services/repositories/repositories.api";

interface OrgOwner {
  name: string;
  displayName: string;
}

interface RepositoriesTabProps {
  repos: Repository[];
  loading?: boolean;
  owner: OrgOwner;
  onRepoClick?: (repo: Repository) => void;
  onRepoEdit?: (repo: Repository) => void;
  onRepoDelete?: (repo: Repository) => void;
  onRepoCreated?: () => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
}

export function RepositoriesTab({
  repos,
  loading,
  owner,
  onRepoClick,
  onRepoEdit,
  onRepoDelete,
  onRepoCreated,
  searchValue,
  onSearchChange,
}: RepositoriesTabProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleCreateModalClose = useCallback(() => {
    setIsCreateModalOpen(false);
  }, []);

  const handleCreateSuccess = useCallback(() => {
    setIsCreateModalOpen(false);
    onRepoCreated?.();
  }, [onRepoCreated]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 flex-wrap justify-between">
        <div className="flex-1 min-w-[200px] max-w-sm">
          <InputField
            value={searchValue}
            onChange={onSearchChange}
            placeholder="Find a repository..."
            startIcon={<Search size={13} className="text-text-muted" />}
            className="w-full"
          />
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus size={14} />
          New repository
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="text-sm text-text-muted text-center py-12 col-span-full">
            Loading repositories...
          </div>
        ) : repos.length === 0 ? (
          <div className="text-center py-12 col-span-full">
            <p className="text-sm text-text-muted">
              {searchValue.trim()
                ? "No repositories match your search."
                : "No repositories found."}
            </p>
          </div>
        ) : (
          repos.map((repo) => (
            <RepoCard
              key={repo.id}
              repo={repo}
              onClick={(r) => onRepoClick?.(r)}
              onEdit={(r) => onRepoEdit?.(r)}
              onDelete={(r) => onRepoDelete?.(r)}
            />
          ))
        )}
      </div>

      <CreateRepositoryModal
        isOpen={isCreateModalOpen}
        onClose={handleCreateModalClose}
        onCreate={handleCreateSuccess}
        username=""
        owner={{ ...owner }}
      />
    </div>
  );
}
