import {
  CreateRepositoryPayload,
  CreateRepositoryResponse,
  RepositoriesResponse,
  Repository,
} from "../repositories/repositories.api";

import { RepoVisibility } from "@/pages/RepositoriesPage/types/types";
import api from "@/lib/api";

const BASE_URL = "/api";

export interface Organization {
  id: number;
  name: string;
  displayName: string;
  description: string;
  avatarUrl: string | null;
  ownerUsername: string;
  createdAt: string;
  updatedAt: string;
  memberCount: number;
  repositoryCount: number;
  currentUserRole: string;
}

export interface OrganizationsResponse {
  organizations: Organization[];
  total: number;
  page: number;
  pageSize: number;
}

export interface FetchOrganizationsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  token: string;
}

export interface CreateOrganizationResponse {
  id?: number;
  name: string;
  displayName: string;
  description: string;
  avatarUrl?: string | null;
  ownerUsername?: string;
  createdAt?: string;
  memberCount?: number;
  repositoryCount?: number;
  currentUserRole?: string;
}

export interface CreateOrgRepositoryPayload {
  name: string;
  description: string;
  visibility: RepoVisibility;
}

export async function fetchOrganizations({
  page = 1,
  pageSize = 12,
  search,
  token,
}: FetchOrganizationsParams): Promise<OrganizationsResponse> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });

  if (search?.trim()) {
    params.set("search", search.trim());
  }

  const res = await fetch(`${BASE_URL}/organizations?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? `HTTP ${res.status}`);
  }

  return res.json();
}

export async function createOrganization(
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
  >,
  token: string,
): Promise<CreateOrganizationResponse> {
  const res = await fetch(`${BASE_URL}/organizations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? `HTTP ${res.status}`);
  }

  return res.json();
}

export async function fetchOrganization(
  name: string,
  token: string,
): Promise<Organization> {
  const res = await fetch(`${BASE_URL}/organizations/${name}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? `HTTP ${res.status}`);
  }

  return res.json();
}

// organizations.api.ts
export async function fetchOrganizationRepositories(
  orgName: string,
  token: string,
  search?: string,
): Promise<{ repositories: Repository[]; total: number }> {
  let url = `/api/organizations/${orgName}/repositories`;
  if (search && search.trim()) {
    url += `?search=${encodeURIComponent(search.trim())}`;
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch organization repositories");
  }

  const data = await response.json();
  return {
    repositories: data.repositories || [],
    total: data.total || 0,
  };
}

export const createOrgRepository = (
  orgName: string,
  payload: CreateRepositoryPayload,
): Promise<{ data: CreateRepositoryResponse }> =>
  api.post(`/api/organizations/${orgName}/repositories`, payload);
