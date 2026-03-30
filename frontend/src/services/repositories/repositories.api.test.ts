import * as repositoriesApi from "./repositories.api";

import { beforeEach, describe, expect, it, vi } from "vitest";

import api from "../../lib/api";

vi.mock("@/lib/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockGet = vi.mocked(api.get);
const mockPost = vi.mocked(api.post);

const MOCK_REPO = {
  id: 1,
  name: "nginx",
  fullName: "john.doe/nginx",
  description: "Official build of Nginx.",
  visibility: "public" as const,
  ownerEmail: "john@example.com",
  createdAt: "2023-01-15T08:00:00Z",
  updatedAt: "2025-03-10T12:00:00Z",
  isOfficial: false,
  starCount: 48,
  tags: ["latest"],
};

const MOCK_REPOSITORIES_RESPONSE = {
  repositories: [MOCK_REPO],
  total: 1,
  page: 1,
  pageSize: 20,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("repositories.api", () => {
  describe("getMyRepositories", () => {
    it("poziva GET /api/repositories/explore sa default params", async () => {
      mockGet.mockResolvedValueOnce({ data: MOCK_REPOSITORIES_RESPONSE });

      await repositoriesApi.getMyRepositories();

      expect(mockGet).toHaveBeenCalledWith("/api/repositories/explore", {
        params: { page: 1, pageSize: 20 },
      });
    });

    it("poziva GET sa custom page i pageSize", async () => {
      mockGet.mockResolvedValueOnce({ data: MOCK_REPOSITORIES_RESPONSE });

      await repositoriesApi.getMyRepositories({ page: 2, pageSize: 10 });

      expect(mockGet).toHaveBeenCalledWith("/api/repositories/explore", {
        params: { page: 2, pageSize: 10 },
      });
    });

    it("poziva GET sa visibility param kad je prosledjen", async () => {
      mockGet.mockResolvedValueOnce({ data: MOCK_REPOSITORIES_RESPONSE });

      await repositoriesApi.getMyRepositories({
        page: 1,
        pageSize: 20,
        visibility: "private",
      });

      expect(mockGet).toHaveBeenCalledWith("/api/repositories/explore", {
        params: { page: 1, pageSize: 20, visibility: "private" },
      });
    });

    it("poziva GET sa search param kad je prosledjen", async () => {
      mockGet.mockResolvedValueOnce({ data: MOCK_REPOSITORIES_RESPONSE });

      await repositoriesApi.getMyRepositories({
        page: 1,
        pageSize: 20,
        search: "nginx",
      });

      expect(mockGet).toHaveBeenCalledWith("/api/repositories/explore", {
        params: { page: 1, pageSize: 20, search: "nginx" },
      });
    });

    it("vraca data iz response-a", async () => {
      mockGet.mockResolvedValueOnce({ data: MOCK_REPOSITORIES_RESPONSE });

      const result = await repositoriesApi.getMyRepositories();

      expect(result.data.repositories).toHaveLength(1);
      expect(result.data.total).toBe(1);
      expect(result.data.page).toBe(1);
      expect(result.data.pageSize).toBe(20);
    });

    it("baca grešku kad API ne uspe", async () => {
      mockGet.mockRejectedValueOnce(new Error("Network error"));

      await expect(repositoriesApi.getMyRepositories()).rejects.toThrow(
        "Network error",
      );
    });
  });

  describe("getRepositoryById", () => {
    it("poziva GET /api/repositories/{id}", async () => {
      mockGet.mockResolvedValueOnce({ data: MOCK_REPO });

      await repositoriesApi.getRepositoryById(1);

      expect(mockGet).toHaveBeenCalledWith("/api/repositories/1");
    });
  });

  describe("createRepository", () => {
    const PAYLOAD = {
      name: "my-image",
      description: "My description",
      visibility: "public" as const,
    };

    it("poziva POST /api/repositories sa ispravnim payload-om", async () => {
      mockPost.mockResolvedValueOnce({
        data: { message: "Created.", repository: MOCK_REPO },
      });

      await repositoriesApi.createRepository(PAYLOAD);

      expect(mockPost).toHaveBeenCalledWith("/api/repositories", PAYLOAD);
    });

    it("vraća message i repository iz response-a", async () => {
      mockPost.mockResolvedValueOnce({
        data: {
          message: "Repository created successfully.",
          repository: MOCK_REPO,
        },
      });

      const result = await repositoriesApi.createRepository(PAYLOAD);

      expect(result.data.message).toBe("Repository created successfully.");
      expect(result.data.repository.name).toBe("nginx");
    });

    it("šalje private visibility ispravno", async () => {
      mockPost.mockResolvedValueOnce({
        data: {
          message: "Created.",
          repository: { ...MOCK_REPO, visibility: "private" },
        },
      });

      await repositoriesApi.createRepository({
        ...PAYLOAD,
        visibility: "private",
      });

      expect(mockPost).toHaveBeenCalledWith("/api/repositories", {
        ...PAYLOAD,
        visibility: "private",
      });
    });

    it("baca grešku kad API ne uspe", async () => {
      mockPost.mockRejectedValueOnce({
        response: { data: { message: "Name already taken." } },
      });

      await expect(
        repositoriesApi.createRepository(PAYLOAD),
      ).rejects.toMatchObject({
        response: { data: { message: "Name already taken." } },
      });
    });
  });
});
