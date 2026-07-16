import { useCallback, useState } from "react";

import {
  type Organization,
  fetchOrganizations,
  createOrganization,
} from "../organizations.api";

interface OrganizationsState {
  orgs: Organization[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  error: string | null;
  creating: boolean;
}

const DEFAULT_PAGE_SIZE = 12;

export function useOrganizations() {
  const [state, setState] = useState<OrganizationsState>({
    orgs: [],
    total: 0,
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    loading: false,
    error: null,
    creating: false,
  });

  const fetch = useCallback(
    async (page = 1, search?: string, pageSize = DEFAULT_PAGE_SIZE) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const res = await fetchOrganizations({ page, pageSize, search });
        setState((prev) => ({
          ...prev,
          orgs: res.organizations,
          total: res.total,
          page: res.page,
          pageSize: res.pageSize,
          loading: false,
          error: null,
        }));
      } catch (err) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : "Unknown error",
        }));
      }
    },
    [],
  );

  const addOrganization = useCallback(
    async (
      payload: Omit<
        Organization,
        | "id"
        | "createdAt"
        | "updatedAt"
        | "memberCount"
        | "repositoryCount"
        | "currentUserRole"
        | "ownerUsername"
        | "avatarUrl"
      > & { avatarUrl?: string },
    ) => {
      setState((prev) => ({ ...prev, creating: true, error: null }));
      try {
        const newOrg = await createOrganization(payload);

        await fetch(state.page, undefined, state.pageSize);

        setState((prev) => ({ ...prev, creating: false }));
        return { success: true, data: newOrg };
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to create organization";
        setState((prev) => ({
          ...prev,
          creating: false,
          error: errorMsg,
        }));
        return { success: false, error: errorMsg };
      }
    },
    [fetch, state.page, state.pageSize],
  );

  return {
    ...state,
    fetchOrganizations: fetch,
    addOrganization,
  };
}
