import type {
  CreateRepositoryPayload,
  Repository,
} from "@/services/repositories/repositories.api";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createOrgRepository,
  fetchOrganizationRepositories,
} from "../organizations.api";

import { useOrganizationRepositories } from "./useOrganizationRepositories";

vi.mock("../organizations.api", () => ({
  fetchOrganizationRepositories: vi.fn(),
  createOrgRepository: vi.fn(),
}));

const mockFetchRepos = vi.mocked(fetchOrganizationRepositories);
const mockCreateRepo = vi.mocked(createOrgRepository);

const createMockRepository = (
  overrides: Partial<Repository> = {},
): Repository => ({
  id: "1",
  name: "test-repo",
  fullName: "org/test-repo",
  description: "Test repository",
  visibility: "public",
  updatedAt: "2024-01-01T00:00:00Z",
  tags: ["test"],
  starCount: 0,
  isStarredByCurrentUser: false,
  isOfficial: false,
  ...overrides,
});

const createMockApiResponse = (repositories: Repository[], total: number) => ({
  repositories,
  total,
  page: 1,
  pageSize: 20,
});

describe("useOrganizationRepositories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Initial state", () => {
    it("returns correct initial state", () => {
      const { result } = renderHook(() =>
        useOrganizationRepositories("token", "my-org"),
      );

      expect(result.current.repositories).toEqual([]);
      expect(result.current.total).toBe(0);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.searchQuery).toBe("");
      expect(result.current.creating).toBe(false);
      expect(result.current.createError).toBeNull();
    });

    it("returns initial state without token", () => {
      const { result } = renderHook(() =>
        useOrganizationRepositories(null, "my-org"),
      );

      expect(result.current.repositories).toEqual([]);
      expect(result.current.total).toBe(0);
    });

    it("returns initial state without orgName", () => {
      const { result } = renderHook(() =>
        useOrganizationRepositories("token", undefined),
      );

      expect(result.current.repositories).toEqual([]);
    });
  });

  describe("fetchRepos", () => {
    it("fetches repositories successfully", async () => {
      const mockRepos = [
        createMockRepository({ id: "1", name: "repo1" }),
        createMockRepository({ id: "2", name: "repo2" }),
      ];

      mockFetchRepos.mockResolvedValueOnce(createMockApiResponse(mockRepos, 2));

      const { result } = renderHook(() =>
        useOrganizationRepositories("token", "my-org"),
      );

      await act(async () => {
        await result.current.fetchRepos();
      });

      expect(result.current.repositories).toEqual(mockRepos);
      expect(result.current.total).toBe(2);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("handles empty repository list", async () => {
      mockFetchRepos.mockResolvedValueOnce(createMockApiResponse([], 0));

      const { result } = renderHook(() =>
        useOrganizationRepositories("token", "my-org"),
      );

      await act(async () => {
        await result.current.fetchRepos();
      });

      expect(result.current.repositories).toEqual([]);
      expect(result.current.total).toBe(0);
    });

    it("sets loading state while fetching", async () => {
      mockFetchRepos.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );

      const { result } = renderHook(() =>
        useOrganizationRepositories("token", "my-org"),
      );

      act(() => {
        result.current.fetchRepos();
      });

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it("handles fetch error", async () => {
      const errorMessage = "Network error";
      mockFetchRepos.mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() =>
        useOrganizationRepositories("token", "my-org"),
      );

      await act(async () => {
        await result.current.fetchRepos();
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.loading).toBe(false);
      expect(result.current.repositories).toEqual([]);
    });

    it("handles unknown error format", async () => {
      mockFetchRepos.mockRejectedValueOnce("String error");

      const { result } = renderHook(() =>
        useOrganizationRepositories("token", "my-org"),
      );

      await act(async () => {
        await result.current.fetchRepos();
      });

      expect(result.current.error).toBe("Unknown error");
    });

    it("handles error with no message", async () => {
      mockFetchRepos.mockRejectedValueOnce({});

      const { result } = renderHook(() =>
        useOrganizationRepositories("token", "my-org"),
      );

      await act(async () => {
        await result.current.fetchRepos();
      });

      expect(result.current.error).toBe("Unknown error");
    });

    it("does not fetch when orgName is missing", async () => {
      const { result } = renderHook(() =>
        useOrganizationRepositories("token", undefined),
      );

      await act(async () => {
        await result.current.fetchRepos();
      });

      expect(mockFetchRepos).not.toHaveBeenCalled();
      expect(result.current.repositories).toEqual([]);
    });

    it("does not fetch when token is missing", async () => {
      const { result } = renderHook(() =>
        useOrganizationRepositories(null, "my-org"),
      );

      await act(async () => {
        await result.current.fetchRepos();
      });

      expect(mockFetchRepos).not.toHaveBeenCalled();
    });

    it("fetches with search parameter", async () => {
      mockFetchRepos.mockResolvedValueOnce(createMockApiResponse([], 0));

      const { result } = renderHook(() =>
        useOrganizationRepositories("token", "my-org"),
      );

      await act(async () => {
        await result.current.fetchRepos("react");
      });

      expect(mockFetchRepos).toHaveBeenCalledWith("my-org", "token", "react");
    });

    it("fetches with empty string when no search parameter provided", async () => {
      mockFetchRepos.mockResolvedValueOnce(createMockApiResponse([], 0));

      const { result } = renderHook(() =>
        useOrganizationRepositories("token", "my-org"),
      );

      await act(async () => {
        await result.current.fetchRepos();
      });

      expect(mockFetchRepos).toHaveBeenCalledWith("my-org", "token", "");
    });

    it("fetches with explicit undefined search parameter", async () => {
      mockFetchRepos.mockResolvedValueOnce(createMockApiResponse([], 0));

      const { result } = renderHook(() =>
        useOrganizationRepositories("token", "my-org"),
      );

      await act(async () => {
        await result.current.fetchRepos(undefined);
      });

      expect(mockFetchRepos).toHaveBeenCalledWith("my-org", "token", "");
    });

    it("clears previous error on successful fetch", async () => {
      mockFetchRepos.mockRejectedValueOnce(new Error("First error"));

      const { result } = renderHook(() =>
        useOrganizationRepositories("token", "my-org"),
      );

      await act(async () => {
        await result.current.fetchRepos();
      });

      expect(result.current.error).toBe("First error");

      mockFetchRepos.mockResolvedValueOnce(
        createMockApiResponse([createMockRepository()], 1),
      );

      await act(async () => {
        await result.current.fetchRepos();
      });

      expect(result.current.error).toBeNull();
    });

    it("resets error on each new fetch attempt", async () => {
      mockFetchRepos.mockRejectedValueOnce(new Error("First error"));

      const { result } = renderHook(() =>
        useOrganizationRepositories("token", "my-org"),
      );

      await act(async () => {
        await result.current.fetchRepos();
      });

      expect(result.current.error).toBe("First error");

      mockFetchRepos.mockRejectedValueOnce(new Error("Second error"));

      await act(async () => {
        await result.current.fetchRepos();
      });

      expect(result.current.error).toBe("Second error");
    });

    it("handles multiple concurrent fetch calls", async () => {
      mockFetchRepos
        .mockResolvedValueOnce(
          createMockApiResponse([createMockRepository({ id: "1" })], 1),
        )
        .mockResolvedValueOnce(
          createMockApiResponse([createMockRepository({ id: "2" })], 1),
        );

      const { result } = renderHook(() =>
        useOrganizationRepositories("token", "my-org"),
      );

      await act(async () => {
        await Promise.all([
          result.current.fetchRepos("query1"),
          result.current.fetchRepos("query2"),
        ]);
      });

      expect(mockFetchRepos).toHaveBeenCalledTimes(2);
    });
  });

  describe("handleCreate", () => {
    const createPayload: CreateRepositoryPayload = {
      name: "new-repo",
      description: "New repository",
      visibility: "public",
    };

    it("creates repository successfully", async () => {
      const newRepo = createMockRepository({ id: "new-id", name: "new-repo" });

      mockCreateRepo.mockResolvedValueOnce({
        data: { repository: newRepo },
      } as any);

      const { result } = renderHook(() =>
        useOrganizationRepositories("token", "my-org"),
      );

      let createdRepo: Repository | null = null;

      await act(async () => {
        createdRepo = await result.current.handleCreate(createPayload);
      });

      expect(createdRepo).toEqual(newRepo);
      expect(result.current.creating).toBe(false);
      expect(result.current.createError).toBeNull();
    });

    it("sets creating state during creation", async () => {
      mockCreateRepo.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );

      const { result } = renderHook(() =>
        useOrganizationRepositories("token", "my-org"),
      );

      act(() => {
        result.current.handleCreate(createPayload);
      });

      expect(result.current.creating).toBe(true);

      await waitFor(() => {
        expect(result.current.creating).toBe(false);
      });
    });

    it("handles creation error with message", async () => {
      const errorMessage = "Repository name already exists";

      mockCreateRepo.mockRejectedValueOnce({
        response: {
          data: {
            message: errorMessage,
          },
        },
      });

      const { result } = renderHook(() =>
        useOrganizationRepositories("token", "my-org"),
      );

      let createdRepo: Repository | null = null;

      await act(async () => {
        createdRepo = await result.current.handleCreate(createPayload);
      });

      expect(createdRepo).toBeNull();
      expect(result.current.creating).toBe(false);
      expect(result.current.createError).toBe(errorMessage);
    });

    it("handles creation error without response data", async () => {
      mockCreateRepo.mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(() =>
        useOrganizationRepositories("token", "my-org"),
      );

      let createdRepo: Repository | null = null;

      await act(async () => {
        createdRepo = await result.current.handleCreate(createPayload);
      });

      expect(createdRepo).toBeNull();
      expect(result.current.createError).toBe("Failed to create repository.");
    });

    it("handles creation error with empty response", async () => {
      mockCreateRepo.mockRejectedValueOnce({
        response: {},
      });

      const { result } = renderHook(() =>
        useOrganizationRepositories("token", "my-org"),
      );

      let createdRepo: Repository | null = null;

      await act(async () => {
        createdRepo = await result.current.handleCreate(createPayload);
      });

      expect(createdRepo).toBeNull();
      expect(result.current.createError).toBe("Failed to create repository.");
    });

    it("returns null when orgName is missing", async () => {
      const { result } = renderHook(() =>
        useOrganizationRepositories("token", undefined),
      );

      let createdRepo: Repository | null = null;

      await act(async () => {
        createdRepo = await result.current.handleCreate(createPayload);
      });

      expect(createdRepo).toBeNull();
      expect(mockCreateRepo).not.toHaveBeenCalled();
    });

    it("clears previous create error on new creation attempt", async () => {
      mockCreateRepo.mockRejectedValueOnce({
        response: {
          data: {
            message: "First error",
          },
        },
      });

      const { result } = renderHook(() =>
        useOrganizationRepositories("token", "my-org"),
      );

      await act(async () => {
        await result.current.handleCreate(createPayload);
      });

      expect(result.current.createError).toBe("First error");

      const newRepo = createMockRepository({ id: "success" });
      mockCreateRepo.mockResolvedValueOnce({
        data: { repository: newRepo },
      } as any);

      await act(async () => {
        await result.current.handleCreate(createPayload);
      });

      expect(result.current.createError).toBeNull();
    });

    it("passes correct payload to createOrgRepository", async () => {
      mockCreateRepo.mockResolvedValueOnce({
        data: { repository: createMockRepository() },
      } as any);

      const { result } = renderHook(() =>
        useOrganizationRepositories("token", "my-org"),
      );

      const payload: CreateRepositoryPayload = {
        name: "test-repo",
        description: "A test repo",
        visibility: "private",
      };

      await act(async () => {
        await result.current.handleCreate(payload);
      });

      expect(mockCreateRepo).toHaveBeenCalledWith("my-org", payload);
    });

    it("handles creating with minimal payload", async () => {
      mockCreateRepo.mockResolvedValueOnce({
        data: { repository: createMockRepository() },
      } as any);

      const { result } = renderHook(() =>
        useOrganizationRepositories("token", "my-org"),
      );

      const minimalPayload: CreateRepositoryPayload = {
        name: "minimal-repo",
      };

      await act(async () => {
        await result.current.handleCreate(minimalPayload);
      });

      expect(mockCreateRepo).toHaveBeenCalledWith("my-org", minimalPayload);
    });
  });

  describe("searchQuery state", () => {
    it("updates searchQuery state", () => {
      const { result } = renderHook(() =>
        useOrganizationRepositories("token", "my-org"),
      );

      act(() => {
        result.current.setSearchQuery("react");
      });

      expect(result.current.searchQuery).toBe("react");
    });

    it("clears searchQuery", () => {
      const { result } = renderHook(() =>
        useOrganizationRepositories("token", "my-org"),
      );

      act(() => {
        result.current.setSearchQuery("react");
      });

      expect(result.current.searchQuery).toBe("react");

      act(() => {
        result.current.setSearchQuery("");
      });

      expect(result.current.searchQuery).toBe("");
    });
  });

  describe("Reactivity to prop changes", () => {
    it("updates when token changes", () => {
      const { result, rerender } = renderHook(
        ({ token, orgName }) => useOrganizationRepositories(token, orgName),
        {
          initialProps: { token: "token1", orgName: "org" },
        },
      );

      expect(result.current.total).toBe(0);

      rerender({ token: "token2", orgName: "org" });

      expect(result.current.total).toBe(0);
    });

    it("updates when orgName changes", () => {
      const { result, rerender } = renderHook(
        ({ token, orgName }) => useOrganizationRepositories(token, orgName),
        {
          initialProps: { token: "token", orgName: "org1" },
        },
      );

      expect(result.current.total).toBe(0);

      rerender({ token: "token", orgName: "org2" });

      expect(result.current.total).toBe(0);
    });

    it("fetchRepos callback updates when orgName changes", async () => {
      mockFetchRepos.mockResolvedValue(
        createMockApiResponse([createMockRepository()], 1),
      );

      const { result, rerender } = renderHook(
        ({ orgName }) => useOrganizationRepositories("token", orgName),
        {
          initialProps: { orgName: "org1" },
        },
      );

      await act(async () => {
        await result.current.fetchRepos();
      });

      expect(mockFetchRepos).toHaveBeenCalledWith("org1", "token", "");

      rerender({ orgName: "org2" });

      await act(async () => {
        await result.current.fetchRepos();
      });

      expect(mockFetchRepos).toHaveBeenCalledWith("org2", "token", "");
    });

    it("handleCreate callback updates when orgName changes", async () => {
      mockCreateRepo.mockResolvedValue({
        data: { repository: createMockRepository() },
      } as any);

      const { result, rerender } = renderHook(
        ({ orgName }) => useOrganizationRepositories("token", orgName),
        {
          initialProps: { orgName: "org1" },
        },
      );

      await act(async () => {
        await result.current.handleCreate({ name: "test" });
      });

      expect(mockCreateRepo).toHaveBeenCalledWith("org1", { name: "test" });

      rerender({ orgName: "org2" });

      await act(async () => {
        await result.current.handleCreate({ name: "test" });
      });

      expect(mockCreateRepo).toHaveBeenCalledWith("org2", { name: "test" });
    });
  });

  describe("Integration scenarios", () => {
    it("handles fetch then create workflow", async () => {
      const existingRepo = createMockRepository({ id: "1", name: "existing" });
      const newRepo = createMockRepository({ id: "2", name: "new-repo" });

      mockFetchRepos.mockResolvedValueOnce(
        createMockApiResponse([existingRepo], 1),
      );

      mockCreateRepo.mockResolvedValueOnce({
        data: { repository: newRepo },
      } as any);

      const { result } = renderHook(() =>
        useOrganizationRepositories("token", "my-org"),
      );

      await act(async () => {
        await result.current.fetchRepos();
      });

      expect(result.current.repositories).toEqual([existingRepo]);

      let createdRepo: Repository | null = null;
      await act(async () => {
        createdRepo = await result.current.handleCreate({
          name: "new-repo",
        });
      });

      expect(createdRepo).toEqual(newRepo);
    });

    it("handles search then fetch workflow", async () => {
      const mockRepos = [createMockRepository({ id: "1", name: "react-app" })];

      mockFetchRepos.mockResolvedValueOnce(createMockApiResponse(mockRepos, 1));

      const { result } = renderHook(() =>
        useOrganizationRepositories("token", "my-org"),
      );

      act(() => {
        result.current.setSearchQuery("react");
      });

      expect(result.current.searchQuery).toBe("react");

      await act(async () => {
        await result.current.fetchRepos(result.current.searchQuery);
      });

      expect(mockFetchRepos).toHaveBeenCalledWith("my-org", "token", "react");
    });

    it("handles multiple repositories with pagination metadata", async () => {
      const manyRepos = Array.from({ length: 10 }, (_, i) =>
        createMockRepository({ id: `${i + 1}`, name: `repo-${i + 1}` }),
      );

      mockFetchRepos.mockResolvedValueOnce(
        createMockApiResponse(manyRepos, 50), // Total can be different from fetched
      );

      const { result } = renderHook(() =>
        useOrganizationRepositories("token", "my-org"),
      );

      await act(async () => {
        await result.current.fetchRepos();
      });

      expect(result.current.repositories).toHaveLength(10);
      expect(result.current.total).toBe(50);
    });

    it("handles error recovery after failed creation", async () => {
      mockCreateRepo.mockRejectedValueOnce({
        response: {
          data: {
            message: "Creation failed",
          },
        },
      });

      const { result } = renderHook(() =>
        useOrganizationRepositories("token", "my-org"),
      );

      await act(async () => {
        await result.current.handleCreate({ name: "fail-repo" });
      });

      expect(result.current.createError).toBe("Creation failed");

      const successRepo = createMockRepository({ name: "success-repo" });
      mockCreateRepo.mockResolvedValueOnce({
        data: { repository: successRepo },
      } as any);

      let createdRepo: Repository | null = null;
      await act(async () => {
        createdRepo = await result.current.handleCreate({
          name: "success-repo",
        });
      });

      expect(createdRepo).toEqual(successRepo);
      expect(result.current.createError).toBeNull();
    });
  });

  describe("Memory management and cleanup", () => {
    it("cleans up on unmount without errors", () => {
      const { unmount } = renderHook(() =>
        useOrganizationRepositories("token", "my-org"),
      );

      expect(() => unmount()).not.toThrow();
    });

    it("handles state updates on unmounted component gracefully", async () => {
      mockFetchRepos.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve(createMockApiResponse([], 0)), 100),
          ),
      );

      const { result, unmount } = renderHook(() =>
        useOrganizationRepositories("token", "my-org"),
      );

      const fetchPromise = act(() => result.current.fetchRepos());

      unmount();

      await expect(fetchPromise).resolves.not.toThrow();
    });
  });
});
