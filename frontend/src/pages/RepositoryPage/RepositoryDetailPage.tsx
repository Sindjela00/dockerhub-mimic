import {
  Calendar,
  Check,
  Clock,
  Copy,
  Download,
  Globe,
  Lock,
  Pencil,
  Star,
  Tag,
  Trash2,
} from "lucide-react";
import { TABS, Tab, TagDetail } from "./types/types";

import Button from "@/components/Button/Button";
import DeleteRepositoryModal from "../../components/Modals/DeleteRepositoryModal/DeleteRepositoryModal";
import EditRepositoryModal from "../../components/Modals/EditRepositoryModal/EditRepositoryModal";
import FavoriteStar from "@/components/FavoriteStar/FavoriteStar";
import { MOCK_REPO_DETAIL } from "./types/mock";
import { StatBadge } from "./components/StatBadge/StatBadge";
import Tabs from "@/components/Tabs/Tabs";
import TagsTable from "./components/TahsTable/TagsTable";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

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

export default function RepositoryDetailPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [copied, setCopied] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const repo = MOCK_REPO_DETAIL;

  const cmd = `docker pull ${repo.namespace}/${repo.name}:latest`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
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
                {repo.namespace}/{repo.name}
              </h1>
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
            </div>
            <p className="text-sm text-text-secondary mt-1">
              {repo.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <FavoriteStar
            initialStarred={false}
            count={repo.stars}
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

      <div className="flex items-center gap-6 flex-wrap">
        <StatBadge
          icon={<Download size={13} />}
          value={formatCount(repo.pullCount)}
          label="pulls"
        />
        <StatBadge
          icon={<Star size={13} />}
          value={String(repo.stars)}
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
        <span className="text-xs text-text-primary truncate">{cmd}</span>
        <button
          onClick={() => {
            handleCopy(cmd);
          }}
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
          <div className="flex flex-col gap-6">
            {/* README */}
            {repo.readme ? (
              <div className="flex flex-col gap-3">
                <h2 className="text-xs font-medium uppercase tracking-widest text-text-secondary">
                  Readme
                </h2>
                <div className="px-6 py-5 rounded-xl border border-border bg-bg-surface">
                  <pre
                    className="text-sm text-text-primary font-mono leading-relaxed
                                  whitespace-pre-wrap overflow-x-auto"
                  >
                    {repo.readme}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center py-12 text-center">
                <p className="text-sm text-text-secondary">
                  No readme available.
                </p>
              </div>
            )}

            {/* Recent tags */}
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
              <TagsTable tags={repo.tagDetails.slice(0, 3)} />
            </div>
          </div>
        )}

        {activeTab === "tags" && (
          <div className="flex flex-col gap-3">
            <h2 className="text-xs font-medium uppercase tracking-widest text-text-secondary">
              All tags ({repo.tagDetails.length})
            </h2>
            <TagsTable tags={repo.tagDetails} />
          </div>
        )}
      </div>

      <EditRepositoryModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        onSave={(updated) => console.log("Save:", updated)}
        repo={repo}
      />

      <DeleteRepositoryModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onDelete={(id) => {
          console.log("Delete:", id);
          navigate("/repositories");
        }}
        repo={repo}
      />
    </div>
  );
}
