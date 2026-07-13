import {
  AlertCircle,
  ChevronDown,
  ChevronRight,
  FolderGit2,
  Loader2,
  Trash2,
  Users,
} from "lucide-react";
import {
  Team,
  TeamRepository,
  fetchTeamRepositories,
} from "@/services/organizations/organizations.api";

import DeleteConfirmModal from "@/components/Modals/DeleteConfirmModal/DeleteConfirmModal";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

interface TeamRowProps {
  team: Team;
  orgName: string;
  onDelete?: (teamName: string) => Promise<void>;
}

interface TeamRowState {
  expanded: boolean;
  repos: TeamRepository[];
  loading: boolean;
  error: string | null;
}

export function TeamRow({ team, orgName, onDelete }: TeamRowProps) {
  const navigate = useNavigate();

  const [state, setState] = useState<TeamRowState>({
    expanded: false,
    repos: [],
    loading: false,
    error: null,
  });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleToggle = async () => {
    if (state.expanded) {
      setState((s) => ({ ...s, expanded: false }));
      return;
    }
    setState((s) => ({ ...s, expanded: true, loading: true, error: null }));
    try {
      const res = await fetchTeamRepositories(orgName, team.name);
      setState((s) => ({ ...s, repos: res.repositories, loading: false }));
    } catch (e: any) {
      setState((s) => ({
        ...s,
        loading: false,
        error: e?.message ?? "Failed to load repositories",
      }));
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await onDelete(team.name);
      setConfirmOpen(false);
    } catch {
      setDeleteError("Failed to delete team.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="rounded-lg border border-border bg-bg-elevated overflow-hidden">
        <div className="w-full flex items-center gap-3 px-4 py-3 text-left">
          <button
            className="text-text-secondary hover:text-text-primary transition-colors p-0.5"
            onClick={handleToggle}
          >
            {state.expanded ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )}
          </button>

          <div
            className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer hover:bg-bg-base/60 rounded-md px-2 py-1 -mx-2 -my-1 transition-colors"
            onClick={() =>
              navigate(`/organizations/${orgName}/teams/${team.name}`)
            }
          >
            <div className="w-7 h-7 rounded-md bg-bg-base border border-border flex items-center justify-center shrink-0">
              <Users size={13} className="text-text-secondary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">
                {team.name}
              </p>
              {team.description && (
                <p className="text-xs text-text-secondary truncate">
                  {team.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs text-text-secondary">
              {team.memberCount} member{team.memberCount !== 1 ? "s" : ""}
            </span>
            <span className="text-xs text-text-secondary">
              {team.repositoryCount} repo{team.repositoryCount !== 1 ? "s" : ""}
            </span>

            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmOpen(true);
                }}
                className="text-text-muted hover:text-danger transition-colors p-0.5"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        {state.expanded && (
          <div className="border-t border-border bg-bg-base px-4 py-3 flex flex-col gap-1">
            {state.loading && (
              <div className="flex items-center gap-2 text-xs text-text-secondary py-2">
                <Loader2 size={13} className="animate-spin" />
                Loading repositories…
              </div>
            )}
            {state.error && (
              <p className="text-xs text-red-400 flex items-center gap-1 py-2">
                <AlertCircle size={12} /> {state.error}
              </p>
            )}
            {!state.loading && !state.error && state.repos.length === 0 && (
              <p className="text-xs text-text-secondary py-1">
                No repositories assigned to this team yet.
              </p>
            )}
            {!state.loading &&
              !state.error &&
              state.repos.map((r) => (
                <div
                  key={r.repositoryId}
                  onClick={() => navigate(`/repositories/${r.repositoryId}`)}
                  className="flex items-center gap-2 px-3 py-2 rounded-md bg-bg-elevated border border-border cursor-pointer"
                >
                  <FolderGit2
                    size={13}
                    className="text-text-secondary shrink-0"
                  />
                  <span className="text-xs truncate font-mono text-text-primary">
                    {r.fullName}
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>

      <DeleteConfirmModal
        isOpen={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setDeleteError(null);
        }}
        onDelete={handleDelete}
        title="Delete Team"
        entityName={team.name}
        loading={deleting}
        error={deleteError}
      />
    </>
  );
}
