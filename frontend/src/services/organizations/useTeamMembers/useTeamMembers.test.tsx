import {
  TeamMember,
  addTeamMember,
  fetchTeamMembers,
  removeTeamMember,
} from "@/services/organizations/organizations.api";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useTeamMembers } from "./useTeamMembers";

vi.mock("@/services/organizations/organizations.api", () => ({
  fetchTeamMembers: vi.fn(),
  addTeamMember: vi.fn(),
  removeTeamMember: vi.fn(),
}));

const ORG_NAME = "acme";
const TEAM_NAME = "eng";

const mockMember = (id: number): TeamMember => ({
  userId: id,
  username: `user${id}`,
  email: `user${id}@example.com`,
  addedAt: "2024-01-01T00:00:00Z",
});

const mockMembersResponse = (members: TeamMember[]) => ({
  teamName: TEAM_NAME,
  organizationName: ORG_NAME,
  members,
  total: members.length,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("initial state", () => {
  it("exposes correct zero values", () => {
    const { result } = renderHook(() =>
      useTeamMembers(ORG_NAME, TEAM_NAME),
    );

    expect(result.current.members).toEqual([]);
    expect(result.current.total).toBe(0);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("does not auto-fetch on mount", () => {
    renderHook(() => useTeamMembers(ORG_NAME, TEAM_NAME));

    expect(fetchTeamMembers).not.toHaveBeenCalled();
  });
});

describe("fetchMembers", () => {
  it("fetches and stores members and total on success", async () => {
    const members = [mockMember(1), mockMember(2)];
    vi.mocked(fetchTeamMembers).mockResolvedValueOnce(
      mockMembersResponse(members),
    );

    const { result } = renderHook(() =>
      useTeamMembers(ORG_NAME, TEAM_NAME),
    );

    await act(async () => {
      await result.current.fetchMembers();
    });

    expect(fetchTeamMembers).toHaveBeenCalledWith(ORG_NAME, TEAM_NAME);
    expect(result.current.members).toEqual(members);
    expect(result.current.total).toBe(2);
    expect(result.current.error).toBeNull();
  });

  it("does nothing when orgName is empty", async () => {
    const { result } = renderHook(() => useTeamMembers("", TEAM_NAME));

    await act(async () => {
      await result.current.fetchMembers();
    });

    expect(fetchTeamMembers).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
  });

  it("does nothing when teamName is empty", async () => {
    const { result } = renderHook(() => useTeamMembers(ORG_NAME, ""));

    await act(async () => {
      await result.current.fetchMembers();
    });

    expect(fetchTeamMembers).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
  });

  it("sets loading to true while fetching and false after", async () => {
    let resolve!: (v: ReturnType<typeof mockMembersResponse>) => void;
    vi.mocked(fetchTeamMembers).mockReturnValueOnce(
      new Promise((r) => {
        resolve = r;
      }),
    );

    const { result } = renderHook(() =>
      useTeamMembers(ORG_NAME, TEAM_NAME),
    );

    act(() => {
      result.current.fetchMembers();
    });

    expect(result.current.loading).toBe(true);

    act(() => {
      resolve(mockMembersResponse([]));
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it("sets loading to false in finally even on failure", async () => {
    vi.mocked(fetchTeamMembers).mockRejectedValueOnce(new Error("oops"));

    const { result } = renderHook(() =>
      useTeamMembers(ORG_NAME, TEAM_NAME),
    );

    await act(async () => {
      await result.current.fetchMembers();
    });

    expect(result.current.loading).toBe(false);
  });

  it("sets hardcoded error message on failure", async () => {
    vi.mocked(fetchTeamMembers).mockRejectedValueOnce(
      new Error("Server error"),
    );

    const { result } = renderHook(() =>
      useTeamMembers(ORG_NAME, TEAM_NAME),
    );

    await act(async () => {
      await result.current.fetchMembers();
    });

    expect(result.current.error).toBe("Failed to load members");
    expect(result.current.members).toEqual([]);
    expect(result.current.total).toBe(0);
  });

  it("clears error before each fetch attempt", async () => {
    vi.mocked(fetchTeamMembers)
      .mockRejectedValueOnce(new Error("First failure"))
      .mockResolvedValueOnce(mockMembersResponse([mockMember(1)]));

    const { result } = renderHook(() =>
      useTeamMembers(ORG_NAME, TEAM_NAME),
    );

    await act(async () => {
      await result.current.fetchMembers();
    });

    expect(result.current.error).toBe("Failed to load members");

    await act(async () => {
      await result.current.fetchMembers();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.members).toEqual([mockMember(1)]);
  });

  it("replaces stale members and total on re-fetch", async () => {
    const first = [mockMember(1), mockMember(2)];
    const second = [mockMember(3)];

    vi.mocked(fetchTeamMembers)
      .mockResolvedValueOnce(mockMembersResponse(first))
      .mockResolvedValueOnce(mockMembersResponse(second));

    const { result } = renderHook(() =>
      useTeamMembers(ORG_NAME, TEAM_NAME),
    );

    await act(async () => {
      await result.current.fetchMembers();
    });

    expect(result.current.members).toEqual(first);
    expect(result.current.total).toBe(2);

    await act(async () => {
      await result.current.fetchMembers();
    });

    expect(result.current.members).toEqual(second);
    expect(result.current.total).toBe(1);
  });

  it("uses updated orgName after re-render", async () => {
    vi.mocked(fetchTeamMembers).mockResolvedValue(mockMembersResponse([]));

    const { result, rerender } = renderHook(
      ({ orgName }: { orgName: string }) =>
        useTeamMembers(orgName, TEAM_NAME),
      { initialProps: { orgName: ORG_NAME } },
    );

    rerender({ orgName: "other-org" });

    await act(async () => {
      await result.current.fetchMembers();
    });

    expect(fetchTeamMembers).toHaveBeenCalledWith(
      "other-org",
      TEAM_NAME,
    );
  });

  it("uses updated teamName after re-render", async () => {
    vi.mocked(fetchTeamMembers).mockResolvedValue(mockMembersResponse([]));

    const { result, rerender } = renderHook(
      ({ teamName }: { teamName: string }) =>
        useTeamMembers(ORG_NAME, teamName),
      { initialProps: { teamName: TEAM_NAME } },
    );

    rerender({ teamName: "design" });

    await act(async () => {
      await result.current.fetchMembers();
    });

    expect(fetchTeamMembers).toHaveBeenCalledWith(ORG_NAME, "design");
  });
});

describe("addMember", () => {
  it("calls addTeamMember with the correct args", async () => {
    vi.mocked(addTeamMember).mockResolvedValueOnce(undefined);
    vi.mocked(fetchTeamMembers).mockResolvedValueOnce(mockMembersResponse([]));

    const { result } = renderHook(() =>
      useTeamMembers(ORG_NAME, TEAM_NAME),
    );

    await act(async () => {
      await result.current.addMember(99);
    });

    expect(addTeamMember).toHaveBeenCalledWith(ORG_NAME, TEAM_NAME, 99);
  });

  it("re-fetches members after a successful add", async () => {
    vi.mocked(addTeamMember).mockResolvedValueOnce(undefined);
    vi.mocked(fetchTeamMembers).mockResolvedValueOnce(
      mockMembersResponse([mockMember(99)]),
    );

    const { result } = renderHook(() =>
      useTeamMembers(ORG_NAME, TEAM_NAME),
    );

    await act(async () => {
      await result.current.addMember(99);
    });

    expect(fetchTeamMembers).toHaveBeenCalledTimes(1);
    expect(result.current.members).toEqual([mockMember(99)]);
    expect(result.current.total).toBe(1);
  });

  it("reflects updated member list after add + re-fetch", async () => {
    const existing = [mockMember(1)];
    const afterAdd = [mockMember(1), mockMember(2)];

    vi.mocked(fetchTeamMembers)
      .mockResolvedValueOnce(mockMembersResponse(existing))
      .mockResolvedValueOnce(mockMembersResponse(afterAdd));

    vi.mocked(addTeamMember).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() =>
      useTeamMembers(ORG_NAME, TEAM_NAME),
    );

    await act(async () => {
      await result.current.fetchMembers();
    });

    expect(result.current.members).toHaveLength(1);

    await act(async () => {
      await result.current.addMember(2);
    });

    expect(result.current.members).toEqual(afterAdd);
    expect(result.current.total).toBe(2);
  });

  it("propagates errors thrown by addTeamMember", async () => {
    vi.mocked(addTeamMember).mockRejectedValueOnce(
      new Error("Already a member"),
    );

    const { result } = renderHook(() =>
      useTeamMembers(ORG_NAME, TEAM_NAME),
    );

    await expect(
      act(async () => {
        await result.current.addMember(99);
      }),
    ).rejects.toThrow("Already a member");

    expect(fetchTeamMembers).not.toHaveBeenCalled();
  });
});

describe("removeMember", () => {
  it("calls removeTeamMember with the correct args", async () => {
    vi.mocked(fetchTeamMembers).mockResolvedValueOnce(
      mockMembersResponse([mockMember(1), mockMember(2)]),
    );
    vi.mocked(removeTeamMember).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() =>
      useTeamMembers(ORG_NAME, TEAM_NAME),
    );

    await act(async () => {
      await result.current.fetchMembers();
    });

    await act(async () => {
      await result.current.removeMember(1);
    });

    expect(removeTeamMember).toHaveBeenCalledWith(
      ORG_NAME,
      TEAM_NAME,
      1,
    );
  });

  it("removes the member from local state without re-fetching", async () => {
    vi.mocked(fetchTeamMembers).mockResolvedValueOnce(
      mockMembersResponse([mockMember(1), mockMember(2)]),
    );
    vi.mocked(removeTeamMember).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() =>
      useTeamMembers(ORG_NAME, TEAM_NAME),
    );

    await act(async () => {
      await result.current.fetchMembers();
    });

    await act(async () => {
      await result.current.removeMember(1);
    });

    expect(fetchTeamMembers).toHaveBeenCalledTimes(1);
    expect(result.current.members).toEqual([mockMember(2)]);
  });

  it("decrements total by one after removal", async () => {
    vi.mocked(fetchTeamMembers).mockResolvedValueOnce(
      mockMembersResponse([mockMember(1), mockMember(2), mockMember(3)]),
    );
    vi.mocked(removeTeamMember).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() =>
      useTeamMembers(ORG_NAME, TEAM_NAME),
    );

    await act(async () => {
      await result.current.fetchMembers();
    });

    expect(result.current.total).toBe(3);

    await act(async () => {
      await result.current.removeMember(2);
    });

    expect(result.current.total).toBe(2);
  });

  it("only removes the member with the matching userId", async () => {
    const members = [mockMember(1), mockMember(2), mockMember(3)];
    vi.mocked(fetchTeamMembers).mockResolvedValueOnce(
      mockMembersResponse(members),
    );
    vi.mocked(removeTeamMember).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() =>
      useTeamMembers(ORG_NAME, TEAM_NAME),
    );

    await act(async () => {
      await result.current.fetchMembers();
    });

    await act(async () => {
      await result.current.removeMember(2);
    });

    expect(result.current.members).toEqual([mockMember(1), mockMember(3)]);
  });

  it("propagates errors thrown by removeTeamMember", async () => {
    vi.mocked(fetchTeamMembers).mockResolvedValueOnce(
      mockMembersResponse([mockMember(1)]),
    );
    vi.mocked(removeTeamMember).mockRejectedValueOnce(new Error("Not found"));

    const { result } = renderHook(() =>
      useTeamMembers(ORG_NAME, TEAM_NAME),
    );

    await act(async () => {
      await result.current.fetchMembers();
    });

    await expect(
      act(async () => {
        await result.current.removeMember(1);
      }),
    ).rejects.toThrow("Not found");

    expect(result.current.members).toEqual([mockMember(1)]);
    expect(result.current.total).toBe(1);
  });

  it("can remove multiple members sequentially", async () => {
    vi.mocked(fetchTeamMembers).mockResolvedValueOnce(
      mockMembersResponse([mockMember(1), mockMember(2), mockMember(3)]),
    );
    vi.mocked(removeTeamMember).mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useTeamMembers(ORG_NAME, TEAM_NAME),
    );

    await act(async () => {
      await result.current.fetchMembers();
    });

    await act(async () => {
      await result.current.removeMember(1);
    });

    await act(async () => {
      await result.current.removeMember(3);
    });

    expect(result.current.members).toEqual([mockMember(2)]);
    expect(result.current.total).toBe(1);
  });
});
