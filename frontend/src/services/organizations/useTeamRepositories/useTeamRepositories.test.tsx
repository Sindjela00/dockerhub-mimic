import {
  AddTeamRepositoryPayload,
  TeamRepository,
  addTeamRepository,
  fetchOrganizationRepositories,
  fetchTeamRepositories,
  removeRepositoryFromTeam,
} from "@/services/organizations/organizations.api";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Repository } from "@/services/repositories/repositories.api";
import { useTeamRepositories } from "./useTeamRepositories";

vi.mock("@/services/organizations/organizations.api", () => ({
  fetchTeamRepositories: vi.fn(),
  fetchOrganizationRepositories: vi.fn(),
  addTeamRepository: vi.fn(),
  removeRepositoryFromTeam: vi.fn(),
}));

const ORG_NAME = "acme";
const TEAM_NAME = "eng";

const mockTeamRepo = (id: number): TeamRepository => ({
  repositoryId: id,
  repositoryName: `repo-${id}`,
  fullName: `${ORG_NAME}/repo-${id}`,
  permission: "read",
});

const mockOrgRepo = (id: number): Repository => ({
  id,
  name: `repo-${id}`,
  fullName: `${ORG_NAME}/repo-${id}`,
  description: `Repo ${id}`,
  visibility: "public",
  defaultBranch: "main",
  language: null,
  starCount: 0,
  forkCount: 0,
  openIssueCount: 0,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-02T00:00:00Z",
  owner: { username: "alice" },
});

const mockTeamReposResponse = (repos: TeamRepository[]) => ({
  teamName: TEAM_NAME,
  organizationName: ORG_NAME,
  repositories: repos,
  total: repos.length,
});

const mockOrgReposResponse = (repos: Repository[]) => ({
  repositories: repos,
  total: repos.length,
});

