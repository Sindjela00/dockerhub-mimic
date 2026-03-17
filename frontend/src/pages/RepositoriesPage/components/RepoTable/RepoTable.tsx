import { Download, Globe, Lock, Star } from "lucide-react";

import { ColumnDef } from "../../../../components/Table/types/types";
import { Repository } from "../../types/types";
import Table from "../../../../components/Table/Table";

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
            {repo.namespace}/{repo.name}
          </p>
          {repo.description && (
            <p className="text-[11px] text-text-muted truncate max-w-[240px]">
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
          "inline-flex items-center gap-1 text-[10px] font-medium",
          "px-2 py-0.5 rounded-full",
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
    key: "pullCount",
    header: "Pulls",
    align: "right",
    hideBelow: "md",
    render: (repo) => (
      <span className="flex items-center justify-end gap-1 text-xs text-text-secondary">
        <Download size={11} />
        {formatCount(repo.pullCount)}
      </span>
    ),
  },
  {
    key: "stars",
    header: "Stars",
    align: "right",
    hideBelow: "md",
    render: (repo) => (
      <span className="flex items-center justify-end gap-1 text-xs text-text-secondary">
        <Star size={11} />
        {repo.stars}
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
}

export default function RepoTable({ repos, onClick }: RepoTableProps) {
  return (
    <Table
      columns={REPO_COLUMNS}
      data={repos}
      rowKey={(r) => r.id}
      onRowClick={onClick}
      emptyText="No repositories found."
    />
  );
}
