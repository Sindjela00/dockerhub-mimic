import { Download, Edit2, Globe, Lock, Star, Tag, Trash2 } from "lucide-react";

import { Repository } from "@/pages/RepositoriesPage/types/types";

interface RepoCardProps {
  repo: Repository;
  onClick?: (repo: Repository) => void;
  onEdit?: (repo: Repository) => void;
  onDelete?: (repo: Repository) => void;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function RepoCard({
  repo,
  onClick,
  onEdit,
  onDelete,
}: RepoCardProps) {
  return (
    <button
      onClick={() => onClick?.(repo)}
      className="w-full text-left group flex flex-col gap-3 p-5
                 bg-bg-surface border border-border rounded-xl
                 hover:border-border-strong hover:bg-bg-elevated
                 transition-colors duration-150"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
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
              {repo.namespace}/{repo.name}
            </p>
            <p className="text-[11px] text-text-secondary">
              Updated {formatDate(repo.updatedAt)}
            </p>
          </div>
        </div>

        {/* Visibility badge */}
        <span
          className={[
            "flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap",
            repo.visibility === "public"
              ? "bg-success-muted text-success"
              : "bg-bg-elevated text-text-secondary border border-border",
          ].join(" ")}
        >
          {repo.visibility === "public" ? (
            <Globe size={10} />
          ) : (
            <Lock size={10} />
          )}
          {repo.visibility}
        </span>

        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(repo);
            }}
            className="p-1 rounded text-text-muted hover:text-brand hover:bg-bg-elevated
               transition-colors"
            title="Edit"
          >
            <Edit2 size={13} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(repo);
            }}
            className="p-1 rounded text-text-muted hover:text-danger hover:bg-danger-muted
               transition-colors"
            title="Delete"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Description */}
      {repo.description && (
        <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
          {repo.description}
        </p>
      )}

      {/* Tags */}
      {repo.tags.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
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
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 pt-1 border-t border-border">
        <span className="flex items-center gap-1 text-[11px] text-text-secondary">
          <Download size={11} />
          {formatCount(repo.pullCount)} pulls
        </span>
        <span className="flex items-center gap-1 text-[11px] text-text-secondary">
          <Star size={11} />
          {repo.stars}
        </span>
      </div>
    </button>
  );
}
