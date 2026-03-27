import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Calendar,
  Check,
  Clock,
  Copy,
  Globe,
  Lock,
  Pencil,
  Search,
  Star,
  Tag,
  Trash2,
} from "lucide-react";

import Button from "@/components/Button/Button";
import Loader from "@/components/Loader/Loader";
import Tabs from "@/components/Tabs/Tabs";
import FavoriteStar from "@/components/FavoriteStar/FavoriteStar";
import EditRepositoryModal from "../../components/Modals/EditRepositoryModal/EditRepositoryModal";
import DeleteRepositoryModal from "../../components/Modals/DeleteRepositoryModal/DeleteRepositoryModal";
import { StatBadge } from "./components/StatBadge/StatBadge";

import {
  getMyRepositories,
  getRepositoryById,
} from "@/services/repositories/repositories.api";
import { MOCK_REPO_DETAIL } from "./types/mock";
import {
  TABS,
  type RepositoryDetail,
  type Tab,
  type TagDetail,
} from "./types/types";
import type { SortDirection } from "@/components/Table/types/types";

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

function TagsTab({ tags }: { tags: TagDetail[] }) {
  const [search, setSearch] = useState("");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return tags
      .filter((t) => t.name.toLowerCase().includes(q))
      .sort((a, b) => {
        const diff =
          new Date(a.pushedAt).getTime() - new Date(b.pushedAt).getTime();
        return sortDir === "asc" ? diff : -diff;
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
    // TODO: DELETE /api/repositories/:id/tags
    console.log("Delete tags:", [...selected]);
    setSelected(new Set());
  };

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
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg
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

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-bg-elevated">
              <th className="px-4 py-3 w-10">
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
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">
                Tag
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary hidden sm:table-cell">
                Digest
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary hidden md:table-cell">
                OS / Arch
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary hidden md:table-cell">
                Size
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary">
                Pushed
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-sm text-text-secondary"
                >
                  {search ? `No tags match "${search}"` : "No tags available."}
                </td>
              </tr>
            ) : (
              filtered.map((tag, i) => (
                <tr
                  key={tag.name}
                  className={[
                    "transition-colors",
                    selected.has(tag.name)
                      ? "bg-brand-subtle"
                      : "hover:bg-bg-elevated",
                    i !== filtered.length - 1 ? "border-b border-border" : "",
                  ].join(" ")}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(tag.name)}
                      onChange={() => toggleOne(tag.name)}
                      className="rounded border-border accent-brand cursor-pointer"
                      aria-label={`Select ${tag.name}`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="text-xs font-mono font-medium px-2 py-0.5
                                     rounded bg-bg-elevated border border-border
                                     text-text-primary"
                    >
                      {tag.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-xs font-mono text-text-secondary truncate max-w-[140px] block">
                      {tag.digest}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs text-text-secondary">
                      {tag.os} / {tag.arch}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right hidden md:table-cell">
                    <span className="text-xs text-text-secondary">
                      {tag.size}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className="text-xs text-text-secondary"
                      title={formatDate(tag.pushedAt)}
                    >
                      {timeAgo(tag.pushedAt)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > 0 && (
        <p className="text-xs text-text-secondary">
          {filtered.length} {filtered.length === 1 ? "tag" : "tags"}
          {search && ` matching "${search}"`}
        </p>
      )}
    </div>
  );
}

export default function RepositoryDetailPage() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [copied, setCopied] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { id } = useParams<{ id: string }>();

  const [repo, setRepo] = useState<RepositoryDetail>(MOCK_REPO_DETAIL);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const cmd = `docker pull ${repo.fullName}:latest`;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const { data: apiRepo } = await getRepositoryById(Number(id));
        if (cancelled) return;

        setRepo((prev) => ({
          ...prev,
          id: apiRepo.id,
          name: apiRepo.name,
          fullName: apiRepo.fullName,
          description: apiRepo.description,
          visibility: apiRepo.visibility,
          ownerEmail: apiRepo.ownerEmail,
          isOfficial: apiRepo.isOfficial,
          starCount: apiRepo.starCount,
          createdAt: apiRepo.createdAt,
          updatedAt: apiRepo.updatedAt,
          // keep tags + tagDetails mocked
        }));
      } catch (err: any) {
        if (cancelled) return;
        setError(err?.response?.data?.message ?? "Failed to load repository.");
        setLoading(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleCopy = () => {
    navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-xl bg-bg-elevated border border-border
                          flex items-center justify-center text-lg font-bold
                          text-text-secondary select-none"
          >
            {repo.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-semibold text-text-primary">
                {repo.fullName}
              </h1>
              <span
                className={[
                  "inline-flex items-center gap-1 text-[10px] font-medium",
                  "px-2 py-0.5 rounded-full",
                  repo.visibility === "public"
                    ? "bg-success-secondary text-success"
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
            </div>
            <p className="text-sm text-text-secondary mt-1">
              {repo.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <FavoriteStar
            initialStarred={false}
            count={repo.starCount}
            onToggle={(starred) => console.log("Starred:", starred)}
          />
          <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil size={13} />
            Edit
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 size={13} />
            Delete
          </Button>
        </div>
      </div>

      {/* Load status */}
      {error && (
        <div
          className="px-4 py-3 rounded-lg bg-danger-muted border border-danger/20
                        text-xs text-danger"
        >
          {error}
        </div>
      )}
      {loading && !error && (
        <div className="mt-4">
          <Loader />
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-6 flex-wrap">
        <StatBadge
          icon={<Star size={13} />}
          value={String(repo.starCount)}
          label="stars"
        />
        <StatBadge
          icon={<Tag size={13} />}
          value={String(repo.tags.length)}
          label="tags"
        />
        <StatBadge
          icon={<Clock size={13} />}
          value={timeAgo(repo.updatedAt)}
          label="last push"
        />
        <StatBadge
          icon={<Calendar size={13} />}
          value={formatDate(repo.createdAt)}
          label="created"
        />
      </div>

      {/* Pull command */}
      <div
        className="flex items-center justify-between gap-3 px-4 py-3
                      rounded-lg bg-bg-base border border-border font-mono"
      >
        <span className="text-xs text-text-secondary truncate">{cmd}</span>
        <button
          onClick={handleCopy}
          className="p-1.5 rounded text-text-secondary hover:text-brand
                     hover:bg-bg-elevated transition-colors"
          title="Copy"
        >
          {copied ? (
            <Check size={13} className="text-success" />
          ) : (
            <Copy size={13} />
          )}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-col gap-5">
        <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

        {activeTab === "overview" && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-medium uppercase tracking-widest text-text-secondary">
                Recent tags
              </h2>
              <button
                onClick={() => setActiveTab("tags")}
                className="text-xs text-brand hover:underline"
              >
                View all
              </button>
            </div>
            <TagsTab tags={repo.tagDetails.slice(0, 3)} />
          </div>
        )}

        {activeTab === "tags" && <TagsTab tags={repo.tagDetails} />}
      </div>

      <EditRepositoryModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        onSave={() => setEditOpen(false)}
        repo={repo}
      />
      <DeleteRepositoryModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onDelete={() => navigate("/repositories")}
        repo={repo}
      />
    </div>
  );
}
