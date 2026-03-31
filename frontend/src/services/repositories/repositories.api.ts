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
  isStarredByCurrentUser?: boolean;
}

export interface GetRepositoriesParams {
  page?: number;
  pageSize?: number;
  mine?: boolean;
  visibility?: "all" | "public" | "private";
  search?: string;
  owner?: string;
  sortBy?: "createdAt" | "stars";
  sortDir?: "asc" | "desc";
  starred?: boolean;
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

export type TagSortBy = "name" | "createdat" | "stars" | "pulls";
export type TagSortDir = "asc" | "desc";

export interface GetTagsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: TagSortBy;
  sortDir?: TagSortDir;
}

export const getMyRepositories = (
  params: GetRepositoriesParams = {},
): Promise<{ data: RepositoriesResponse }> => {
  const {
    page = 1,
    pageSize = 20,
    mine,
    visibility,
    search,
    owner,
    sortBy,
    sortDir,
    starred,
  } = params;

  return api.get("/api/repositories/explore", {
    params: {
      page,
      pageSize,
      ...(mine !== undefined ? { mine } : {}),
      ...(visibility !== undefined ? { visibility } : {}),
      ...(search !== undefined ? { search } : {}),
      ...(owner !== undefined ? { owner } : {}),
      ...(sortBy !== undefined ? { sortBy } : {}),
      ...(sortDir !== undefined ? { sortDir } : {}),
      ...(starred !== undefined ? { starred } : {}),
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
  params: GetTagsParams = {},
): Promise<{ data: TagsResponse }> => {
  const { page = 1, pageSize = 20, search, sortBy, sortDir } = params;

  return api.get(`/api/repositories/${repositoryId}/tags`, {
    params: {
      page,
      pageSize,
      ...(search && { search }),
      ...(sortBy && { sortBy }),
      ...(sortDir && { sortDir }),
    },
  });
};

export function updateRepository(
  id: number,
  data: { name?: string; description: string; visibility: string },
) {
  return api.put(`/api/repositories/${id}`, data);
}

export const deleteTag = (
  repositoryId: number,
  tagName: string,
): Promise<{ data: { message: string } }> =>
  api.delete(`/api/repositories/${repositoryId}/tags/${tagName}`);

export const starRepository = (id: number) =>
  api.post(`/api/repositories/${id}/star`);

export const unstarRepository = (id: number) =>
  api.delete(`/api/repositories/${id}/star`);
