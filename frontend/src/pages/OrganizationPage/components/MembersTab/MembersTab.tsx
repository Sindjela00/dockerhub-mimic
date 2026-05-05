import { Mail, Plus, Trash2, Users, X } from "lucide-react";
import {
  Organization,
  OrganizationInvite,
  OrganizationMember,
  removeOrganizationMember,
} from "@/services/organizations/organizations.api";
import { useEffect, useRef, useState } from "react";

import { Avatar } from "@/components/Avatar/Avatar";
import Button from "@/components/Button/Button";
import DeleteConfirmModal from "@/components/Modals/DeleteConfirmModal/DeleteConfirmModal";
import InviteMemberModal from "@/components/Modals/InviteMembersModal/InviteMembersModal";
import Table from "@/components/Table/Table";
import { TagComponent } from "@/components/Tag/Tag";
import { getInitials } from "@/utils/getInitials";
import { getRoleAccent } from "@/utils/accentStyle";
import { useOrganizationInvites } from "@/services/organizations/useOrganizationInvites/useOrganizationInvites";
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

type ActiveTab = "members" | "invites";

function MembersTab({ orgName, token, organization }: MembersTabProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("members");
  const [sortKey, setSortKey] = useState<string>("username");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // Member remove
  const [confirmMember, setConfirmMember] = useState<OrganizationMember | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Invite cancel
  const [confirmInvite, setConfirmInvite] = useState<OrganizationInvite | null>(
    null,
  );
  const [cancelingInvite, setCancelingInvite] = useState(false);
  const [cancelInviteError, setCancelInviteError] = useState<string | null>(
    null,
  );

  const isPrivileged =
    organization.currentUserRole === "owner" ||
    organization.currentUserRole === "admin";
  const isOwner = organization.currentUserRole === "owner";

  const { members, total, loading, error, fetchMembers, inviteMember } =
    useOrganizationMembers(token, orgName);

  const {
    invites,
    loading: invitesLoading,
    error: invitesError,
    fetchInvites,
    cancelInvite,
  } = useOrganizationInvites(token, orgName);

  const initialFetchDone = useRef(false);

  useEffect(() => {
    if (!initialFetchDone.current) {
      fetchMembers("");
      if (isOwner) fetchInvites();
      initialFetchDone.current = true;
    }
  }, [fetchMembers, fetchInvites, isOwner]);

  const handleRemoveMember = async () => {
    if (!confirmMember) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await removeOrganizationMember(orgName, confirmMember.userId, token);
      setConfirmMember(null);
      fetchMembers("");
    } catch {
      setDeleteError("Failed to remove member.");
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelInvite = async () => {
    if (!confirmInvite) return;
    setCancelingInvite(true);
    setCancelInviteError(null);
    try {
      await cancelInvite(confirmInvite.id);
      setConfirmInvite(null);
    } catch {
      setCancelInviteError("Failed to cancel invite.");
    } finally {
      setCancelingInvite(false);
    }
  };

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
    {
      key: "actions",
      header: "",
      align: "right",
      sortable: false,
      render: (member) =>
        isPrivileged ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setConfirmMember(member);
            }}
            className="text-text-muted hover:text-danger transition-colors p-0.5"
          >
            <Trash2 size={14} />
          </button>
        ) : null,
    },
  ];

  const pendingInvites = invites.filter((i) => i.status === "pending");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div
          className={`flex items-center bg-surface-secondary border border-border rounded-lg p-0.5 gap-0.5
          ${isOwner ? "block" : "hidden"}`}
        >
          <button
            onClick={() => setActiveTab("members")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === "members"
                ? "bg-surface text-text-primary shadow-sm border border-border"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            <Users size={13} />
            Members
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                activeTab === "members"
                  ? "bg-surface-secondary text-text-secondary"
                  : "bg-surface text-text-muted"
              }`}
            >
              {total}
            </span>
          </button>

          {isOwner && (
            <button
              onClick={() => setActiveTab("invites")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === "invites"
                  ? "bg-surface text-text-primary shadow-sm border border-border"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              <Mail size={13} />
              Invites
              {pendingInvites.length > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                    activeTab === "invites"
                      ? "bg-surface-secondary text-text-secondary"
                      : "bg-surface text-text-muted"
                  }`}
                >
                  {pendingInvites.length}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Invite button — vidljivo samo privilegovanim */}
        {isPrivileged && (
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsInviteModalOpen(true)}
          >
            <Plus size={15} /> Invite member
          </Button>
        )}
      </div>

      {/* ── MEMBERS TAB ── */}
      {activeTab === "members" && (
        <>
          <p className="text-xs text-text-muted">
            {members.length} of {total} members
          </p>

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
        </>
      )}

      {/* ── INVITES TAB ── */}
      {activeTab === "invites" && isOwner && (
        <>
          <p className="text-xs text-text-muted">
            {pendingInvites.length} pending invite
            {pendingInvites.length !== 1 ? "s" : ""}
          </p>

          {invitesLoading && (
            <div className="text-sm text-text-secondary py-8 text-center">
              Loading invites...
            </div>
          )}

          {invitesError && !invitesLoading && (
            <div className="bg-error-muted border border-error text-error p-4 rounded-lg text-sm">
              {invitesError}
            </div>
          )}

          {!invitesLoading && !invitesError && pendingInvites.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <div className="p-3 rounded-full bg-surface-secondary border border-border">
                <Mail size={18} className="text-text-muted" />
              </div>
              <p className="text-sm text-text-secondary font-medium">
                No pending invites
              </p>
              <p className="text-xs text-text-muted">
                Invite someone to join this organization.
              </p>
            </div>
          )}

          {!invitesLoading && !invitesError && pendingInvites.length > 0 && (
            <div className="flex flex-col divide-y divide-border rounded-lg border border-border overflow-hidden">
              {pendingInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between px-4 py-3.5 bg-surface hover:bg-surface-hover transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      initials={invite.email[0].toUpperCase()}
                      size="md"
                      rounded="rounded-full"
                    />
                    <div>
                      <p className="text-sm font-semibold text-text-primary">
                        {invite.email}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <TagComponent accentClass={getRoleAccent(invite.role)}>
                          {invite.role}
                        </TagComponent>
                        <span className="text-[11px] text-text-muted">
                          invited by{" "}
                          <span className="font-mono text-text-secondary">
                            @{invite.invitedByUsername}
                          </span>
                        </span>
                        <span className="text-[11px] text-text-muted">·</span>
                        <span className="text-[11px] text-text-muted">
                          sent{" "}
                          {new Date(invite.createdAt).toLocaleDateString(
                            "en-US",
                            { year: "numeric", month: "short", day: "numeric" },
                          )}
                        </span>
                        <span className="text-[11px] text-text-muted">·</span>
                        <span className="text-[11px] text-text-muted">
                          expires{" "}
                          {new Date(invite.expiresAt).toLocaleDateString(
                            "en-US",
                            { year: "numeric", month: "short", day: "numeric" },
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setConfirmInvite(invite)}
                    className="text-text-muted hover:text-danger transition-colors p-1 rounded-md hover:bg-error-muted flex-shrink-0"
                    title="Cancel invite"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSave={async (payload) => {
          await inviteMember(payload);
          await fetchInvites();
          setActiveTab("invites");
          setIsInviteModalOpen(false);
        }}
      />

      <DeleteConfirmModal
        isOpen={!!confirmMember}
        onClose={() => {
          setConfirmMember(null);
          setDeleteError(null);
        }}
        onDelete={handleRemoveMember}
        title="Remove Member"
        entityName={confirmMember?.username ?? ""}
        description={
          <>
            Removing{" "}
            <span className="text-text-primary font-medium">
              {confirmMember?.username}
            </span>{" "}
            will revoke their access to this organization.
          </>
        }
        loading={deleting}
        error={deleteError}
      />

      <DeleteConfirmModal
        isOpen={!!confirmInvite}
        onClose={() => {
          setConfirmInvite(null);
          setCancelInviteError(null);
        }}
        onDelete={handleCancelInvite}
        title="Cancel Invite"
        entityName={confirmInvite?.email ?? ""}
        description={
          <>
            Canceling the invite for{" "}
            <span className="text-text-primary font-medium">
              {confirmInvite?.email}
            </span>{" "}
            will revoke their pending access to this organization.
          </>
        }
        loading={cancelingInvite}
        error={cancelInviteError}
      />
    </div>
  );
}

export default MembersTab;
