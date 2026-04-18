import {
  CreateRepositoryPayload,
  CreateRepositoryResponse,
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
  currentUserRole?: "member" | "admin" | "owner";
}

export interface CreateOrgRepositoryPayload {
  name: string;
  description: string;
  visibility: RepoVisibility;
}

export interface UpdateOrganizationPayload {
  displayName: string;
  description: string;
  avatarUrl?: string | null;
}

export interface Team {
  id: number;
  name: string;
  description: string;
  organizationName: string;
  memberCount: number;
  repositoryCount: number;
  createdAt: string;
  updatedAt: string;
  access?: string;
  accentClass?: string;
}

export interface TeamsResponse {
  organizationName: string;
  teams: Team[];
  total: number;
}

export interface CreateTeamPayload {
  name: string;
  description: string;
}

export interface OrganizationMember {
  userId: number;
  username: string;
  email: string;
  role: string;
  addedAt: string;
}

export interface MembersResponse {
  organizationName: string;
  members: OrganizationMember[];
  total: number;
}

export interface InviteMemberPayload {
  identifier: string;
  role: string;
}

export interface UpdateTeamPayload {
  name: string;
  description: string;
}

export interface TeamRepository {
  repositoryId: number;
  repositoryName: string;
  fullName: string;
  permission: string;
}

export interface TeamRepositoriesResponse {
  teamName: string;
  organizationName: string;
  repositories: TeamRepository[];
  total: number;
}

export interface AddTeamRepositoryPayload {
  repositoryId: number;
  permission: string;
}

export interface AddTeamRepositoryResponse {
  message: string;
  teamRepository: TeamRepository;
}

export interface TeamMember {
  userId: number;
  username: string;
  email: string;
  addedAt: string;
}

export interface TeamMembersResponse {
  teamName: string;
  organizationName: string;
  members: TeamMember[];
  total: number;
}

export async function addTeamMember(
  orgName: string,
  teamName: string,
  userId: number,
  token: string,
): Promise<void> {
  await api.post(
    `${BASE_URL}/organizations/${orgName}/teams/${teamName}/members`,
    { userId },
    { headers: { Authorization: `Bearer ${token}` } },
  );
}

export async function fetchTeamMembers(
  orgName: string,
  teamName: string,
  token: string,
): Promise<TeamMembersResponse> {
  const response = await api.get<TeamMembersResponse>(
    `${BASE_URL}/organizations/${orgName}/teams/${teamName}/members`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return response.data;
}

export async function removeTeamRepository(
  orgName: string,
  teamName: string,
  repositoryId: number,
  token: string,
): Promise<void> {
  await api.delete(
    `${BASE_URL}/organizations/${orgName}/teams/${teamName}/repositories/${repositoryId}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
}

export async function fetchTeamRepositories(
  orgName: string,
  teamName: string,
  token: string,
): Promise<TeamRepositoriesResponse> {
  const response = await api.get<TeamRepositoriesResponse>(
    `${BASE_URL}/organizations/${orgName}/teams/${teamName}/repositories`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return response.data;
}

export async function addTeamRepository(
  orgName: string,
  teamName: string,
  payload: AddTeamRepositoryPayload,
  token: string,
): Promise<AddTeamRepositoryResponse> {
  const response = await api.post<AddTeamRepositoryResponse>(
    `${BASE_URL}/organizations/${orgName}/teams/${teamName}/repositories`,
    payload,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return response.data;
}

export async function deleteTeam(
  orgName: string,
  teamName: string,
  token: string,
): Promise<void> {
  await api.delete(`${BASE_URL}/organizations/${orgName}/teams/${teamName}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function updateTeam(
  orgName: string,
  teamName: string,
  payload: UpdateTeamPayload,
  token: string,
): Promise<Team> {
  const response = await api.put<Team>(
    `${BASE_URL}/organizations/${orgName}/teams/${teamName}`,
    payload,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return response.data;
}

export async function fetchTeam(
  orgName: string,
  teamName: string,
  token: string,
): Promise<Team> {
  const response = await api.get<Team>(
    `${BASE_URL}/organizations/${orgName}/teams/${teamName}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return response.data;
}

export async function fetchOrganizationMembers(
  orgName: string,
  token: string,
  search?: string,
): Promise<MembersResponse> {
  let url = `${BASE_URL}/organizations/${orgName}/members`;
  if (search?.trim()) {
    url += `?search=${encodeURIComponent(search.trim())}`;
  }

  const response = await api.get<MembersResponse>(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.data;
}

export async function inviteOrganizationMember(
  orgName: string,
  payload: InviteMemberPayload,
  token: string,
): Promise<OrganizationMember> {
  const response = await api.post<OrganizationMember>(
    `${BASE_URL}/organizations/${orgName}/members`,
    payload,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  return response.data;
}

export async function createOrganizationTeam(
  orgName: string,
  payload: CreateTeamPayload,
  token: string,
): Promise<Team> {
  const response = await api.post<Team>(
    `${BASE_URL}/organizations/${orgName}/teams`,
    payload,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return response.data;
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

  const response = await api.get<OrganizationsResponse>(
    `${BASE_URL}/organizations?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return response.data;
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
  const response = await api.post<CreateOrganizationResponse>(
    `${BASE_URL}/organizations`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return response.data;
}

export async function fetchOrganization(
  name: string,
  token: string,
): Promise<Organization> {
  const response = await api.get<Organization>(
    `${BASE_URL}/organizations/${name}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return response.data;
}

export async function updateOrganization(
  name: string,
  payload: UpdateOrganizationPayload,
  token: string,
): Promise<Organization> {
  const response = await api.patch<Organization>(
    `${BASE_URL}/organizations/${name}`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return response.data;
}

export async function fetchOrganizationRepositories(
  orgName: string,
  token: string,
  search?: string,
): Promise<{ repositories: Repository[]; total: number }> {
  let url = `${BASE_URL}/organizations/${orgName}/repositories`;
  if (search && search.trim()) {
    url += `?search=${encodeURIComponent(search.trim())}`;
  }

  const response = await api.get<{ repositories: Repository[]; total: number }>(
    url,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return response.data;
}

export const createOrgRepository = (
  orgName: string,
  payload: CreateRepositoryPayload,
): Promise<{ data: CreateRepositoryResponse }> =>
  api.post(`${BASE_URL}/organizations/${orgName}/repositories`, payload);

export async function fetchOrganizationTeams(
  orgName: string,
  token: string,
  search?: string,
): Promise<TeamsResponse> {
  let url = `${BASE_URL}/organizations/${orgName}/teams`;
  if (search?.trim()) {
    url += `?search=${encodeURIComponent(search.trim())}`;
  }

  const response = await api.get<TeamsResponse>(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.data;
}
