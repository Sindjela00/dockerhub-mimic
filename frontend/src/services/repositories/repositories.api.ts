import { RepoVisibility } from "@/pages/RepositoriesPage/types/types";
import api from "@/lib/api";

export interface Repository {
  id: number;
  name: string;
  fullName: string;
  description: string;
  visibility: RepoVisibility;
  ownerEmail: string;
  createdAt: string;
  updatedAt: string;
  isOfficial: boolean;
  starCount: number;
  tags: string[];
}

export interface GetRepositoriesParams {
  page?: number;
  pageSize?: number;
  mine?: boolean;
  visibility?: RepoVisibility;
  search?: string;
  owner?: string;
}

export interface RepositoriesResponse {
  repositories: Repository[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateRepositoryPayload {
  name: string;
  description: string;
  visibility: RepoVisibility;
}

export interface CreateRepositoryResponse {
  message: string;
  repository: Repository;
}

export interface DeleteRepositoryResponse {
  message: string;
}

export interface TagDetail {
  name: string;
  digest: string;
  os: string | null;
  architecture: string | null;
  compressedSizeBytes: number;
  lastPulledAt: string | null;
  lastPushedAt: string;
  lastPushedBy: string;
  pullCount: number;
  mediaType: string;
  createdAt: string;
  size: string;
}

export interface TagsResponse {
  repositoryId: number;
  repositoryFullName: string;
  pullCount: number;
  tags: TagDetail[];
  total: number;
}

export const getMyRepositories = (
  params: GetRepositoriesParams = {},
): Promise<{ data: RepositoriesResponse }> => {
  const { page = 1, pageSize = 20, mine, visibility, search, owner } = params;
  return api.get("/api/repositories/explore", {
    params: {
      page,
      pageSize,
      ...(mine !== undefined && { mine }),
      ...(visibility !== undefined && { visibility }),
      ...(search !== undefined && { search }),
      ...(owner !== undefined && { owner }),
    },
  });
};

export const getRepositoryById = (id: number): Promise<{ data: Repository }> =>
  api.get(`/api/repositories/${id}`);

export const createRepository = (
  payload: CreateRepositoryPayload,
): Promise<{ data: CreateRepositoryResponse }> =>
  api.post("/api/repositories", payload);

export const deleteRepository = (
  id: number,
): Promise<{ data: DeleteRepositoryResponse }> =>
  api.delete(`/api/repositories/${id}`);

export const getRepositoryTags = (
  repositoryId: number,
): Promise<{ data: TagsResponse }> =>
  api.get(`/api/repositories/${repositoryId}/tags`);

export function updateRepository(
  id: number,
  data: { name?: string; description: string; visibility: string },
) {
  return api.put(`/api/repositories/${id}`, data);
}
