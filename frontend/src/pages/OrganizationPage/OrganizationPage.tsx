import { Building2, Calendar, Globe, MapPin } from "lucide-react";
import { MEMBERS, ORG, REPOS, STATS, TEAMS } from "./mock/mock";
import Tabs, { TabItem } from "@/components/Tabs/Tabs";

import Button from "@/components/Button/Button";
import MembersTab from "./components/MemberTab/MemberTab";
import { OverviewTab } from "./components/OverviewTab/OverviewTab";
import { RepositoriesTab } from "./components/RepositoriesTab/RepositoriesTab";
import StatCard from "@/components/Cards/StatCard/StatCard";
import { Tag } from "@/components/Tag/Tag";
import { TeamsTab } from "./components/TeamTab/TeamTab";
import { useState } from "react";

type Tab = "overview" | "repositories" | "teams" | "members";

export default function OrganizationDetailPage() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const tabs: TabItem<Tab>[] = [
    { value: "overview", label: "Overview" },
    { value: "repositories", label: "Repositories", badge: REPOS.length },
    { value: "teams", label: "Teams", badge: TEAMS.length },
    { value: "members", label: "Members", badge: MEMBERS.length },
  ];

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="flex flex-col gap-5 pb-6 border-b border-border">
        <div className="flex items-start gap-4">
          <div
            className="w-14 h-14 min-w-[56px] rounded-2xl bg-brand-muted border border-brand/30
                         flex items-center justify-center text-xl font-bold text-brand font-mono"
          >
            AC
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                <Building2 size={18} className="text-brand" />
                {ORG.displayName}
              </h1>
              <Tag accentClass="success">Active</Tag>
              <Tag accentClass="info">{ORG.plan}</Tag>
            </div>
            <p className="text-[11px] text-text-muted font-mono mt-0.5">
              {ORG.name}
            </p>
            <p className="text-sm text-text-secondary mt-1.5 max-w-xl leading-relaxed">
              {ORG.description}
            </p>

            <div className="flex items-center gap-4 mt-2 flex-wrap">
              <span className="flex items-center gap-1.5 text-xs text-text-muted">
                <MapPin size={12} />
                {ORG.location}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-text-muted">
                <Globe size={12} />
                <a
                  href={`https://${ORG.website}`}
                  className="text-brand hover:underline"
                >
                  {ORG.website}
                </a>
              </span>
              <span className="flex items-center gap-1.5 text-xs text-text-muted">
                <Calendar size={12} />
                Member since {ORG.createdAt}
              </span>
            </div>
          </div>

          <Button variant="primary" size="md">
            Edit organization
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {STATS.map((stat) => (
            <StatCard
              key={stat.label}
              label={stat.label}
              value={stat.value.toString()}
            />
          ))}
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {/* Tab content */}
      <div className="mt-4">
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "repositories" && <RepositoriesTab />}
        {activeTab === "teams" && <TeamsTab />}
        {activeTab === "members" && <MembersTab />}
      </div>
    </div>
  );
}
