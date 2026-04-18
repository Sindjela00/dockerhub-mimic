import { useEffect, useRef, useState } from "react";

import AddTeamMemberModal from "@/components/Modals/AddTeamMemberModal/AddTeamMemberModal";
import { Avatar } from "@/components/Avatar/Avatar";
import Button from "@/components/Button/Button";
import { Users } from "lucide-react";
import { formatDate } from "@/utils/formatDate";
import { getInitials } from "@/utils/getInitials";
import { useOrganizationMembers } from "@/services/organizations/useOrganizationMembers/useOrganizationMembers";
import { useTeamMembers } from "@/services/organizations/useTeamMembers/useTeamMembers";

export function MembersTab({
  orgName,
  teamName,
  token,
}: {
  orgName: string;
  teamName: string;
  token: string;
}) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const { members, total, loading, error, fetchMembers, addMember } =
    useTeamMembers(token, orgName, teamName);

  const { members: orgMembers, fetchMembers: fetchOrgMembers } =
    useOrganizationMembers(token, orgName);

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
              {members.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-12 text-center text-sm text-text-muted"
                  >
                    No members found.
                  </td>
                </tr>
              ) : (
                members.map((member, i) => (
                  <tr
                    key={member.userId}
                    className={`hover:bg-bg-elevated transition-colors cursor-pointer ${
                      i < members.length - 1 ? "border-b border-border" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
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
                ))
              )}
            </tbody>
          </table>
        </div>
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
