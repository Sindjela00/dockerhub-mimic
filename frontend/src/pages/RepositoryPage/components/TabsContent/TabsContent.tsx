import { Clock, Search, Trash2 } from "lucide-react";
import { SortDirection, TableProps } from "@/components/Table/types/types";
import { useMemo, useState } from "react";

import Button from "@/components/Button/Button";
import Table from "@/components/Table/Table";
import { TagDetail } from "@/services/repositories/repositories.api";
import { formatDate } from "@/utils/formatDate";
import { timeAgo } from "@/utils/timeAgo";

export default function TagsTab({ tags }: { tags: TagDetail[] }) {
  const [search, setSearch] = useState("");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const result = tags.filter((t) => t.name.toLowerCase().includes(q));
    return [...result].sort((a, b) => {
      const diff =
        new Date(b.lastPushedAt).getTime() - new Date(a.lastPushedAt).getTime();
      return sortDir === "desc" ? diff : -diff;
    });
  }, [tags, search, sortDir]);

  const allSelected =
    filtered.length > 0 && filtered.every((t) => selected.has(t.name));
  const someSelected = filtered.some((t) => selected.has(t.name));
  const selectedCount = [...selected].filter((n) =>
    filtered.some((t) => t.name === n),
  ).length;

  const toggleAll = () => {
    if (allSelected) {
      setSelected((s) => {
        const next = new Set(s);
        filtered.forEach((t) => next.delete(t.name));
        return next;
      });
    } else {
      setSelected((s) => {
        const next = new Set(s);
        filtered.forEach((t) => next.add(t.name));
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

  const handleBulkDelete = () => {
    console.log("Delete tags:", [...selected]);
    setSelected(new Set());
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
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tags..."
            className="flex-1 bg-transparent text-sm text-text-primary
                       placeholder:text-text-secondary focus:outline-none"
          />
        </div>
        <button
          onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
          className="flex items-center gap-1.5 px-3 py-2 h-[38px] rounded-lg
             bg-bg-elevated border border-border text-xs
             text-text-secondary hover:text-text-primary
             hover:border-border-strong transition-colors"
        >
          <Clock size={13} />
          {sortDir === "desc" ? "Newest first" : "Oldest first"}
        </button>
        {someSelected && (
          <Button variant="danger" size="sm" onClick={handleBulkDelete}>
            <Trash2 size={13} />
            Delete {selectedCount} {selectedCount === 1 ? "tag" : "tags"}
          </Button>
        )}
      </div>

      <Table<TagDetail>
        columns={columns}
        data={filtered}
        rowKey={(tag) => tag.name}
        emptyText={search ? `No tags match "${search}"` : "No tags available."}
        sortKey="lastPushedAt"
        sortDir={sortDir}
        onSort={(_, dir) => setSortDir(dir)}
      />

      {filtered.length > 0 && (
        <p className="text-xs text-text-secondary">
          {filtered.length} {filtered.length === 1 ? "tag" : "tags"}
          {search && ` matching "${search}"`}
        </p>
      )}
    </div>
  );
}
