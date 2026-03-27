import { useEffect, useState } from "react";
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

import { getRepositoryById } from "@/services/repositories/repositories.api";
import { MOCK_REPO_DETAIL } from "./types/mock";
import { TABS, type RepositoryDetail, type Tab } from "./types/types";
import { useTags } from "@/services/repositories/useTags/useTags";
import { timeAgo } from "@/utils/timeAgo";
import { formatDate } from "@/utils/formatDate";
import TagsTab from "./components/TabsContent/TabsContent";

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

  const {
    tags,
    total: tagsTotal,
    pullCount,
    loading: tagsLoading,
    error: tagsError,
  } = useTags(Number(id));

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
            {activeTab === "overview" && (
              <TagsTab tags={tagsLoading ? [] : tags.slice(0, 3)} />
            )}
          </div>
        )}
        {activeTab === "tags" && <TagsTab tags={tags} />}{" "}
      </div>

      <EditRepositoryModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        onSave={(updatedRepo) => {
          setRepo((prev) => ({ ...prev, ...updatedRepo }));
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
