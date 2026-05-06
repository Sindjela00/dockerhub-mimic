import {
  Team,
  createOrganizationTeam,
  fetchOrganizationTeams,
} from "@/services/organizations/organizations.api";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useOrganizationTeams } from "./useOrganizationsTeams";

vi.mock("@/services/organizations/organizations.api", () => ({
  fetchOrganizationTeams: vi.fn(),
  createOrganizationTeam: vi.fn(),
}));

const TOKEN = "test-token";
const ORG_NAME = "acme";

const mockTeam = (id: number): Team => ({
  id,
  name: `team-${id}`,
  description: `Team ${id} description`,
  organizationName: ORG_NAME,
  memberCount: 2,
  repositoryCount: 1,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-02T00:00:00Z",
});

const mockTeamsResponse = (teams: Team[]) => ({
  organizationName: ORG_NAME,
  teams,
  total: teams.length,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("initial state", () => {
  it("exposes correct zero values", () => {
    const { result } = renderHook(() => useOrganizationTeams(TOKEN, ORG_NAME));

    expect(result.current.teams).toEqual([]);
    expect(result.current.total).toBe(0);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.searchQuery).toBe("");
  });

  it("does not auto-fetch on mount", () => {
    renderHook(() => useOrganizationTeams(TOKEN, ORG_NAME));

    expect(fetchOrganizationTeams).not.toHaveBeenCalled();
  });
});

describe("fetchTeams", () => {
  it("fetches and stores teams and total on success", async () => {
    const teams = [mockTeam(1), mockTeam(2)];
    vi.mocked(fetchOrganizationTeams).mockResolvedValueOnce(
      mockTeamsResponse(teams),
    );

    const { result } = renderHook(() => useOrganizationTeams(TOKEN, ORG_NAME));

    await act(async () => {
      await result.current.fetchTeams();
    });

    expect(fetchOrganizationTeams).toHaveBeenCalledWith(ORG_NAME, TOKEN, "");
    expect(result.current.teams).toEqual(teams);
    expect(result.current.total).toBe(2);
    expect(result.current.error).toBeNull();
  });

  it("defaults search to empty string when called with no argument", async () => {
    vi.mocked(fetchOrganizationTeams).mockResolvedValueOnce(
      mockTeamsResponse([]),
    );

    const { result } = renderHook(() => useOrganizationTeams(TOKEN, ORG_NAME));

    await act(async () => {
      await result.current.fetchTeams();
    });

    expect(fetchOrganizationTeams).toHaveBeenCalledWith(ORG_NAME, TOKEN, "");
  });

  it("passes the search argument through to the API", async () => {
    vi.mocked(fetchOrganizationTeams).mockResolvedValueOnce(
      mockTeamsResponse([]),
    );

    const { result } = renderHook(() => useOrganizationTeams(TOKEN, ORG_NAME));

    await act(async () => {
      await result.current.fetchTeams("eng");
    });

    expect(fetchOrganizationTeams).toHaveBeenCalledWith(ORG_NAME, TOKEN, "eng");
  });

  it("does nothing when orgName is undefined", async () => {
    const { result } = renderHook(() => useOrganizationTeams(TOKEN));

    await act(async () => {
      await result.current.fetchTeams();
    });

    expect(fetchOrganizationTeams).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
  });

  it("sets loading to true while fetching and false after", async () => {
    let resolve!: (v: ReturnType<typeof mockTeamsResponse>) => void;
    vi.mocked(fetchOrganizationTeams).mockReturnValueOnce(
      new Promise((r) => {
        resolve = r;
      }),
    );

    const { result } = renderHook(() => useOrganizationTeams(TOKEN, ORG_NAME));

    act(() => {
      result.current.fetchTeams();
    });

    expect(result.current.loading).toBe(true);

    act(() => {
      resolve(mockTeamsResponse([]));
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it("sets loading to false even when fetch throws", async () => {
    vi.mocked(fetchOrganizationTeams).mockRejectedValueOnce(
      new Error("Network error"),
    );

    const { result } = renderHook(() => useOrganizationTeams(TOKEN, ORG_NAME));

    await act(async () => {
      await result.current.fetchTeams();
    });

    expect(result.current.loading).toBe(false);
  });

  it("sets hardcoded error message on failure", async () => {
    vi.mocked(fetchOrganizationTeams).mockRejectedValueOnce(
      new Error("Server error"),
    );

    const { result } = renderHook(() => useOrganizationTeams(TOKEN, ORG_NAME));

    await act(async () => {
      await result.current.fetchTeams();
    });

    expect(result.current.error).toBe("Failed to load teams");
    expect(result.current.teams).toEqual([]);
    expect(result.current.total).toBe(0);
  });

  it("clears error before each fetch attempt", async () => {
    vi.mocked(fetchOrganizationTeams)
      .mockRejectedValueOnce(new Error("First failure"))
      .mockResolvedValueOnce(mockTeamsResponse([mockTeam(1)]));

    const { result } = renderHook(() => useOrganizationTeams(TOKEN, ORG_NAME));

    await act(async () => {
      await result.current.fetchTeams();
    });

    expect(result.current.error).toBe("Failed to load teams");

    await act(async () => {
      await result.current.fetchTeams();
    });

    expect(result.current.error).toBeNull();
  });

  it("replaces stale teams on re-fetch", async () => {
    const first = [mockTeam(1), mockTeam(2)];
    const second = [mockTeam(3)];

    vi.mocked(fetchOrganizationTeams)
      .mockResolvedValueOnce(mockTeamsResponse(first))
      .mockResolvedValueOnce(mockTeamsResponse(second));

    const { result } = renderHook(() => useOrganizationTeams(TOKEN, ORG_NAME));

    await act(async () => {
      await result.current.fetchTeams();
    });

    expect(result.current.teams).toEqual(first);
    expect(result.current.total).toBe(2);

    await act(async () => {
      await result.current.fetchTeams();
    });

    expect(result.current.teams).toEqual(second);
    expect(result.current.total).toBe(1);
  });

  it("uses updated token after re-render", async () => {
    vi.mocked(fetchOrganizationTeams).mockResolvedValue(mockTeamsResponse([]));

    const { result, rerender } = renderHook(
      ({ token }: { token: string }) => useOrganizationTeams(token, ORG_NAME),
      { initialProps: { token: TOKEN } },
    );

    rerender({ token: "new-token" });

    await act(async () => {
      await result.current.fetchTeams();
    });

    expect(fetchOrganizationTeams).toHaveBeenCalledWith(
      ORG_NAME,
      "new-token",
      "",
    );
  });

  it("uses updated orgName after re-render", async () => {
    vi.mocked(fetchOrganizationTeams).mockResolvedValue(mockTeamsResponse([]));

    const { result, rerender } = renderHook(
      ({ orgName }: { orgName: string }) =>
        useOrganizationTeams(TOKEN, orgName),
      { initialProps: { orgName: ORG_NAME } },
    );

    rerender({ orgName: "other-org" });

    await act(async () => {
      await result.current.fetchTeams();
    });

    expect(fetchOrganizationTeams).toHaveBeenCalledWith("other-org", TOKEN, "");
  });
});

describe("createTeam", () => {
  const payload = { name: "eng", description: "Engineering team" };

  it("calls createOrganizationTeam with the correct args", async () => {
    vi.mocked(createOrganizationTeam).mockResolvedValueOnce(mockTeam(10));
    vi.mocked(fetchOrganizationTeams).mockResolvedValueOnce(
      mockTeamsResponse([]),
    );

    const { result } = renderHook(() => useOrganizationTeams(TOKEN, ORG_NAME));

    await act(async () => {
      await result.current.createTeam(payload);
    });

    expect(createOrganizationTeam).toHaveBeenCalledWith(
      ORG_NAME,
      payload,
      TOKEN,
    );
  });

  it("re-fetches teams after successful creation", async () => {
    vi.mocked(createOrganizationTeam).mockResolvedValueOnce(mockTeam(10));
    vi.mocked(fetchOrganizationTeams).mockResolvedValueOnce(
      mockTeamsResponse([mockTeam(10)]),
    );

    const { result } = renderHook(() => useOrganizationTeams(TOKEN, ORG_NAME));

    await act(async () => {
      await result.current.createTeam(payload);
    });

    expect(fetchOrganizationTeams).toHaveBeenCalledTimes(1);
    expect(result.current.teams).toEqual([mockTeam(10)]);
  });

  it("re-fetches using the current searchQuery", async () => {
    vi.mocked(createOrganizationTeam).mockResolvedValueOnce(mockTeam(10));
    vi.mocked(fetchOrganizationTeams).mockResolvedValueOnce(
      mockTeamsResponse([]),
    );

    const { result } = renderHook(() => useOrganizationTeams(TOKEN, ORG_NAME));

    act(() => {
      result.current.setSearchQuery("eng");
    });

    await act(async () => {
      await result.current.createTeam(payload);
    });

    expect(fetchOrganizationTeams).toHaveBeenCalledWith(ORG_NAME, TOKEN, "eng");
  });

  it("does nothing when orgName is undefined", async () => {
    const { result } = renderHook(() => useOrganizationTeams(TOKEN));

    await act(async () => {
      await result.current.createTeam(payload);
    });

    expect(createOrganizationTeam).not.toHaveBeenCalled();
    expect(fetchOrganizationTeams).not.toHaveBeenCalled();
  });

  it("propagates errors thrown by createOrganizationTeam", async () => {
    vi.mocked(createOrganizationTeam).mockRejectedValueOnce(
      new Error("Duplicate team name"),
    );

    const { result } = renderHook(() => useOrganizationTeams(TOKEN, ORG_NAME));

    await expect(
      act(async () => {
        await result.current.createTeam(payload);
      }),
    ).rejects.toThrow("Duplicate team name");

    expect(fetchOrganizationTeams).not.toHaveBeenCalled();
  });

  it("reflects updated team list after create + re-fetch", async () => {
    const existing = [mockTeam(1)];
    const afterCreate = [mockTeam(1), mockTeam(2)];

    vi.mocked(fetchOrganizationTeams)
      .mockResolvedValueOnce(mockTeamsResponse(existing))
      .mockResolvedValueOnce(mockTeamsResponse(afterCreate));

    vi.mocked(createOrganizationTeam).mockResolvedValueOnce(mockTeam(2));

    const { result } = renderHook(() => useOrganizationTeams(TOKEN, ORG_NAME));

    await act(async () => {
      await result.current.fetchTeams();
    });

    expect(result.current.teams).toHaveLength(1);

    await act(async () => {
      await result.current.createTeam(payload);
    });

    expect(result.current.teams).toEqual(afterCreate);
    expect(result.current.total).toBe(2);
  });
});

describe("setSearchQuery", () => {
  it("updates searchQuery state", () => {
    const { result } = renderHook(() => useOrganizationTeams(TOKEN, ORG_NAME));

    act(() => {
      result.current.setSearchQuery("design");
    });

    expect(result.current.searchQuery).toBe("design");
  });

  it("can be cleared back to an empty string", () => {
    const { result } = renderHook(() => useOrganizationTeams(TOKEN, ORG_NAME));

    act(() => {
      result.current.setSearchQuery("design");
    });

    act(() => {
      result.current.setSearchQuery("");
    });

    expect(result.current.searchQuery).toBe("");
  });
});
