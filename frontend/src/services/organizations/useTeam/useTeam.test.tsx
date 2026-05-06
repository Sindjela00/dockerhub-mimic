import {
  Team,
  deleteTeam,
  fetchTeam,
  updateTeam,
} from "@/services/organizations/organizations.api";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useTeam } from "./UseTeam";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("@/services/organizations/organizations.api", () => ({
  fetchTeam: vi.fn(),
  deleteTeam: vi.fn(),
  updateTeam: vi.fn(),
}));

const TOKEN = "test-token";
const ORG_NAME = "acme";
const TEAM_NAME = "eng";

const mockTeam = (overrides: Partial<Team> = {}): Team => ({
  id: 1,
  name: TEAM_NAME,
  description: "Engineering team",
  organizationName: ORG_NAME,
  memberCount: 4,
  repositoryCount: 2,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-02T00:00:00Z",
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("initial fetch", () => {
  it("fetches the team on mount and stores it", async () => {
    vi.mocked(fetchTeam).mockResolvedValueOnce(mockTeam());

    const { result } = renderHook(() => useTeam(TOKEN, ORG_NAME, TEAM_NAME));

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(fetchTeam).toHaveBeenCalledWith(ORG_NAME, TEAM_NAME, TOKEN);
    expect(result.current.team).toEqual(mockTeam());
    expect(result.current.error).toBeNull();
  });

  it("does not fetch when orgName is empty", async () => {
    renderHook(() => useTeam(TOKEN, "", TEAM_NAME));

    await waitFor(() => expect(fetchTeam).not.toHaveBeenCalled());
  });

  it("does not fetch when teamName is empty", async () => {
    renderHook(() => useTeam(TOKEN, ORG_NAME, ""));

    await waitFor(() => expect(fetchTeam).not.toHaveBeenCalled());
  });

  it("sets hardcoded error message on fetch failure", async () => {
    vi.mocked(fetchTeam).mockRejectedValueOnce(new Error("Not found"));

    const { result } = renderHook(() => useTeam(TOKEN, ORG_NAME, TEAM_NAME));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.team).toBeNull();
    expect(result.current.error).toBe("Failed to load team");
  });

  it("sets loading to false in finally even on failure", async () => {
    vi.mocked(fetchTeam).mockRejectedValueOnce(new Error("oops"));

    const { result } = renderHook(() => useTeam(TOKEN, ORG_NAME, TEAM_NAME));

    await waitFor(() => expect(result.current.loading).toBe(false));
  });
});

describe("refetch", () => {
  it("re-calls fetchTeam when invoked manually", async () => {
    vi.mocked(fetchTeam).mockResolvedValue(mockTeam());

    const { result } = renderHook(() => useTeam(TOKEN, ORG_NAME, TEAM_NAME));

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.refetch();
    });

    expect(fetchTeam).toHaveBeenCalledTimes(2);
  });

  it("clears error before each refetch", async () => {
    vi.mocked(fetchTeam)
      .mockRejectedValueOnce(new Error("First failure"))
      .mockResolvedValueOnce(mockTeam());

    const { result } = renderHook(() => useTeam(TOKEN, ORG_NAME, TEAM_NAME));

    await waitFor(() =>
      expect(result.current.error).toBe("Failed to load team"),
    );

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.team).toEqual(mockTeam());
  });

  it("updates team data on successful refetch", async () => {
    const updated = mockTeam({ description: "Updated description" });
    vi.mocked(fetchTeam)
      .mockResolvedValueOnce(mockTeam())
      .mockResolvedValueOnce(updated);

    const { result } = renderHook(() => useTeam(TOKEN, ORG_NAME, TEAM_NAME));

    await waitFor(() => expect(result.current.team).toEqual(mockTeam()));

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.team).toEqual(updated);
  });

  it("re-fetches when orgName changes", async () => {
    vi.mocked(fetchTeam).mockResolvedValue(mockTeam());

    const { result, rerender } = renderHook(
      ({ orgName }: { orgName: string }) => useTeam(TOKEN, orgName, TEAM_NAME),
      { initialProps: { orgName: ORG_NAME } },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    rerender({ orgName: "other-org" });

    await waitFor(() => expect(fetchTeam).toHaveBeenCalledTimes(2));
    expect(fetchTeam).toHaveBeenLastCalledWith("other-org", TEAM_NAME, TOKEN);
  });

  it("re-fetches when teamName changes", async () => {
    vi.mocked(fetchTeam).mockResolvedValue(mockTeam());

    const { result, rerender } = renderHook(
      ({ teamName }: { teamName: string }) =>
        useTeam(TOKEN, ORG_NAME, teamName),
      { initialProps: { teamName: TEAM_NAME } },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    rerender({ teamName: "design" });

    await waitFor(() => expect(fetchTeam).toHaveBeenCalledTimes(2));
    expect(fetchTeam).toHaveBeenLastCalledWith(ORG_NAME, "design", TOKEN);
  });

  it("re-fetches when token changes", async () => {
    vi.mocked(fetchTeam).mockResolvedValue(mockTeam());

    const { result, rerender } = renderHook(
      ({ token }: { token: string }) => useTeam(token, ORG_NAME, TEAM_NAME),
      { initialProps: { token: TOKEN } },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    rerender({ token: "new-token" });

    await waitFor(() => expect(fetchTeam).toHaveBeenCalledTimes(2));
    expect(fetchTeam).toHaveBeenLastCalledWith(
      ORG_NAME,
      TEAM_NAME,
      "new-token",
    );
  });
});

describe("deleteTeam", () => {
  it("calls deleteTeam with correct args and navigates on success", async () => {
    vi.mocked(fetchTeam).mockResolvedValue(mockTeam());
    vi.mocked(deleteTeam).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useTeam(TOKEN, ORG_NAME, TEAM_NAME));

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.deleteTeam();
    });

    expect(deleteTeam).toHaveBeenCalledWith(ORG_NAME, TEAM_NAME, TOKEN);
    expect(mockNavigate).toHaveBeenCalledWith(`/organizations/${ORG_NAME}`, {
      replace: true,
    });
  });

  it("sets deleteLoading to true during deletion and false after", async () => {
    vi.mocked(fetchTeam).mockResolvedValue(mockTeam());

    let resolve!: () => void;
    vi.mocked(deleteTeam).mockReturnValueOnce(
      new Promise<void>((r) => {
        resolve = r;
      }),
    );

    const { result } = renderHook(() => useTeam(TOKEN, ORG_NAME, TEAM_NAME));

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.deleteTeam();
    });

    expect(result.current.deleteLoading).toBe(true);

    act(() => {
      resolve();
    });

    await waitFor(() => expect(result.current.deleteLoading).toBe(false));
  });

  it("sets deleteLoading to false in finally even on failure", async () => {
    vi.mocked(fetchTeam).mockResolvedValue(mockTeam());
    vi.mocked(deleteTeam).mockRejectedValueOnce(new Error("Server error"));

    const { result } = renderHook(() => useTeam(TOKEN, ORG_NAME, TEAM_NAME));

    await waitFor(() => expect(result.current.loading).toBe(false));

    await expect(
      act(async () => {
        await result.current.deleteTeam();
      }),
    ).rejects.toThrow("Delete failed");

    expect(result.current.deleteLoading).toBe(false);
  });
});

