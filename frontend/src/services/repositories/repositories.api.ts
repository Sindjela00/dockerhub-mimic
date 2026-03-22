import {
  RepoVisibility,
  Repository,
} from "@/pages/RepositoriesPage/types/types";

import api from "@/lib/api";

export interface GetRepositoriesParams {
  page?: number;
  pageSize?: number;
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

export const getMyRepositories = (
  params: GetRepositoriesParams = {},
): Promise<{ data: RepositoriesResponse }> => {
  const { page = 1, pageSize = 20 } = params;
  return api.get("/api/repositories/my", { params: { page, pageSize } });
};

export const createRepository = (
  payload: CreateRepositoryPayload,
): Promise<{ data: CreateRepositoryResponse }> =>
  api.post("/api/repositories", payload);
