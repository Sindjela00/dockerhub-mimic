import { Building2, Calendar, Pencil, Trash2 } from "lucide-react";
import Tabs, { TabItem } from "@/components/Tabs/Tabs";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Button from "@/components/Button/Button";
import DeleteConfirmModal from "@/components/Modals/DeleteConfirmModal/DeleteConfirmModal";
import EditOrganizationModal from "@/components/Modals/EditOrganizationModal/EditOrganizationModal";
import ErrorPage from "../ErrorPage/ErrorPage";
import MembersTab from "./components/MembersTab/MembersTab";
import { RepositoriesTab } from "./components/RepositoriesTab/RepositoriesTab";
import { Repository } from "@/services/repositories/repositories.api";
import StatCard from "@/components/Cards/StatCard/StatCard";
import { TagComponent } from "@/components/Tag/Tag";
import { TeamsTab } from "./components/TeamTab/TeamTab";
import { useAuth } from "@/context/AppContext";
import { isAdminRole } from "@/context/types/types";
import { useOrganization } from "@/services/organizations/useOrganization/useOrganization";
import { useOrganizationRepositories } from "@/services/organizations/useOrganizationRepositories/useOrganizationRepositories";
import { useOrgRole } from "@/services/organizations/useOrgRole/useOrgRole";

type Tab = "repositories" | "teams" | "members";

export default function OrganizationDetailPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("repositories");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const { orgName } = useParams<{ orgName: string }>();

  const {
    organization,
    loading,
    error,
    remove: deleteOrganization,
    deleteLoading,
    deleteError,
    update: updateOrganization,
    updateLoading,
    updateError,
  } = useOrganization(orgName || "");

  const {
    repositories,
    loading: reposLoading,
    fetchRepos,
    searchQuery: reposSearchQuery,
    setSearchQuery: setReposSearchQuery,
  } = useOrganizationRepositories(orgName);

  const { isOwner, isPrivileged } = useOrgRole(organization);
  const { role } = useAuth();
  const canDelete = isOwner || isAdminRole(role);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialFetchDone = useRef(false);

  useEffect(() => {
    setAvatarFailed(false);
  }, [organization?.avatarUrl]);

  useEffect(() => {
    if (organization && !initialFetchDone.current) {
      fetchRepos("");
      initialFetchDone.current = true;
    }
  }, [organization]);

  const handleRepoClick = (repo: Repository) =>
    navigate(`/repositories/${repo.id}`);

  const handleSearchChange = useCallback(
    (value: string) => {
      setReposSearchQuery(value);

      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(() => {
        fetchRepos(value);
      }, 300);
    },
    [fetchRepos, setReposSearchQuery],
  );

  const handleRepoCreated = useCallback(() => {
    fetchRepos(reposSearchQuery);
  }, [fetchRepos, reposSearchQuery]);

  const handleEditOrganization = (data: {
    displayName: string;
    description: string;
    avatarFile: File | null;
    avatarUrl?: string;
  }) =>
    updateOrganization(
      {
        displayName: data.displayName,
        description: data.description,
        avatarUrl: data.avatarUrl,
      },
      data.avatarFile,
    );

  if (!orgName) {
    return (
      <div className="page-wrapper">
        <div className="bg-error-muted border border-error text-error p-4 rounded-lg">
          Organization name is missing
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page-wrapper flex items-center justify-center min-h-[400px]">
        <div className="text-text-secondary">Loading organization...</div>
      </div>
    );
  }

  if (error) {
    return <ErrorPage />;
  }

  if (!organization) {
    return null;
  }

  const repositoriesCount = organization.repositoryCount;
  const membersCount = organization.memberCount;

  const tabs: TabItem<Tab>[] = [
    { value: "repositories", label: "Repositories", badge: repositoriesCount },
    { value: "teams", label: "Teams" },
    { value: "members", label: "Members", badge: membersCount },
  ];

  const formattedDate = new Date(organization.createdAt).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );

  const getMemberRoleTag = () => {
    switch (organization.currentUserRole) {
      case "owner":
        return <TagComponent accentClass="success">Owner</TagComponent>;
      case "admin":
        return <TagComponent accentClass="info">Admin</TagComponent>;
      case "member":
        return <TagComponent accentClass="ghost">Member</TagComponent>;
      default:
        return null;
    }
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="flex flex-col gap-5 pb-6 border-b border-border">
        <div className="flex items-start gap-4">
          <div
            className="w-14 h-14 min-w-[56px] rounded-2xl bg-brand-muted border border-brand/30
                         flex items-center justify-center text-xl font-bold text-brand font-mono overflow-hidden"
          >
            {organization.avatarUrl && !avatarFailed ? (
              <img
                src={organization.avatarUrl}
                alt=""
                className="w-full h-full object-cover"
                onError={() => setAvatarFailed(true)}
              />
            ) : (
              organization.displayName?.slice(0, 2).toUpperCase() ||
              organization.name.slice(0, 2).toUpperCase()
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                <Building2 size={18} className="text-brand" />
                {organization.displayName || organization.name}
              </h1>
              {getMemberRoleTag()}
            </div>
            <p className="text-[11px] text-text-muted font-mono mt-0.5">
              @{organization.name}
            </p>
            <p className="text-sm text-text-secondary mt-1.5 max-w-xl leading-relaxed">
              {organization.description || "No description provided"}
            </p>

            <div className="flex items-center gap-4 mt-2 flex-wrap">
              <span className="flex items-center gap-1.5 text-xs text-text-muted">
                <Calendar size={12} />
                Created {formattedDate}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-text-muted">
                <Building2 size={12} />
                Owned by @{organization.ownerUsername}
              </span>
            </div>
          </div>

          {(isPrivileged || canDelete) && (
            <div className="flex items-center gap-2">
              {isPrivileged && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditModalOpen(true)}
                >
                  <Pencil size={13} /> Edit organization
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setIsDeleteModalOpen(true)}
                >
                  <Trash2 size={13} /> Delete
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <StatCard
            label="Members"
            value={organization?.memberCount.toString()}
          />
          <StatCard
            label="Repositories"
            value={organization?.repositoryCount.toString()}
          />
          <StatCard label="Role" value={organization?.currentUserRole} />
        </div>
      </div>

      {/* Tabs */}
      <div>
        <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

        <div className="mt-4">
          {activeTab === "repositories" && (
            <RepositoriesTab
              repos={repositories}
              loading={reposLoading}
              owner={{
                name: organization.name,
                displayName: organization.displayName || organization.name,
              }}
              onRepoCreated={handleRepoCreated}
              searchValue={reposSearchQuery}
              onSearchChange={handleSearchChange}
              organization={organization}
              onRepoClick={handleRepoClick}
            />
          )}
          {activeTab === "teams" && (
            <TeamsTab orgName={organization.name} organization={organization} />
          )}
          {activeTab === "members" && (
            <MembersTab
              orgName={organization.name}
              organization={organization}
            />
          )}
        </div>
      </div>

      <EditOrganizationModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        organization={{
          displayName: organization.displayName || organization.name,
          description: organization.description || "",
          avatarUrl: organization.avatarUrl || "",
        }}
        isOwner={isOwner}
        saving={updateLoading}
        error={updateError}
        onSave={handleEditOrganization}
      />
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onDelete={deleteOrganization}
        title="Delete organization"
        entityName={organization.name}
        description={
          <>
            Deleting{" "}
            <span className="text-text-primary font-medium">
              {organization.name}
            </span>{" "}
            will permanently remove all repositories, teams, and members.
          </>
        }
        loading={deleteLoading}
        error={deleteError}
      />
    </div>
  );
}
