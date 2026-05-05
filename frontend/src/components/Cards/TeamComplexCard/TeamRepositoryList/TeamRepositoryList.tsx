import { AlertCircle, FolderGit2, Loader2, Trash2 } from "lucide-react";

import { TeamRepository } from "@/services/organizations/organizations.api";

type Permission = "read" | "write" | "admin";

const permissionBadge: Record<Permission, { label: string; cls: string }> = {
  read: {
    label: "Read",
    cls: "bg-bg-elevated text-text-secondary border border-border",
  },
  write: {
    label: "Write",
    cls: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  },
  admin: {
    label: "Admin",
    cls: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  },
};

interface TeamRepositoryListProps {
  repos: TeamRepository[];
  loading: boolean;
  error: string | null;
  currentRepoId: number;
  removingId: number | null;
  isAdmin: boolean;
  onRemove: (repositoryId: number) => void;
}

export default function TeamRepositoryList({
  repos,
  loading,
  error,
  currentRepoId,
  removingId,
  isAdmin,
  onRemove,
}: TeamRepositoryListProps) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-text-secondary py-2">
        <Loader2 size={13} className="animate-spin" />
        Loading repositories…
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-xs text-red-400 flex items-center gap-1">
        <AlertCircle size={12} /> {error}
      </p>
    );
  }

  if (repos.length === 0) {
    return (
      <p className="text-xs text-text-secondary py-1">
        No repositories assigned to this team yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {repos.map((r) => {
        const perm = (r.permission?.toLowerCase() ?? "read") as Permission;
        const badge = permissionBadge[perm] ?? permissionBadge.read;
        const isRemoving = removingId === r.repositoryId;

        return (
          <div
            key={r.repositoryId}
            className={[
              "flex items-center justify-between gap-3 px-3 py-2 rounded-md",
              r.repositoryId === currentRepoId
                ? "bg-brand/5 border border-brand/20"
                : "bg-bg-elevated border border-border",
            ].join(" ")}
          >
            <div className="flex items-center gap-2 min-w-0">
              <FolderGit2
                size={13}
                className={
                  r.repositoryId === currentRepoId
                    ? "text-brand"
                    : "text-text-secondary"
                }
              />
              <span
                className={[
                  "text-xs truncate font-mono",
                  r.repositoryId === currentRepoId
                    ? "text-brand font-semibold"
                    : "text-text-primary",
                ].join(" ")}
              >
                {r.fullName}
              </span>
              {r.repositoryId === currentRepoId && (
                <span className="text-[10px] text-brand opacity-70">
                  (this repo)
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span
                className={`inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full ${badge.cls}`}
              >
                {badge.label}
              </span>
              {isAdmin && (
                <button
                  disabled={isRemoving}
                  onClick={() => onRemove(r.repositoryId)}
                  className="p-1 rounded text-text-secondary hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-50"
                  title="Remove from team"
                >
                  {isRemoving ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Trash2 size={12} />
                  )}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
