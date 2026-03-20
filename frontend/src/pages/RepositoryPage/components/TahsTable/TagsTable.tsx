import { ColumnDef } from "@/components/Table/types/types";
import { Package } from "lucide-react";
import Table from "@/components/Table/Table";
import { TagDetail } from "../../types/types";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? "s" : ""} ago`;
  return `${Math.floor(months / 12)} year${Math.floor(months / 12) > 1 ? "s" : ""} ago`;
}

const TAG_COLUMNS: ColumnDef<TagDetail>[] = [
  {
    key: "name",
    header: "Tag",
    render: (tag) => (
      <span
        className="text-xs font-mono font-medium px-2 py-0.5
                       rounded bg-bg-elevated border border-border
                       text-text-primary"
      >
        {tag.name}
      </span>
    ),
  },
  {
    key: "digest",
    header: "Digest",
    hideBelow: "sm",
    render: (tag) => (
      <span className="text-xs font-mono text-text-secondary truncate max-w-[140px] block">
        {tag.digest}
      </span>
    ),
  },
  {
    key: "os",
    header: "OS / Arch",
    hideBelow: "md",
    render: (tag) => (
      <span className="text-xs text-text-secondary">
        {tag.os} / {tag.arch}
      </span>
    ),
  },
  {
    key: "size",
    header: "Size",
    align: "right",
    hideBelow: "md",
    render: (tag) => (
      <div className="flex items-center justify-end gap-1 text-xs text-text-secondary">
        <Package size={11} />
        {tag.size}
      </div>
    ),
  },
  {
    key: "pushedAt",
    header: "Pushed",
    align: "right",
    render: (tag) => (
      <span
        className="text-xs text-text-secondary"
        title={formatDate(tag.pushedAt)}
      >
        {timeAgo(tag.pushedAt)}
      </span>
    ),
  },
];

interface TagsTableProps {
  tags: TagDetail[];
}

export default function TagsTable({ tags }: TagsTableProps) {
  return (
    <Table
      columns={TAG_COLUMNS}
      data={tags}
      rowKey={(t) => t.name}
      emptyText="No tags available."
    />
  );
}
