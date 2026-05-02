import { GitBranch, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import AddTeamRepositoryModal from "@/components/Modals/AddTeamRepositoryModal/AddTeamRepositoryModal";
import Button from "@/components/Button/Button";
import DeleteConfirmModal from "@/components/Modals/DeleteConfirmModal/DeleteConfirmModal";
import { Repository } from "@/services/repositories/repositories.api";
import { TagComponent } from "@/components/Tag/Tag";
import { TeamRepository } from "@/services/organizations/organizations.api";
import { useNavigate } from "react-router-dom";
import { useOrganizationRepositories } from "@/services/organizations/useOrganizationRepositories/useOrganizationRepositories";
import { useTeamRepositories } from "@/services/organizations/useTeamRepositories/useTeamRepositories";

export function RepositoriesTab({
  orgName,
  teamName,
  token,
}: {
  orgName: string;
  teamName: string;
  token: string;
}) {
  const navigate = useNavigate();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [repoToDelete, setRepoToDelete] = useState<TeamRepository | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleRepoClick = (repoId: string) =>
    navigate(`/repositories/${repoId}`);

  const {
    repositories,
    total,
    loading,
    error,
    fetchRepos,
    addRepository,
    removeRepository,
  } = useTeamRepositories(token, orgName, teamName);

  const { repositories: orgRepos, fetchRepos: fetchOrgRepos } =
    useOrganizationRepositories(token, orgName);

  const initialFetchDone = useRef(false);
  useEffect(() => {
    if (!initialFetchDone.current) {
      fetchRepos();
      fetchOrgRepos("");
      initialFetchDone.current = true;
    }
  }, [fetchRepos, fetchOrgRepos]);

  const alreadyAddedIds = repositories.map((r) => r.repositoryId);

  const handleDelete = async () => {
    if (!repoToDelete) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await removeRepository(repoToDelete.repositoryId);
      setRepoToDelete(null);
    } catch {
      setDeleteError("Failed to remove repository.");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-text-muted">{total} repositories</p>
        <Button
          variant="primary"
          size="md"
          onClick={() => setIsAddModalOpen(true)}
        >
          <GitBranch size={14} /> Add repository
        </Button>
      </div>

      {loading && (
        <div className="text-sm text-text-secondary py-8 text-center">
          Loading repositories...
        </div>
      )}

      {error && !loading && (
        <div className="bg-error-muted border border-error text-error p-4 rounded-lg text-sm">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {repositories.length === 0 ? (
            <div className="col-span-2 text-center py-12">
              <p className="text-sm text-text-muted">
                No repositories added yet.
              </p>
            </div>
          ) : (
            repositories.map((repo) => (
              <div
                key={repo.repositoryId}
                className="bg-bg-surface border border-border rounded-xl p-4
                           hover:border-brand/40 hover:bg-bg-elevated
                           transition-colors flex flex-col gap-2 cursor-pointer"
                onClick={() => handleRepoClick(String(repo.repositoryId))}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-semibold text-brand font-mono">
                    {repo.repositoryName}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <TagComponent accentClass="brand">
                      {repo.permission}
                    </TagComponent>
                    <button
                      onClick={() => setRepoToDelete(repo)}
                      className="p-1 rounded text-text-muted hover:text-error
                                 hover:bg-error-muted transition-colors"
                      title="Remove from team"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed font-mono">
                  {repo.fullName}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      <AddTeamRepositoryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={(repositoryId, permission) =>
          addRepository({ repositoryId, permission })
        }
        availableRepositories={orgRepos}
        alreadyAddedIds={alreadyAddedIds}
      />

      <DeleteConfirmModal
        isOpen={!!repoToDelete}
        onClose={() => setRepoToDelete(null)}
        onDelete={handleDelete}
        title="Remove repository"
        entityName={repoToDelete?.repositoryName ?? ""}
        description={
          <>
            Removing{" "}
            <span className="text-text-primary font-medium">
              {repoToDelete?.repositoryName}
            </span>{" "}
            will revoke this team's access to the repository.
          </>
        }
        loading={deleteLoading}
        error={deleteError}
      />
    </div>
  );
}
