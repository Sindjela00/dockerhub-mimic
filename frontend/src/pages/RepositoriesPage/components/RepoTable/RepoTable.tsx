import { ColumnDef, SortDirection } from "@/components/Table/types/types";
import { Edit2, Globe, Lock, Star, Trash2 } from "lucide-react";

import { Repository } from "@/services/repositories/repositories.api";
import Table from "@/components/Table/Table";
import { useState } from "react";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function sortRepos(
  repos: Repository[],
  key: string,
  dir: SortDirection,
): Repository[] {
  return [...repos].sort((a, b) => {
    const aVal = a[key as keyof Repository] as string | number;
    const bVal = b[key as keyof Repository] as string | number;
    if (aVal < bVal) return dir === "asc" ? -1 : 1;
    if (aVal > bVal) return dir === "asc" ? 1 : -1;
    return 0;
  });
}

const REPO_COLUMNS: ColumnDef<Repository>[] = [
  {
    key: "name",
    header: "Name",
    render: (repo) => (
      <div className="flex items-center gap-2.5">
        <div
          className="w-7 h-7 min-w-[28px] rounded-md bg-bg-elevated
                        flex items-center justify-center text-[10px]
                        font-bold text-text-secondary"
        >
          {repo.name.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-medium text-text-primary">
            {repo.fullName}
          </p>
          {repo.description && (
            <p className="text-[11px] text-text-secondary truncate max-w-[240px]">
              {repo.description}
            </p>
          )}
        </div>
      </div>
    ),
  },
  {
    key: "tags",
    header: "Tags",
    hideBelow: "sm",
    render: (repo) => (
      <div className="flex items-center gap-1 flex-wrap">
        {repo.tags.slice(0, 2).map((tag) => (
          <span
            key={tag}
            className="text-[10px] px-1.5 py-0.5 rounded
                       bg-bg-elevated text-text-secondary
                       border border-border font-mono"
          >
            {tag}
          </span>
        ))}
        {repo.tags.length ? "" : <div>-</div>}
        {repo.tags.length > 2 && (
          <span className="text-[10px] text-text-secondary">
            +{repo.tags.length - 2}
          </span>
        )}
      </div>
    ),
  },
  {
    key: "visibility",
    header: "Visibility",
    hideBelow: "md",
    render: (repo) => (
      <span
        className={[
          "inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full",
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
    ),
  },
  {
    key: "starCount",
    header: "Stars",
    align: "right",
    hideBelow: "md",
    render: (repo) => (
      <span className="flex items-center justify-end gap-1 text-xs text-text-secondary">
        <Star size={11} />
        {repo.starCount}
      </span>
    ),
  },
  {
    key: "updatedAt",
    header: "Updated",
    align: "right",
    render: (repo) => (
      <span className="text-xs text-text-secondary">
        {formatDate(repo.updatedAt)}
      </span>
    ),
  },
];

interface RepoTableProps {
  repos: Repository[];
  onClick?: (repo: Repository) => void;
  onEdit?: (repo: Repository) => void;
  onDelete?: (repo: Repository) => void;
}

export default function RepoTable({
  repos,
  onClick,
  onEdit,
  onDelete,
}: RepoTableProps) {
  const [sortKey, setSortKey] = useState<string>("updatedAt");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");

  const handleSort = (key: string, dir: SortDirection) => {
    setSortKey(key);
    setSortDir(dir);
  };

  const sorted = sortRepos(repos, sortKey, sortDir);

  const columns: ColumnDef<Repository>[] = [
    ...REPO_COLUMNS,
    {
      key: "actions",
      header: "",
      align: "right",
      render: (repo) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(repo);
            }}
            className="p-1 rounded text-text-secondary hover:text-brand
                       hover:bg-bg-elevated transition-colors"
            title="Edit"
          >
            <Edit2 size={13} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(repo);
            }}
            className="p-1 rounded text-text-secondary hover:text-danger
                       hover:bg-danger-muted transition-colors"
            title="Delete"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      data={sorted}
      rowKey={(r) => String(r.id)}
      onRowClick={onClick}
      emptyText="No repositories found."
      sortKey={sortKey}
      sortDir={sortDir}
      onSort={handleSort}
    />
  );
}