describe("updateTeam", () => {
  it("calls updateTeam with correct args and stores the result", async () => {
    const payload = { name: TEAM_NAME, description: "Updated description" };
    const updated = mockTeam({ description: "Updated description" });

    vi.mocked(fetchTeam).mockResolvedValue(mockTeam());
    vi.mocked(updateTeam).mockResolvedValueOnce(updated);

    const { result } = renderHook(() => useTeam(TOKEN, ORG_NAME, TEAM_NAME));

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updateTeam(payload);
    });

    expect(updateTeam).toHaveBeenCalledWith(
      ORG_NAME,
      TEAM_NAME,
      payload,
      TOKEN,
    );
    expect(result.current.team).toEqual(updated);
  });

  it("does not navigate when the team name is unchanged", async () => {
    const payload = { name: TEAM_NAME, description: "New description" };

    vi.mocked(fetchTeam).mockResolvedValue(mockTeam());
    vi.mocked(updateTeam).mockResolvedValueOnce(
      mockTeam({ description: "New description" }),
    );

    const { result } = renderHook(() => useTeam(TOKEN, ORG_NAME, TEAM_NAME));

    await waitFor(() => expect(result.current.loading).toBe(false));

    mockNavigate.mockClear();

    await act(async () => {
      await result.current.updateTeam(payload);
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("navigates to the new team URL when the name changes", async () => {
    const payload = { name: "design", description: "Design team" };
    const updated = mockTeam({ name: "design" });

    vi.mocked(fetchTeam).mockResolvedValue(mockTeam());
    vi.mocked(updateTeam).mockResolvedValueOnce(updated);

    const { result } = renderHook(() => useTeam(TOKEN, ORG_NAME, TEAM_NAME));

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updateTeam(payload);
    });

    expect(mockNavigate).toHaveBeenCalledWith(
      `/organizations/${ORG_NAME}/teams/design`,
      { replace: true },
    );
  });

  it("propagates errors thrown by updateTeam API", async () => {
    vi.mocked(fetchTeam).mockResolvedValue(mockTeam());
    vi.mocked(updateTeam).mockRejectedValueOnce(new Error("Conflict"));

    const { result } = renderHook(() => useTeam(TOKEN, ORG_NAME, TEAM_NAME));

    await waitFor(() => expect(result.current.loading).toBe(false));

    await expect(
      act(async () => {
        await result.current.updateTeam({ name: "design", description: "" });
      }),
    ).rejects.toThrow("Conflict");

    expect(result.current.team).toEqual(mockTeam());
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("updates team state even when the name is different", async () => {
    const payload = { name: "platform", description: "Platform team" };
    const updated = mockTeam({
      name: "platform",
      description: "Platform team",
    });

    vi.mocked(fetchTeam).mockResolvedValue(mockTeam());
    vi.mocked(updateTeam).mockResolvedValueOnce(updated);

    const { result } = renderHook(() => useTeam(TOKEN, ORG_NAME, TEAM_NAME));

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updateTeam(payload);
    });

    expect(result.current.team).toEqual(updated);
  });
});
