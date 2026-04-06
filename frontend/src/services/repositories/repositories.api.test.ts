import * as repositoriesApi from "./repositories.api";

import { beforeEach, describe, expect, it, vi } from "vitest";

import api from "../../lib/api";

vi.mock("@/lib/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockGet = vi.mocked(api.get);
const mockPost = vi.mocked(api.post);
const mockPut = vi.mocked(api.put);
const mockDelete = vi.mocked(api.delete);

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

const MOCK_TAG: repositoriesApi.TagDetail = {
  name: "latest",
  digest: "sha256:abc123",
  os: "linux",
  architecture: "amd64",
  compressedSizeBytes: 1024,
  lastPulledAt: "2025-03-10T12:00:00Z",
  lastPushedAt: "2025-03-09T10:00:00Z",
  lastPushedBy: "john@example.com",
  pullCount: 10,
  mediaType: "application/vnd.docker.distribution.manifest.v2+json",
  createdAt: "2023-01-15T08:00:00Z",
  size: "1 KB",
};

const MOCK_TAGS_RESPONSE: repositoriesApi.TagsResponse = {
  repositoryId: 1,
  repositoryFullName: "john.doe/nginx",
  pullCount: 42,
  tags: [MOCK_TAG],
  total: 1,
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

    it("poziva GET sa mine param kad je prosledjen", async () => {
      mockGet.mockResolvedValueOnce({ data: MOCK_REPOSITORIES_RESPONSE });

      await repositoriesApi.getMyRepositories({
        page: 1,
        pageSize: 20,
        mine: true,
      });

      expect(mockGet).toHaveBeenCalledWith("/api/repositories/explore", {
        params: { page: 1, pageSize: 20, mine: true },
      });
    });

    it("poziva GET sa owner param kad je prosledjen", async () => {
      mockGet.mockResolvedValueOnce({ data: MOCK_REPOSITORIES_RESPONSE });

      await repositoriesApi.getMyRepositories({
        page: 1,
        pageSize: 20,
        owner: "john@example.com",
      });

      expect(mockGet).toHaveBeenCalledWith("/api/repositories/explore", {
        params: { page: 1, pageSize: 20, owner: "john@example.com" },
      });
    });

    it("poziva GET sa sortBy i sortDir params kad su prosledjeni", async () => {
      mockGet.mockResolvedValueOnce({ data: MOCK_REPOSITORIES_RESPONSE });

      await repositoriesApi.getMyRepositories({
        page: 1,
        pageSize: 20,
        sortBy: "stars",
        sortDir: "desc",
      });

      expect(mockGet).toHaveBeenCalledWith("/api/repositories/explore", {
        params: { page: 1, pageSize: 20, sortBy: "stars", sortDir: "desc" },
      });
    });

    it("poziva GET sa starred param kad je prosledjen", async () => {
      mockGet.mockResolvedValueOnce({ data: MOCK_REPOSITORIES_RESPONSE });

      await repositoriesApi.getMyRepositories({
        page: 1,
        pageSize: 20,
        starred: true,
      });

      expect(mockGet).toHaveBeenCalledWith("/api/repositories/explore", {
        params: { page: 1, pageSize: 20, starred: true },
      });
    });

    it("ne salje undefined parametre u query", async () => {
      mockGet.mockResolvedValueOnce({ data: MOCK_REPOSITORIES_RESPONSE });

      await repositoriesApi.getMyRepositories({ page: 1, pageSize: 20 });

      const callParams = mockGet.mock.calls[0][1]?.params;
      expect(callParams).not.toHaveProperty("mine");
      expect(callParams).not.toHaveProperty("visibility");
      expect(callParams).not.toHaveProperty("search");
      expect(callParams).not.toHaveProperty("owner");
      expect(callParams).not.toHaveProperty("sortBy");
      expect(callParams).not.toHaveProperty("sortDir");
      expect(callParams).not.toHaveProperty("starred");
    });

    it("vraca data iz response-a", async () => {
      mockGet.mockResolvedValueOnce({ data: MOCK_REPOSITORIES_RESPONSE });

      const result = await repositoriesApi.getMyRepositories();

      expect(result.data.repositories).toHaveLength(1);
      expect(result.data.total).toBe(1);
      expect(result.data.page).toBe(1);
      expect(result.data.pageSize).toBe(20);
    });

    it("baca gresku kad API ne uspe", async () => {
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

    it("vraca repository iz response-a", async () => {
      mockGet.mockResolvedValueOnce({ data: MOCK_REPO });

      const result = await repositoriesApi.getRepositoryById(1);

      expect(result.data.id).toBe(1);
      expect(result.data.name).toBe("nginx");
    });

    it("baca gresku kad repozitorijum nije pronadjen", async () => {
      mockGet.mockRejectedValueOnce({ response: { status: 404 } });

      await expect(
        repositoriesApi.getRepositoryById(999),
      ).rejects.toMatchObject({ response: { status: 404 } });
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

    it("vraca message i repository iz response-a", async () => {
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

    it("salje private visibility ispravno", async () => {
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

    it("baca gresku kad API ne uspe", async () => {
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

  describe("deleteRepository", () => {
    it("poziva DELETE /api/repositories/{id}", async () => {
      mockDelete.mockResolvedValueOnce({
        data: { message: "Repository deleted." },
      });

      await repositoriesApi.deleteRepository(1);

      expect(mockDelete).toHaveBeenCalledWith("/api/repositories/1");
    });

    it("vraca message iz response-a", async () => {
      mockDelete.mockResolvedValueOnce({
        data: { message: "Repository deleted successfully." },
      });

      const result = await repositoriesApi.deleteRepository(1);

      expect(result.data.message).toBe("Repository deleted successfully.");
    });

    it("baca gresku kad repozitorijum nije pronadjen", async () => {
      mockDelete.mockRejectedValueOnce({ response: { status: 404 } });

      await expect(repositoriesApi.deleteRepository(999)).rejects.toMatchObject(
        { response: { status: 404 } },
      );
    });
  });

  describe("getRepositoryTags", () => {
    it("poziva GET /api/repositories/{id}/tags sa default params", async () => {
      mockGet.mockResolvedValueOnce({ data: MOCK_TAGS_RESPONSE });

      await repositoriesApi.getRepositoryTags(1);

      expect(mockGet).toHaveBeenCalledWith("/api/repositories/1/tags", {
        params: { page: 1, pageSize: 20 },
      });
    });

    it("poziva GET sa custom page i pageSize", async () => {
      mockGet.mockResolvedValueOnce({ data: MOCK_TAGS_RESPONSE });

      await repositoriesApi.getRepositoryTags(1, { page: 2, pageSize: 5 });

      expect(mockGet).toHaveBeenCalledWith("/api/repositories/1/tags", {
        params: { page: 2, pageSize: 5 },
      });
    });

    it("poziva GET sa search param kad je prosledjen", async () => {
      mockGet.mockResolvedValueOnce({ data: MOCK_TAGS_RESPONSE });

      await repositoriesApi.getRepositoryTags(1, { search: "latest" });

      expect(mockGet).toHaveBeenCalledWith("/api/repositories/1/tags", {
        params: { page: 1, pageSize: 20, search: "latest" },
      });
    });

    it("poziva GET sa sortBy i sortDir params", async () => {
      mockGet.mockResolvedValueOnce({ data: MOCK_TAGS_RESPONSE });

      await repositoriesApi.getRepositoryTags(1, {
        sortBy: "name",
        sortDir: "asc",
      });

      expect(mockGet).toHaveBeenCalledWith("/api/repositories/1/tags", {
        params: { page: 1, pageSize: 20, sortBy: "name", sortDir: "asc" },
      });
    });

    it("ne salje falsy search/sortBy/sortDir parametre", async () => {
      mockGet.mockResolvedValueOnce({ data: MOCK_TAGS_RESPONSE });

      await repositoriesApi.getRepositoryTags(1, {
        search: "",
        sortBy: undefined,
        sortDir: undefined,
      });

      const callParams = mockGet.mock.calls[0][1]?.params;
      expect(callParams).not.toHaveProperty("search");
      expect(callParams).not.toHaveProperty("sortBy");
      expect(callParams).not.toHaveProperty("sortDir");
    });

    it("vraca tags iz response-a", async () => {
      mockGet.mockResolvedValueOnce({ data: MOCK_TAGS_RESPONSE });

      const result = await repositoriesApi.getRepositoryTags(1);

      expect(result.data.tags).toHaveLength(1);
      expect(result.data.tags[0].name).toBe("latest");
      expect(result.data.repositoryId).toBe(1);
    });

    it("baca gresku kad API ne uspe", async () => {
      mockGet.mockRejectedValueOnce(new Error("Network error"));

      await expect(repositoriesApi.getRepositoryTags(1)).rejects.toThrow(
        "Network error",
      );
    });
  });

  describe("updateRepository", () => {
    const UPDATE_PAYLOAD = {
      description: "Updated description",
      visibility: "private",
    };

    it("poziva PUT /api/repositories/{id} sa ispravnim payload-om", async () => {
      mockPut.mockResolvedValueOnce({ data: MOCK_REPO });

      await repositoriesApi.updateRepository(1, UPDATE_PAYLOAD);

      expect(mockPut).toHaveBeenCalledWith(
        "/api/repositories/1",
        UPDATE_PAYLOAD,
      );
    });

    it("salje opcioni name field ispravno", async () => {
      mockPut.mockResolvedValueOnce({ data: MOCK_REPO });

      await repositoriesApi.updateRepository(1, {
        name: "new-name",
        description: "desc",
        visibility: "public",
      });

      expect(mockPut).toHaveBeenCalledWith("/api/repositories/1", {
        name: "new-name",
        description: "desc",
        visibility: "public",
      });
    });

    it("baca gresku kad API ne uspe", async () => {
      mockPut.mockRejectedValueOnce({
        response: { data: { message: "Forbidden." } },
      });

      await expect(
        repositoriesApi.updateRepository(1, UPDATE_PAYLOAD),
      ).rejects.toMatchObject({
        response: { data: { message: "Forbidden." } },
      });
    });
  });

  describe("deleteTag", () => {
    it("poziva DELETE /api/repositories/{id}/tags/{tagName}", async () => {
      mockDelete.mockResolvedValueOnce({ data: { message: "Tag deleted." } });

      await repositoriesApi.deleteTag(1, "latest");

      expect(mockDelete).toHaveBeenCalledWith(
        "/api/repositories/1/tags/latest",
      );
    });

    it("vraca message iz response-a", async () => {
      mockDelete.mockResolvedValueOnce({
        data: { message: "Tag deleted successfully." },
      });

      const result = await repositoriesApi.deleteTag(1, "latest");

      expect(result.data.message).toBe("Tag deleted successfully.");
    });

    it("baca gresku kad tag nije pronadjen", async () => {
      mockDelete.mockRejectedValueOnce({ response: { status: 404 } });

      await expect(
        repositoriesApi.deleteTag(1, "nonexistent"),
      ).rejects.toMatchObject({ response: { status: 404 } });
    });
  });

  describe("starRepository", () => {
    it("poziva POST /api/repositories/{id}/star", async () => {
      mockPost.mockResolvedValueOnce({ data: {} });

      await repositoriesApi.starRepository(1);

      expect(mockPost).toHaveBeenCalledWith("/api/repositories/1/star");
    });

    it("baca gresku kad API ne uspe", async () => {
      mockPost.mockRejectedValueOnce({ response: { status: 401 } });

      await expect(repositoriesApi.starRepository(1)).rejects.toMatchObject({
        response: { status: 401 },
      });
    });
  });

  describe("unstarRepository", () => {
    it("poziva DELETE /api/repositories/{id}/star", async () => {
      mockDelete.mockResolvedValueOnce({ data: {} });

      await repositoriesApi.unstarRepository(1);

      expect(mockDelete).toHaveBeenCalledWith("/api/repositories/1/star");
    });

    it("baca gresku kad API ne uspe", async () => {
      mockDelete.mockRejectedValueOnce({ response: { status: 401 } });

      await expect(repositoriesApi.unstarRepository(1)).rejects.toMatchObject({
        response: { status: 401 },
      });
    });
  });
});
