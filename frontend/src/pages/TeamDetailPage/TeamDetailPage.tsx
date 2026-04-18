import {
  Building2,
  Calendar,
  GitBranch,
  Pencil,
  Trash2,
  Users,
} from "lucide-react";
import Tabs, { TabItem } from "@/components/Tabs/Tabs";

import { Avatar } from "@/components/Avatar/Avatar";
import Button from "@/components/Button/Button";
import DeleteConfirmModal from "@/components/Modals/DeleteConfirmModal/DeleteConfirmModal";
import EditTeamModal from "@/components/Modals/EditTeamModal/EditTeamModal";
import ErrorPage from "../ErrorPage/ErrorPage";
import StatCard from "@/components/Cards/StatCard/StatCard";
import { TagComponent } from "@/components/Tag/Tag";
import { formatDate } from "@/utils/formatDate";
import { getInitials } from "@/utils/getInitials";
import { useAuth } from "@/context/AppContext";
import { useParams } from "react-router-dom";
import { useState } from "react";
import { useTeam } from "@/services/organizations/useTeam/UseTeam";

type Tab = "members" | "repositories";

const MOCK_MEMBERS = [
  {
    userId: 1,
    username: "admin",
    email: "admin@dockerhubmimic.local",
    role: "owner",
    addedAt: "2026-04-14T18:09:46.753658Z",
  },
  {
    userId: 2,
    username: "jdoe",
    email: "jdoe@example.com",
    role: "admin",
    addedAt: "2026-04-15T10:00:00.000000Z",
  },
  {
    userId: 3,
    username: "mkovac",
    email: "mkovac@example.com",
    role: "member",
    addedAt: "2026-04-16T09:30:00.000000Z",
  },
];

const MOCK_REPOSITORIES = [
  {
    id: 1,
    name: "ui-components",
    description:
      "Shared React component library used across all frontend projects.",
    visibility: "public",
    forksCount: 12,
    updatedAt: "2026-04-16T10:00:00.000000Z",
  },
  {
    id: 2,
    name: "design-tokens",
    description: "Design system tokens and theme configuration.",
    visibility: "private",
    forksCount: 4,
    updatedAt: "2026-04-13T10:00:00.000000Z",
  },
];

const ACCENT_MAP: Record<string, { bg: string; text: string; border: string }> =
  {
    brand: {
      bg: "bg-brand-muted",
      text: "text-brand",
      border: "border-brand/20",
    },
    info: { bg: "bg-info-muted", text: "text-info", border: "border-info/20" },
    warning: {
      bg: "bg-warning-muted",
      text: "text-warning",
      border: "border-warning/20",
    },
    success: {
      bg: "bg-success-muted",
      text: "text-success",
      border: "border-success/20",
    },
    error: {
      bg: "bg-error-muted",
      text: "text-error",
      border: "border-error/20",
    },
  };

