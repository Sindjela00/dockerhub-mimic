import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Calendar,
  Check,
  Clock,
  Copy,
  Globe,
  Lock,
  Pencil,
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

import { TABS, type Tab } from "./types/types";
import { useTags } from "@/services/repositories/useTags/useTags";
import { useRepository } from "@/services/repositories/useRepository/useRepository";
import { timeAgo } from "@/utils/timeAgo";
import { formatDate } from "@/utils/formatDate";
import TagsTab from "./components/TabsContent/TabsContent";
import { useStarRepository } from "@/services/repositories/useStarRepository/useStarRepository";
import ErrorPage from "../ErrorPage/ErrorPage";
import { useAuth } from "@/context/AppContext";

export default function RepositoryDetailPage() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const { id } = useParams<{ id: string }>();

  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [copied, setCopied] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { repo, loading, error, setRepo } = useRepository(Number(id));
  const {
    tags,
    total: tagsTotal,
    page,
    pageSize,
    search,
    sortBy,
    sortDir,
    setSearch,
    setSortBy,
    setSortDir,
    changePage,
    loading: tagsLoading,
    error: tagsError,
    deleteTags,
  } = useTags(Number(id));

  const {
    starred,
    count: starCount,
    loading: starLoading,
    toggle: toggleStar,
  } = useStarRepository(
    Number(id),
    repo?.isStarredByCurrentUser ?? false,
    repo?.starCount ?? 0,
  );

  if (loading) {
    return (
      <div className="page-wrapper items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (error || !repo) {
    return (
      <ErrorPage
        title="Repository not found"
        message={
          error ||
          "This repository does not exist or you don't have access to it."
        }
        onBack={() => navigate("/repositories")}
      />
    );
  }

  const cmd = `docker pull ${repo.fullName}:latest`;

  const handleCopy = () => {
    navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sharedTagsTabProps = {
    total: tagsTotal,
    page,
    pageSize,
    search,
    sortBy,
    sortDir,
    onSearch: setSearch,
    onSortBy: setSortBy,
    onSortDir: setSortDir,
    onPage: changePage,
    onDeleteTags: deleteTags,
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
            starred={starred}
            count={starCount}
            loading={starLoading}
            onToggle={toggleStar}
          />
          <div
            className={`${role === "Admin" ? "" : "hidden"} flex items-center gap-2`}
          >
            <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil size={13} /> Edit
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 size={13} /> Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6 flex-wrap">
        <StatBadge
          icon={<Star size={13} />}
          value={String(starCount)}
          label="stars"
        />
        <StatBadge
          icon={<Tag size={13} />}
          value={String(tagsTotal)}
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
      <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-bg-base border border-border font-mono">
        <span className="text-xs text-text-secondary truncate">{cmd}</span>
        <button
          onClick={handleCopy}
          className="p-1.5 rounded text-text-secondary hover:text-brand hover:bg-bg-elevated transition-colors"
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
            <TagsTab
              tags={tags}
              loading={tagsLoading}
              error={tagsError}
              {...sharedTagsTabProps}
            />
          </div>
        )}
        {activeTab === "tags" && (
          <TagsTab
            tags={tagsLoading ? [] : tags}
            loading={tagsLoading}
            error={tagsError}
            {...sharedTagsTabProps}
          />
        )}
      </div>

      <EditRepositoryModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        onSave={(updatedRepo) => {
          setRepo((prev) => (prev ? { ...prev, ...updatedRepo } : prev));
          setEditOpen(false);
        }}
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