const setupSuccessfulFetch = (
  teamRepos: TeamRepository[] = [],
  orgRepos: Repository[] = [],
) => {
  vi.mocked(fetchTeamRepositories).mockResolvedValueOnce(
    mockTeamReposResponse(teamRepos),
  );
  vi.mocked(fetchOrganizationRepositories).mockResolvedValueOnce(
    mockOrgReposResponse(orgRepos),
  );
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("initial state", () => {
  it("exposes correct zero values", () => {
    const { result } = renderHook(() =>
      useTeamRepositories(ORG_NAME, TEAM_NAME),
    );

    expect(result.current.repositories).toEqual([]);
    expect(result.current.orgRepositories).toEqual([]);
    expect(result.current.total).toBe(0);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("does not auto-fetch on mount", () => {
    renderHook(() => useTeamRepositories(ORG_NAME, TEAM_NAME));

    expect(fetchTeamRepositories).not.toHaveBeenCalled();
    expect(fetchOrganizationRepositories).not.toHaveBeenCalled();
  });
});

describe("fetchRepos", () => {
  it("fires both API calls in parallel and stores results", async () => {
    const teamRepos = [mockTeamRepo(1), mockTeamRepo(2)];
    const orgRepos = [mockOrgRepo(1), mockOrgRepo(2), mockOrgRepo(3)];
    setupSuccessfulFetch(teamRepos, orgRepos);

    const { result } = renderHook(() =>
      useTeamRepositories(ORG_NAME, TEAM_NAME),
    );

    await act(async () => {
      await result.current.fetchRepos();
    });

    expect(fetchTeamRepositories).toHaveBeenCalledWith(
      ORG_NAME,
      TEAM_NAME,
    );
    expect(fetchOrganizationRepositories).toHaveBeenCalledWith(ORG_NAME);
    expect(result.current.repositories).toEqual(teamRepos);
    expect(result.current.orgRepositories).toEqual(orgRepos);
    expect(result.current.total).toBe(2);
    expect(result.current.error).toBeNull();
  });

  it("fires both calls concurrently (Promise.all)", async () => {
    const order: string[] = [];

    vi.mocked(fetchTeamRepositories).mockImplementationOnce(async () => {
      order.push("team");
      return mockTeamReposResponse([]);
    });
    vi.mocked(fetchOrganizationRepositories).mockImplementationOnce(
      async () => {
        order.push("org");
        return mockOrgReposResponse([]);
      },
    );

    const { result } = renderHook(() =>
      useTeamRepositories(ORG_NAME, TEAM_NAME),
    );

    await act(async () => {
      await result.current.fetchRepos();
    });

    expect(order).toContain("team");
    expect(order).toContain("org");
    expect(fetchTeamRepositories).toHaveBeenCalledTimes(1);
    expect(fetchOrganizationRepositories).toHaveBeenCalledTimes(1);
  });

  it("does nothing when orgName is empty", async () => {
    const { result } = renderHook(() =>
      useTeamRepositories("", TEAM_NAME),
    );

    await act(async () => {
      await result.current.fetchRepos();
    });

    expect(fetchTeamRepositories).not.toHaveBeenCalled();
    expect(fetchOrganizationRepositories).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
  });

  it("does nothing when teamName is empty", async () => {
    const { result } = renderHook(() =>
      useTeamRepositories(ORG_NAME, ""),
    );

    await act(async () => {
      await result.current.fetchRepos();
    });

    expect(fetchTeamRepositories).not.toHaveBeenCalled();
    expect(fetchOrganizationRepositories).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
  });

  it("sets loading to true while fetching and false after", async () => {
    let resolve!: (v: ReturnType<typeof mockTeamReposResponse>) => void;
    vi.mocked(fetchTeamRepositories).mockReturnValueOnce(
      new Promise((r) => {
        resolve = r;
      }),
    );
    vi.mocked(fetchOrganizationRepositories).mockResolvedValueOnce(
      mockOrgReposResponse([]),
    );

    const { result } = renderHook(() =>
      useTeamRepositories(ORG_NAME, TEAM_NAME),
    );

    act(() => {
      result.current.fetchRepos();
    });

    expect(result.current.loading).toBe(true);

    act(() => {
      resolve(mockTeamReposResponse([]));
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it("sets loading to false in finally even when one call fails", async () => {
    vi.mocked(fetchTeamRepositories).mockRejectedValueOnce(new Error("oops"));
    vi.mocked(fetchOrganizationRepositories).mockResolvedValueOnce(
      mockOrgReposResponse([]),
    );

    const { result } = renderHook(() =>
      useTeamRepositories(ORG_NAME, TEAM_NAME),
    );

    await act(async () => {
      await result.current.fetchRepos();
    });

    expect(result.current.loading).toBe(false);
  });

  it("sets hardcoded error message when fetchTeamRepositories fails", async () => {
    vi.mocked(fetchTeamRepositories).mockRejectedValueOnce(
      new Error("Server error"),
    );
    vi.mocked(fetchOrganizationRepositories).mockResolvedValueOnce(
      mockOrgReposResponse([]),
    );

    const { result } = renderHook(() =>
      useTeamRepositories(ORG_NAME, TEAM_NAME),
    );

    await act(async () => {
      await result.current.fetchRepos();
    });

    expect(result.current.error).toBe("Failed to load repositories");
    expect(result.current.repositories).toEqual([]);
    expect(result.current.orgRepositories).toEqual([]);
  });

  it("sets hardcoded error message when fetchOrganizationRepositories fails", async () => {
    vi.mocked(fetchTeamRepositories).mockResolvedValueOnce(
      mockTeamReposResponse([mockTeamRepo(1)]),
    );
    vi.mocked(fetchOrganizationRepositories).mockRejectedValueOnce(
      new Error("Forbidden"),
    );

    const { result } = renderHook(() =>
      useTeamRepositories(ORG_NAME, TEAM_NAME),
    );

    await act(async () => {
      await result.current.fetchRepos();
    });

    expect(result.current.error).toBe("Failed to load repositories");
  });

  it("clears error before each fetch attempt", async () => {
    vi.mocked(fetchTeamRepositories).mockRejectedValueOnce(
      new Error("First failure"),
    );
    vi.mocked(fetchOrganizationRepositories).mockRejectedValueOnce(
      new Error("First failure"),
    );

    const { result } = renderHook(() =>
      useTeamRepositories(ORG_NAME, TEAM_NAME),
    );

    await act(async () => {
      await result.current.fetchRepos();
    });

    expect(result.current.error).toBe("Failed to load repositories");

    setupSuccessfulFetch([mockTeamRepo(1)], [mockOrgRepo(1)]);

    await act(async () => {
      await result.current.fetchRepos();
    });

    expect(result.current.error).toBeNull();
  });

  it("replaces stale data on re-fetch", async () => {
    setupSuccessfulFetch([mockTeamRepo(1)], [mockOrgRepo(1)]);

    const { result } = renderHook(() =>
      useTeamRepositories(ORG_NAME, TEAM_NAME),
    );

    await act(async () => {
      await result.current.fetchRepos();
    });

    expect(result.current.repositories).toHaveLength(1);

    setupSuccessfulFetch([mockTeamRepo(2), mockTeamRepo(3)], [mockOrgRepo(2)]);

    await act(async () => {
      await result.current.fetchRepos();
    });

    expect(result.current.repositories).toEqual([
      mockTeamRepo(2),
      mockTeamRepo(3),
    ]);
    expect(result.current.total).toBe(2);
    expect(result.current.orgRepositories).toEqual([mockOrgRepo(2)]);
  });

  it("uses updated orgName after re-render", async () => {
    setupSuccessfulFetch();

    const { result, rerender } = renderHook(
      ({ orgName }: { orgName: string }) =>
        useTeamRepositories(orgName, TEAM_NAME),
      { initialProps: { orgName: ORG_NAME } },
    );

    rerender({ orgName: "other-org" });
    setupSuccessfulFetch();

    await act(async () => {
      await result.current.fetchRepos();
    });

    expect(fetchTeamRepositories).toHaveBeenLastCalledWith(
      "other-org",
      TEAM_NAME,
    );
    expect(fetchOrganizationRepositories).toHaveBeenLastCalledWith(
      "other-org",
    );
  });

  it("uses updated teamName after re-render", async () => {
    setupSuccessfulFetch();

    const { result, rerender } = renderHook(
      ({ teamName }: { teamName: string }) =>
        useTeamRepositories(ORG_NAME, teamName),
      { initialProps: { teamName: TEAM_NAME } },
    );

    rerender({ teamName: "design" });
    setupSuccessfulFetch();

    await act(async () => {
      await result.current.fetchRepos();
    });

    expect(fetchTeamRepositories).toHaveBeenLastCalledWith(
      ORG_NAME,
      "design",
    );
  });
});

describe("addRepository", () => {
  const payload: AddTeamRepositoryPayload = {
    repositoryId: 5,
    permission: "write",
  };

  it("calls addTeamRepository with the correct args", async () => {
    vi.mocked(addTeamRepository).mockResolvedValueOnce({
      message: "added",
      teamRepository: mockTeamRepo(5),
    });
    setupSuccessfulFetch();

    const { result } = renderHook(() =>
      useTeamRepositories(ORG_NAME, TEAM_NAME),
    );

    await act(async () => {
      await result.current.addRepository(payload);
    });

    expect(addTeamRepository).toHaveBeenCalledWith(
      ORG_NAME,
      TEAM_NAME,
      payload,
    );
  });

  it("propagates errors thrown by addTeamRepository", async () => {
    vi.mocked(addTeamRepository).mockRejectedValueOnce(
      new Error("Already added"),
    );

    const { result } = renderHook(() =>
      useTeamRepositories(ORG_NAME, TEAM_NAME),
    );

    await expect(
      act(async () => {
        await result.current.addRepository(payload);
      }),
    ).rejects.toThrow("Already added");

    expect(fetchTeamRepositories).not.toHaveBeenCalled();
    expect(fetchOrganizationRepositories).not.toHaveBeenCalled();
  });
});

describe("removeRepository", () => {
  it("calls removeRepositoryFromTeam with the correct args", async () => {
    setupSuccessfulFetch([mockTeamRepo(1)], [mockOrgRepo(1)]);
    vi.mocked(removeRepositoryFromTeam).mockResolvedValueOnce(undefined);
    setupSuccessfulFetch([], [mockOrgRepo(1)]);

    const { result } = renderHook(() =>
      useTeamRepositories(ORG_NAME, TEAM_NAME),
    );

    await act(async () => {
      await result.current.fetchRepos();
    });

    await act(async () => {
      await result.current.removeRepository(1);
    });

    expect(removeRepositoryFromTeam).toHaveBeenCalledWith(
      ORG_NAME,
      TEAM_NAME,
      1,
    );
  });
});
