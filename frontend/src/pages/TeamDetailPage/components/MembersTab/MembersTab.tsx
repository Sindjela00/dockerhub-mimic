import { useEffect, useRef, useState } from "react";

import AddTeamMemberModal from "@/components/Modals/AddTeamMemberModal/AddTeamMemberModal";
import { Avatar } from "@/components/Avatar/Avatar";
import Button from "@/components/Button/Button";
import Table from "@/components/Table/Table";
import { TeamMember } from "@/services/organizations/organizations.api";
import { Users } from "lucide-react";
import { formatDate } from "@/utils/formatDate";
import { getInitials } from "@/utils/getInitials";
import { useOrganizationMembers } from "@/services/organizations/useOrganizationMembers/useOrganizationMembers";
import { useTeamMembers } from "@/services/organizations/useTeamMembers/useTeamMembers";

export function MembersTab({
  orgName,
  teamName,
}: {
  orgName: string;
  teamName: string;
}) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const {
    members,
    total,
    loading,
    error,
    fetchMembers,
    addMember,
    removeMember,
  } = useTeamMembers(orgName, teamName);

  const { members: orgMembers, fetchMembers: fetchOrgMembers } =
    useOrganizationMembers(orgName);

  const initialFetchDone = useRef(false);
  useEffect(() => {
    if (!initialFetchDone.current) {
      fetchMembers();
      fetchOrgMembers("");
      initialFetchDone.current = true;
    }
  }, [fetchMembers, fetchOrgMembers]);

  const alreadyAddedIds = members.map((m) => m.userId);
  const availableMembers = orgMembers.filter(
    (m) => !alreadyAddedIds.includes(m.userId),
  );

  const columns = [
    {
      key: "member",
      header: "Member",
      render: (member: TeamMember) => (
        <div className="flex items-center gap-3">
          <Avatar
            initials={getInitials(member.username)}
            rounded="rounded-full"
          />
          <div>
            <span className="text-sm font-semibold text-text-primary">
              {member.username}
            </span>
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
      hideBelow: "sm" as const,
      render: (member: TeamMember) => (
        <span className="text-xs text-text-secondary">{member.email}</span>
      ),
    },
    {
      key: "username",
      header: "Username",
      hideBelow: "md" as const,
      render: (member: TeamMember) => (
        <span className="text-xs text-text-secondary font-mono">
          @{member.username}
        </span>
      ),
    },
    {
      key: "addedAt",
      header: "Joined",
      hideBelow: "md" as const,
      render: (member: TeamMember) => (
        <span className="text-xs text-text-muted">
          {formatDate(member.addedAt)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right" as const,
      render: (member: TeamMember) => (
        <Button
          size="sm"
          variant="danger"
          onClick={(e) => {
            e.stopPropagation();
            removeMember(Number(member.userId));
          }}
        >
          Remove
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-text-muted">{total} members</p>
        <Button
          variant="primary"
          size="md"
          onClick={() => setIsAddModalOpen(true)}
        >
          <Users size={14} /> Add member
        </Button>
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
          data={members}
          rowKey={(m) => String(m.userId)}
          emptyText="No members found."
        />
      )}

      <AddTeamMemberModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={addMember}
        availableMembers={availableMembers}
      />
    </div>
  );
}
