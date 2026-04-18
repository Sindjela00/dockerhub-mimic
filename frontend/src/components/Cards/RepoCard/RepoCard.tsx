import { Edit2, Globe, Lock, Star, Tag, Trash2 } from "lucide-react";

import { Repository } from "@/services/repositories/repositories.api";
import { TagComponent } from "@/components/Tag/Tag";
import { formatDate } from "@/utils/formatDate";
import { useAuth } from "@/context/AppContext";
import { useStarRepository } from "@/services/repositories/useStarRepository/useStarRepository";

interface RepoCardProps {
  repo: Repository;
  onClick?: (repo: Repository) => void;
  onEdit?: (repo: Repository) => void;
  onDelete?: (repo: Repository) => void;
}

export default function RepoCard({
  repo,
  onClick,
  onEdit,
  onDelete,
}: RepoCardProps) {
  const { role } = useAuth();
  const { starred, count, loading, toggle } = useStarRepository(
    repo.id,
    repo.isStarredByCurrentUser ?? false,
    repo.starCount,
  );

  return (
    <button
      onClick={() => onClick?.(repo)}
      className="w-full text-left group flex flex-col gap-2 p-4
                 bg-bg-surface border border-border rounded-xl
                 hover:border-border-strong hover:bg-bg-elevated
                 transition-colors duration-150"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 overflow-hidden">
          <div
            className="w-8 h-8 min-w-[32px] rounded-md bg-bg-elevated
                          flex items-center justify-center text-xs font-bold
                          text-text-secondary group-hover:text-brand transition-colors"
          >
            {repo.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-text-primary truncate">
              {repo.fullName}
            </p>
            <p className="text-[11px] text-text-muted">
              Updated {formatDate(repo.updatedAt)}
            </p>
          </div>
        </div>

        {/* Visibility badge */}
        <TagComponent
          accentClass={repo.visibility === "public" ? "success" : "ghost"}
        >
          {repo.visibility === "public" ? (
            <Globe size={10} />
          ) : (
            <Lock size={10} />
          )}
          {repo.visibility}
        </TagComponent>

        {/* Actions */}
        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggle();
            }}
            disabled={loading}
            className={[
              "p-1 rounded transition-colors",
              starred
                ? "text-brand"
                : "text-text-muted hover:text-brand hover:bg-bg-elevated",
              loading ? "opacity-50 cursor-not-allowed" : "",
            ].join(" ")}
            title={starred ? "Unstar" : "Star"}
          >
            <Star size={13} fill={starred ? "currentColor" : "none"} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(repo);
            }}
            className={`p-1 rounded text-text-muted hover:text-brand
                       hover:bg-bg-elevated transition-colors ${role === "Admin" ? "" : "hidden"}`}
            title="Edit"
          >
            <Edit2 size={13} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(repo);
            }}
            className={`p-1 rounded text-text-muted hover:text-danger
                       hover:bg-danger-muted transition-colors ${role === "Admin" ? "" : "hidden"}`}
            title="Delete"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Description */}
      <div className="flex-1 flex flex-col gap-3">
        {repo.description && (
          <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
            {repo.description}
          </p>
        )}

        {/* Tags */}
        {repo.tags.length > 0 ? (
          <div className="mt-auto flex items-center gap-1.5 flex-wrap">
            <Tag size={11} className="text-text-secondary" />
            {repo.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-1.5 py-0.5 rounded
                     bg-bg-elevated text-text-secondary border border-border font-mono"
              >
                {tag}
              </span>
            ))}
            {repo.tags.length > 3 && (
              <span className="text-[10px] text-text-secondary">
                +{repo.tags.length - 3}
              </span>
            )}
          </div>
        ) : (
          <div className="mt-auto flex items-center gap-1.5 flex-wrap">
            <Tag size={11} className="text-text-secondary" />
            <span className="text-[10px] text-text-muted">
              There are no tags
            </span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 pt-2 border-t border-border">
        <span className="flex items-center gap-1 text-[11px] text-text-secondary">
          <Star size={11} fill="none" />
          {count}
        </span>
        {repo.isOfficial && (
          <TagComponent accentClass="brand">Official</TagComponent>
        )}
      </div>
    </button>
  );
}
