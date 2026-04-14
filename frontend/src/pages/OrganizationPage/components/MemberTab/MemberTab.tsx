import { Plus, Search } from "lucide-react";

import Button from "@/components/Button/Button";
import InputField from "@/components/InputField/InputField";
import { MEMBERS } from "../../mock/mock";
import Table from "@/components/Table/Table";
import { useState } from "react";

interface Column<T> {
  key: string;
  header: string;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  hideBelow?: "sm" | "md" | "lg";
  width?: string;
  render: (item: T) => React.ReactNode;
}

function MembersTab() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<"all" | "owner" | "member">("all");
  const [sortKey, setSortKey] = useState<string>("displayName");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const filtered = MEMBERS.filter((m) => {
    const matchesSearch =
      m.displayName.toLowerCase().includes(search.toLowerCase()) ||
      m.login.toLowerCase().includes(search.toLowerCase());
    const matchesRole = role === "all" || m.role.toLowerCase().startsWith(role);
    return matchesSearch && matchesRole;
  });

  const sorted = [...filtered].sort((a, b) => {
    let aVal: any = a[sortKey as keyof typeof a];
    let bVal: any = b[sortKey as keyof typeof b];

    if (sortKey === "displayName") {
      aVal = a.displayName.toLowerCase();
      bVal = b.displayName.toLowerCase();
    }
    if (sortKey === "login") {
      aVal = a.login.toLowerCase();
      bVal = b.login.toLowerCase();
    }
    if (sortKey === "role") {
      aVal = a.role.toLowerCase();
      bVal = b.role.toLowerCase();
    }

    if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const handleSort = (key: string, direction: "asc" | "desc") => {
    setSortKey(key);
    setSortDir(direction);
  };

  const ACCENT_MAP: Record<
    string,
    { bg: string; text: string; border: string }
  > = {
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

  function Avatar({
    initials,
    accentClass,
    size = "md",
  }: {
    initials: string;
    accentClass: string;
    size?: "sm" | "md" | "lg";
  }) {
    const accent = ACCENT_MAP[accentClass] ?? ACCENT_MAP.brand;
    const sizeClasses = {
      sm: "w-7 h-7 text-[11px]",
      md: "w-9 h-9 text-xs",
      lg: "w-11 h-11 text-sm",
    }[size];

    return (
      <div
        className={`${sizeClasses} min-w-fit rounded-full flex items-center justify-center font-bold font-mono
          ${accent.bg} ${accent.text} border ${accent.border}`}
      >
        {initials}
      </div>
    );
  }

  const columns: Column<(typeof MEMBERS)[0]>[] = [
    {
      key: "avatar",
      header: "Member",
      align: "left",
      sortable: false,
      render: (member) => (
        <div className="flex items-center gap-3">
          <Avatar
            initials={member.initials}
            accentClass={member.accentClass}
            size="md"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-text-primary">
                {member.displayName}
              </span>
              <Tag
                accentClass={
                  member.role === "Owner"
                    ? "warning"
                    : member.role === "Billing Manager"
                      ? "info"
                      : "brand"
                }
              >
                {member.role}
              </Tag>
            </div>
            <p className="text-[11px] text-text-muted font-mono mt-0.5">
              @{member.login}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "teams",
      header: "Teams",
      align: "left",
      sortable: false,
      hideBelow: "sm",
      render: (member) => (
        <div className="flex items-center gap-1 flex-wrap">
          {member.teams.slice(0, 3).map((t) => (
            <span
              key={t}
              className="text-[10px] px-2 py-0.5 rounded-full bg-bg-elevated border border-border text-text-muted font-mono"
            >
              {t}
            </span>
          ))}
          {member.teams.length > 3 && (
            <span className="text-[10px] text-text-muted">
              +{member.teams.length - 3}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "login",
      header: "Username",
      align: "left",
      sortable: true,
      hideBelow: "md",
      render: (member) => (
        <span className="text-xs text-text-secondary font-mono">
          @{member.login}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 justify-between flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <InputField
            value={search}
            onChange={(value) => setSearch(value)}
            placeholder="Find a member..."
            startIcon={<Search size={13} className="text-text-muted" />}
            className="w-full"
          />
        </div>
        <Button variant="primary" size="md">
          <Plus size={15} /> Invite member
        </Button>
      </div>

      <Table
        columns={columns}
        data={sorted}
        rowKey={(member) => member.login}
        onRowClick={(member) =>
          console.log("Clicked member", member.displayName)
        }
        emptyText="No members found."
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={handleSort}
      />
    </div>
  );
}

export default MembersTab;