function Tag({
  children,
  accentClass,
}: {
  children: React.ReactNode;
  accentClass: string;
}) {
  const accent = ACCENT_MAP[accentClass] ?? ACCENT_MAP.brand;
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full
        ${accent.bg} ${accent.text} border ${accent.border}`}
    >
      {children}
    </span>
  );
}

function getRoleAccent(role: string): "warning" | "info" | "brand" {
  switch (role.toLowerCase()) {
    case "owner":
      return "warning";
    case "admin":
      return "info";
    case "member":
      return "brand";
    default:
      return "brand";
  }
}

function MembersTab({ memberCount }: { memberCount: number }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-text-muted">{memberCount} members</p>
        <Button variant="primary" size="md">
          <Users size={14} /> Add member
        </Button>
      </div>

      <div className="border border-border rounded-xl overflow-hidden">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-bg-elevated border-b border-border">
              <th className="text-left px-4 py-2.5 text-xs font-medium text-text-muted">
                Member
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-text-muted hidden sm:table-cell">
                Email
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-text-muted hidden md:table-cell">
                Username
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-text-muted hidden md:table-cell">
                Joined
              </th>
            </tr>
          </thead>
          <tbody>
            {MOCK_MEMBERS.map((member, i) => (
              <tr
                key={member.userId}
                className={`hover:bg-bg-elevated transition-colors cursor-pointer ${
                  i < MOCK_MEMBERS.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar
                      initials={getInitials(member.username)}
                      rounded="rounded-full"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-text-primary">
                          {member.username}
                        </span>
                        <TagComponent accentClass={getRoleAccent(member.role)}>
                          {member.role}
                        </TagComponent>
                      </div>
                      <p className="text-[11px] text-text-muted font-mono mt-0.5">
                        {member.email}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span className="text-xs text-text-secondary">
                    {member.email}
                  </span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="text-xs text-text-secondary font-mono">
                    @{member.username}
                  </span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="text-xs text-text-muted">
                    {formatDate(member.addedAt)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RepositoriesTab({ repositoryCount }: { repositoryCount: number }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-text-muted">
          {repositoryCount} repositories
        </p>
        <Button variant="primary" size="md">
          <GitBranch size={14} /> Add repository
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {MOCK_REPOSITORIES.map((repo) => (
          <div
            key={repo.id}
            className="bg-bg-surface border border-border rounded-xl p-4 hover:border-brand/40
                       hover:bg-bg-elevated transition-colors cursor-pointer flex flex-col gap-2"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-sm font-semibold text-brand font-mono">
                {repo.name}
              </span>
              <TagComponent
                accentClass={
                  repo.visibility === "public" ? "success" : "danger"
                }
              >
                {repo.visibility}
              </TagComponent>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed">
              {repo.description || "No description provided"}
            </p>

            <div className="flex items-center gap-4 mt-auto pt-1">
              <span className="flex items-center gap-1.5 text-[11px] text-text-muted">
                <GitBranch size={11} />
                {repo.forksCount} forks
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-text-muted">
                <Calendar size={11} />
                Updated {formatDate(repo.updatedAt)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TeamDetailPage() {
  const [activeTab, setActiveTab] = useState<Tab>("members");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const { orgName, teamName } = useParams<{
    orgName: string;
    teamName: string;
  }>();
  const { token } = useAuth();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const {
    team,
    loading,
    error,
    updateTeam,
    deleteTeam,
    deleteLoading,
    deleteError,
  } = useTeam(token || "", orgName || "", teamName || "");

  if (!orgName || !teamName) {
    return (
      <div className="page-wrapper">
        <div className="bg-error-muted border border-error text-error p-4 rounded-lg">
          Missing organization or team name
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page-wrapper flex items-center justify-center min-h-[400px]">
        <div className="text-text-secondary">Loading team...</div>
      </div>
    );
  }

  if (error) return <ErrorPage />;
  if (!team) return null; // ovo već imaš

  const tabs: TabItem<Tab>[] = [
    { value: "members", label: "Members", badge: team.memberCount ?? 0 },
    {
      value: "repositories",
      label: "Repositories",
      badge: team.repositoryCount ?? 0,
    },
  ];

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="flex flex-col gap-5 pb-6 border-b border-border">
        <div className="flex items-start gap-4">
          <div
            className="w-14 h-14 min-w-[56px] rounded-2xl bg-info-muted border border-info/30
                       flex items-center justify-center text-xl font-bold text-info font-mono"
          >
            {(team?.name ?? "??").slice(0, 2).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                <Users size={18} className="text-info" />
                {team.name}
              </h1>
              <TagComponent accentClass="success">active</TagComponent>
            </div>

            <p className="text-[11px] text-text-muted font-mono mt-0.5">
              {team.organizationName} / {team.name}
            </p>

            <p className="text-sm text-text-secondary mt-1.5 max-w-xl leading-relaxed">
              {team.description || "No description provided"}
            </p>

            <div className="flex items-center gap-4 mt-2 flex-wrap">
              <span className="flex items-center gap-1.5 text-xs text-text-muted">
                <Calendar size={12} />
                Created {formatDate(team.createdAt)}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-text-muted">
                <Building2 size={12} />
                {team.organizationName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditModalOpen(true)}
            >
              <Pencil size={13} /> Edit team
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setIsDeleteModalOpen(true)}
            >
              <Trash2 size={13} /> Delete team
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <StatCard
            label="Members"
            value={team.memberCount?.toString() ?? "0"}
          />
          <StatCard
            label="Repositories"
            value={team.repositoryCount?.toString() ?? "0"}
          />
          <StatCard
            label="Updated"
            value={team.updatedAt ? formatDate(team.updatedAt) : "-"}
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      <div className="mt-4">
        {activeTab === "members" && (
          <MembersTab memberCount={team.memberCount} />
        )}
        {activeTab === "repositories" && (
          <RepositoriesTab repositoryCount={team.repositoryCount} />
        )}
      </div>

      {team && (
        <EditTeamModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          initialValues={{
            name: team.name,
            description: team.description || "",
          }}
          onSave={updateTeam}
        />
      )}

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onDelete={deleteTeam}
        title="Delete team"
        entityName={team.name}
        description={
          <>
            Deleting{" "}
            <span className="text-text-primary font-medium">{team.name}</span>{" "}
            will permanently remove the team and all its memberships.
          </>
        }
        loading={deleteLoading}
        error={deleteError}
      />
    </div>
  );
}
