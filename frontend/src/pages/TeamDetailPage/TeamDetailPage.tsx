import { Building2, Calendar, Pencil, Trash2, Users } from "lucide-react";
import Tabs, { TabItem } from "@/components/Tabs/Tabs";

import Button from "@/components/Button/Button";
import DeleteConfirmModal from "@/components/Modals/DeleteConfirmModal/DeleteConfirmModal";
import EditTeamModal from "@/components/Modals/EditTeamModal/EditTeamModal";
import ErrorPage from "../ErrorPage/ErrorPage";
import { MembersTab } from "./components/MembersTab";
import { RepositoriesTab } from "./components/RepositoriesTab";
import StatCard from "@/components/Cards/StatCard/StatCard";
import { TagComponent } from "@/components/Tag/Tag";
import { formatDate } from "@/utils/formatDate";
import { useAuth } from "@/context/AppContext";
import { useParams } from "react-router-dom";
import { useState } from "react";
import { useTeam } from "@/services/organizations/useTeam/UseTeam";

type Tab = "members" | "repositories";

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

      <div>
        {activeTab === "members" && (
          <MembersTab
            orgName={orgName}
            teamName={teamName}
            token={token || ""}
          />
        )}
        {activeTab === "repositories" && (
          <RepositoriesTab
            orgName={orgName}
            teamName={teamName}
            token={token || ""}
          />
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
