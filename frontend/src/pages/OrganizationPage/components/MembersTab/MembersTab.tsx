import {
  Organization,
  OrganizationMember,
} from "@/services/organizations/organizations.api";
import { Plus, Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Avatar } from "@/components/Avatar/Avatar";
import Button from "@/components/Button/Button";
import InviteMemberModal from "@/components/Modals/InviteMembersModal/InviteMembersModal";
import Table from "@/components/Table/Table";
import { TagComponent } from "@/components/Tag/Tag";
import { getInitials } from "@/utils/getInitials";
import { getRoleAccent } from "@/utils/accentStyle";
import { useOrganizationMembers } from "@/services/organizations/useOrganizationMembers/useOrganizationMembers";

interface Column<T> {
  key: string;
  header: string;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  hideBelow?: "sm" | "md" | "lg";
  width?: string;
  render: (item: T) => React.ReactNode;
}

interface MembersTabProps {
  orgName: string;
  token: string;
  organization: Organization;
}

function MembersTab({ orgName, token, organization }: MembersTabProps) {
  const [sortKey, setSortKey] = useState<string>("username");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const {
    members,
    total,
    loading,
    error,
    fetchMembers,
    inviteMember,
    setSearchQuery,
  } = useOrganizationMembers(token, orgName);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialFetchDone = useRef(false);

  useEffect(() => {
    if (!initialFetchDone.current) {
      fetchMembers("");
      initialFetchDone.current = true;
    }
  }, [fetchMembers]);

  const handleSort = (key: string, direction: "asc" | "desc") => {
    setSortKey(key);
    setSortDir(direction);
  };

  const sorted = [...members].sort((a, b) => {
    let aVal = "";
    let bVal = "";

    if (sortKey === "username") {
      aVal = a.username.toLowerCase();
      bVal = b.username.toLowerCase();
    } else if (sortKey === "role") {
      aVal = a.role.toLowerCase();
      bVal = b.role.toLowerCase();
    } else if (sortKey === "addedAt") {
      aVal = a.addedAt;
      bVal = b.addedAt;
    }

    if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const columns: Column<OrganizationMember>[] = [
    {
      key: "member",
      header: "Member",
      align: "left",
      sortable: false,
      render: (member) => (
        <div className="flex items-center gap-3">
          <Avatar
            initials={getInitials(member.username)}
            size="md"
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
      ),
    },
    {
      key: "email",
      header: "Email",
      align: "left",
      sortable: false,
      hideBelow: "sm",
      render: (member) => (
        <span className="text-xs text-text-secondary">{member.email}</span>
      ),
    },
    {
      key: "username",
      header: "Username",
      align: "left",
      sortable: true,
      hideBelow: "md",
      render: (member) => (
        <span className="text-xs text-text-secondary font-mono">
          @{member.username}
        </span>
      ),
    },
    {
      key: "addedAt",
      header: "Joined",
      align: "left",
      sortable: true,
      hideBelow: "md",
      render: (member) => (
        <span className="text-xs text-text-muted">
          {new Date(member.addedAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 justify-between flex-wrap">
        <p className="text-xs text-text-muted">
          {members.length} of {total} members
        </p>
        <div
          className={
            organization.currentUserRole === "owner" ||
            organization.currentUserRole === "admin"
              ? "block"
              : "hidden"
          }
        >
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsInviteModalOpen(true)}
          >
            <Plus size={15} /> Invite member
          </Button>
        </div>
      </div>

      {loading && (
        <div className="text-sm text-text-secondary py-8 text-center">
          Loading members...
        </div>
      )}

      {error && !loading && (
        <div className="bg-error-muted border border-error text-error p-4 rounded-lg text-sm">
          {error}
        </div>
      )}

      {!loading && !error && (
        <Table
          columns={columns}
          data={sorted}
          rowKey={(member) => member.username}
          onRowClick={(member) =>
            console.log("Clicked member", member.username)
          }
          emptyText="No members found."
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleSort}
        />
      )}

      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSave={inviteMember}
      />
    </div>
  );
}

export default MembersTab;
