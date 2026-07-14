import { Organization } from "../organizations.api";

export interface OrgRoleFlags {
  isOwner: boolean;
  isAdmin: boolean;
  isMember: boolean;
  isPrivileged: boolean;
}

export function useOrgRole(
  organization?: Pick<Organization, "currentUserRole"> | null,
): OrgRoleFlags {
  const role = organization?.currentUserRole;
  const isOwner = role === "owner";
  const isAdmin = role === "admin";
  const isMember = role === "member";

  return {
    isOwner,
    isAdmin,
    isMember,
    isPrivileged: isOwner || isAdmin,
  };
}
