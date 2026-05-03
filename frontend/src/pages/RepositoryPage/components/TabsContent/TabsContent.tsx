import { Clock, Search, Trash2 } from "lucide-react";
import {
  TagDetail,
  TagSortBy,
  TagSortDir,
} from "@/services/repositories/repositories.api";
import { useEffect, useState } from "react";

import Button from "@/components/Button/Button";
import Pagination from "@/components/Pagination/Pagination";
import Table from "@/components/Table/Table";
import { TableProps } from "@/components/Table/types/types";
import { formatDate } from "@/utils/formatDate";
import { timeAgo } from "@/utils/timeAgo";

interface TagsTabProps {
  tags: TagDetail[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  error: string;
  search: string;
  sortBy: TagSortBy;
  sortDir: TagSortDir;
  onSearch: (v: string) => void;
  onSortBy: (v: TagSortBy) => void;
  onSortDir: (v: TagSortDir) => void;
  onPage: (p: number) => void;
  onDeleteTags: (names: string[]) => Promise<void>;
}

export default function TagsTab({
  tags,
  total,
  page,
  pageSize,
  search,
  sortDir,
  onSearch,
  onSortDir,
  onPage,
  onDeleteTags,
}: TagsTabProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [localSearch, setLocalSearch] = useState(search);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      onSearch(localSearch);
    }, 400);

    return () => clearTimeout(t);
  }, [localSearch]);

  const allSelected =
    tags.length > 0 && tags.every((t) => selected.has(t.name));
  const someSelected = tags.some((t) => selected.has(t.name));
  const selectedCount = [...selected].filter((n) =>
    tags.some((t) => t.name === n),
  ).length;

  const toggleAll = () => {
    if (allSelected) {
      setSelected((s) => {
        const next = new Set(s);
        tags.forEach((t) => next.delete(t.name));
        return next;
      });
    } else {
      setSelected((s) => {
        const next = new Set(s);
        tags.forEach((t) => next.add(t.name));
        return next;
      });
    }
  };

  const toggleOne = (name: string) => {
    setSelected((s) => {
      const next = new Set(s);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    setDeleting(true);
    try {
      await onDeleteTags([...selected]);
      setSelected(new Set());
    } finally {
      setDeleting(false);
    }
  };

  const columns: TableProps<TagDetail>["columns"] = [
    {
      key: "select",
      header: (
        <input
          type="checkbox"
          checked={allSelected}
          ref={(el) => {
            if (el) el.indeterminate = someSelected && !allSelected;
          }}
          onChange={toggleAll}
          className="rounded border-border accent-brand cursor-pointer"
          aria-label="Select all tags"
        />
      ),
      width: "w-10",
      render: (tag) => (
        <input
          type="checkbox"
          checked={selected.has(tag.name)}
          onChange={() => toggleOne(tag.name)}
          className="rounded border-border accent-brand cursor-pointer"
          aria-label={`Select ${tag.name}`}
        />
      ),
    },
    {
      key: "name",
      header: "Tag",
      render: (tag) => (
        <span
          className="text-xs font-mono font-medium px-2 py-0.5
                     rounded bg-bg-elevated border border-border text-text-primary"
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
          {tag.os ?? "-"} / {tag.architecture ?? "-"}
        </span>
      ),
    },
    {
      key: "size",
      header: "Size",
      align: "right",
      hideBelow: "md",
      render: (tag) => (
        <span className="text-xs text-text-secondary">{tag.size}</span>
      ),
    },
    {
      key: "lastPushedAt",
      header: "Pushed",
      align: "right",
      sortable: true,
      render: (tag) => (
        <span
          className="text-xs text-text-secondary"
          title={formatDate(tag.lastPushedAt)}
        >
          {timeAgo(tag.lastPushedAt)}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div
          className="flex items-center gap-2 flex-1 min-w-[180px]
                        px-3 py-2 rounded-lg bg-bg-elevated
                        border border-border focus-within:border-border-strong
                        transition-colors"
        >
          <Search size={13} className="text-text-secondary shrink-0" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search tags..."
            className="flex-1 bg-transparent text-sm text-text-primary
                       placeholder:text-text-secondary focus:outline-none"
          />
        </div>
        <button
          onClick={() => onSortDir(sortDir === "asc" ? "desc" : "asc")}
          className="flex items-center gap-1.5 px-3 py-2 h-[38px] rounded-lg
             bg-bg-elevated border border-border text-xs
             text-text-secondary hover:text-text-primary
             hover:border-border-strong transition-colors"
        >
          <Clock size={13} />
          {sortDir === "desc" ? "Newest first" : "Oldest first"}
        </button>
        {someSelected && (
          <Button
            variant="danger"
            size="sm"
            onClick={handleBulkDelete}
            disabled={deleting}
          >
            <Trash2 size={13} />
            {deleting
              ? "Deleting..."
              : `Delete ${selectedCount} ${selectedCount === 1 ? "tag" : "tags"}`}
          </Button>
        )}
      </div>

      <Table<TagDetail>
        columns={columns}
        data={tags}
        rowKey={(tag) => tag.name}
        emptyText={search ? `No tags match "${search}"` : "No tags available."}
        sortKey="lastPushedAt"
        sortDir={sortDir}
        onSort={(_, dir) => onSortDir(dir)}
      />

      {tags.length > 0 && (
        <Pagination
          page={page}
          total={total}
          pageSize={pageSize}
          onChange={onPage}
          maxVisible={5}
        />
      )}
    </div>
  );
}
