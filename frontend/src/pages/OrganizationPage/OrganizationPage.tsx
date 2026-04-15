import { Building2, Calendar } from "lucide-react";
import Tabs, { TabItem } from "@/components/Tabs/Tabs";
import { useCallback, useEffect, useRef, useState } from "react";

import Button from "@/components/Button/Button";
import EditOrganizationModal from "@/components/Modals/EditOrganizationModal/EditOrganizationModal";
import ErrorPage from "../ErrorPage/ErrorPage";
import MembersTab from "./components/MemberTab/MemberTab";
import { RepositoriesTab } from "./components/RepositoriesTab/RepositoriesTab";
import StatCard from "@/components/Cards/StatCard/StatCard";
import { Tag } from "@/components/Tag/Tag";
import { TeamsTab } from "./components/TeamTab/TeamTab";
import { useAuth } from "../../context/AppContext";
import { useOrganization } from "@/services/organizations/useOrganization/useOrganization";
import { useOrganizationRepositories } from "@/services/organizations/useOrganizationRepositories/useOrganizationRepositories";
import { useParams } from "react-router-dom";

type Tab = "repositories" | "teams" | "members";

export default function OrganizationDetailPage() {
  const [activeTab, setActiveTab] = useState<Tab>("repositories");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { orgName } = useParams<{ orgName: string }>();
  const { token } = useAuth();

  const { organization, loading, error, refetch } = useOrganization(
    token || "",
    orgName || "",
  );

  const {
    repositories,
    loading: reposLoading,
    fetchRepos,
    searchQuery: reposSearchQuery,
    setSearchQuery: setReposSearchQuery,
  } = useOrganizationRepositories(token || "", orgName);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialFetchDone = useRef(false);

  useEffect(() => {
    if (organization && !initialFetchDone.current) {
      fetchRepos("");
      initialFetchDone.current = true;
    }
  }, [organization]);

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

  const handleEditOrganization = async (data: {
    displayName: string;
    description: string;
    avatarUrl: string;
  }) => {
    // TODO: Implement API call to update organization
    console.log("Saving organization data:", data);
    // After successful save, refetch organization data
    await refetch();
  };

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
  const teamsCount = 0;

  const tabs: TabItem<Tab>[] = [
    { value: "repositories", label: "Repositories", badge: repositoriesCount },
    { value: "teams", label: "Teams", badge: teamsCount },
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
        return <Tag accentClass="success">Owner</Tag>;
      case "admin":
        return <Tag accentClass="info">Admin</Tag>;
      case "member":
        return <Tag accentClass="default">Member</Tag>;
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
                         flex items-center justify-center text-xl font-bold text-brand font-mono"
          >
            {organization.displayName?.slice(0, 2).toUpperCase() ||
              organization.name.slice(0, 2).toUpperCase()}
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

          {(organization.currentUserRole === "owner" ||
            organization.currentUserRole === "admin") && (
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsEditModalOpen(true)}
            >
              Edit organization
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <StatCard
            label="Members"
            value={organization?.memberCount.toString()}
          />
          <StatCard
            label="Repositories"
            value={organization?.repositoryCount.toString()}
          />
          <StatCard label="Teams" value={teamsCount.toString()} />
          <StatCard label="Role" value={organization?.currentUserRole} />
        </div>
      </div>

      {/* Tabs */}
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
          />
        )}
        {activeTab === "teams" && <TeamsTab />}
        {activeTab === "members" && <MembersTab />}
      </div>

      <EditOrganizationModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        organization={{
          displayName: organization.displayName || organization.name,
          description: organization.description || "",
          avatarUrl: organization.avatarUrl || "",
        }}
        onSave={handleEditOrganization}
      />
    </div>
  );
}
