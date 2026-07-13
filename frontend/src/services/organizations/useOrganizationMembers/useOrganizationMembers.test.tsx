import {
  OrganizationMember,
  fetchOrganizationMembers,
  inviteOrganizationMember,
} from "@/services/organizations/organizations.api";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useOrganizationMembers } from "./useOrganizationMembers";

vi.mock("@/services/organizations/organizations.api", () => ({
  fetchOrganizationMembers: vi.fn(),
  inviteOrganizationMember: vi.fn(),
}));

const ORG_NAME = "acme";

const mockMember = (id: number): OrganizationMember => ({
  userId: id,
  username: `user${id}`,
  email: `user${id}@example.com`,
  role: "member",
  addedAt: "2024-01-01T00:00:00Z",
});

const mockMembersResponse = (members: OrganizationMember[]) => ({
  organizationName: ORG_NAME,
  members,
  total: members.length,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("initial state", () => {
  it("starts with empty members, zero total, no loading, and no error", () => {
    const { result } = renderHook(() =>
      useOrganizationMembers(ORG_NAME),
    );

    expect(result.current.members).toEqual([]);
    expect(result.current.total).toBe(0);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.searchQuery).toBe("");
  });

  it("does not auto-fetch on mount", () => {
    renderHook(() => useOrganizationMembers(ORG_NAME));

    expect(fetchOrganizationMembers).not.toHaveBeenCalled();
  });
});

describe("fetchMembers", () => {
  it("fetches and stores members and total on success", async () => {
    const members = [mockMember(1), mockMember(2)];
    vi.mocked(fetchOrganizationMembers).mockResolvedValueOnce(
      mockMembersResponse(members),
    );

    const { result } = renderHook(() =>
      useOrganizationMembers(ORG_NAME),
    );

    await act(async () => {
      await result.current.fetchMembers();
    });

    expect(fetchOrganizationMembers).toHaveBeenCalledWith(ORG_NAME, "");
    expect(result.current.members).toEqual(members);
    expect(result.current.total).toBe(2);
    expect(result.current.error).toBeNull();
  });

  it("passes the search argument through to the API", async () => {
    vi.mocked(fetchOrganizationMembers).mockResolvedValueOnce(
      mockMembersResponse([]),
    );

    const { result } = renderHook(() =>
      useOrganizationMembers(ORG_NAME),
    );

    await act(async () => {
      await result.current.fetchMembers("alice");
    });

    expect(fetchOrganizationMembers).toHaveBeenCalledWith(
      ORG_NAME,
      "alice",
    );
  });

  it("defaults search to empty string when called with no argument", async () => {
    vi.mocked(fetchOrganizationMembers).mockResolvedValueOnce(
      mockMembersResponse([]),
    );

    const { result } = renderHook(() =>
      useOrganizationMembers(ORG_NAME),
    );

    await act(async () => {
      await result.current.fetchMembers();
    });

    expect(fetchOrganizationMembers).toHaveBeenCalledWith(ORG_NAME, "");
  });

  it("does nothing when orgName is undefined", async () => {
    const { result } = renderHook(() => useOrganizationMembers());

    await act(async () => {
      await result.current.fetchMembers();
    });

    expect(fetchOrganizationMembers).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
  });

  it("sets loading to true while fetching and false after", async () => {
    let resolve!: (v: ReturnType<typeof mockMembersResponse>) => void;
    vi.mocked(fetchOrganizationMembers).mockReturnValueOnce(
      new Promise((r) => {
        resolve = r;
      }),
    );

    const { result } = renderHook(() =>
      useOrganizationMembers(ORG_NAME),
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

  it("sets loading to false even when fetch throws", async () => {
    vi.mocked(fetchOrganizationMembers).mockRejectedValueOnce(
      new Error("Network error"),
    );

    const { result } = renderHook(() =>
      useOrganizationMembers(ORG_NAME),
    );

    await act(async () => {
      await result.current.fetchMembers();
    });

    expect(result.current.loading).toBe(false);
  });

  it("sets error message on fetch failure", async () => {
    vi.mocked(fetchOrganizationMembers).mockRejectedValueOnce(
      new Error("Server error"),
    );

    const { result } = renderHook(() =>
      useOrganizationMembers(ORG_NAME),
    );

    await act(async () => {
      await result.current.fetchMembers();
    });

    expect(result.current.error).toBe("Failed to load members");
    expect(result.current.members).toEqual([]);
    expect(result.current.total).toBe(0);
  });

  it("clears error before each fetch attempt", async () => {
    vi.mocked(fetchOrganizationMembers)
      .mockRejectedValueOnce(new Error("First failure"))
      .mockResolvedValueOnce(mockMembersResponse([mockMember(1)]));

    const { result } = renderHook(() =>
      useOrganizationMembers(ORG_NAME),
    );

    await act(async () => {
      await result.current.fetchMembers();
    });

    expect(result.current.error).toBe("Failed to load members");

    await act(async () => {
      await result.current.fetchMembers();
    });

    expect(result.current.error).toBeNull();
  });

  it("replaces stale members on re-fetch", async () => {
    const first = [mockMember(1), mockMember(2)];
    const second = [mockMember(3)];

    vi.mocked(fetchOrganizationMembers)
      .mockResolvedValueOnce(mockMembersResponse(first))
      .mockResolvedValueOnce(mockMembersResponse(second));

    const { result } = renderHook(() =>
      useOrganizationMembers(ORG_NAME),
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
});

describe("inviteMember", () => {
  it("calls inviteOrganizationMember with correct args", async () => {
    const payload = { email: "new@example.com", role: "member" };
    vi.mocked(inviteOrganizationMember).mockResolvedValueOnce(mockMember(99));
    vi.mocked(fetchOrganizationMembers).mockResolvedValueOnce(
      mockMembersResponse([]),
    );

    const { result } = renderHook(() =>
      useOrganizationMembers(ORG_NAME),
    );

    await act(async () => {
      await result.current.inviteMember(payload);
    });

    expect(inviteOrganizationMember).toHaveBeenCalledWith(
      ORG_NAME,
      payload,
    );
  });

  it("re-fetches members after a successful invite", async () => {
    const payload = { email: "new@example.com", role: "member" };
    vi.mocked(inviteOrganizationMember).mockResolvedValueOnce(mockMember(99));
    vi.mocked(fetchOrganizationMembers).mockResolvedValueOnce(
      mockMembersResponse([mockMember(1), mockMember(99)]),
    );

    const { result } = renderHook(() =>
      useOrganizationMembers(ORG_NAME),
    );

    await act(async () => {
      await result.current.inviteMember(payload);
    });

    expect(fetchOrganizationMembers).toHaveBeenCalledTimes(1);
    expect(result.current.members).toHaveLength(2);
  });

  it("re-fetches using the current searchQuery", async () => {
    vi.mocked(inviteOrganizationMember).mockResolvedValueOnce(mockMember(99));
    vi.mocked(fetchOrganizationMembers).mockResolvedValueOnce(
      mockMembersResponse([]),
    );

    const { result } = renderHook(() =>
      useOrganizationMembers(ORG_NAME),
    );

    act(() => {
      result.current.setSearchQuery("alice");
    });

    await act(async () => {
      await result.current.inviteMember({
        email: "new@example.com",
        role: "member",
      });
    });

    expect(fetchOrganizationMembers).toHaveBeenCalledWith(
      ORG_NAME,
      "alice",
    );
  });

  it("does nothing when orgName is undefined", async () => {
    const { result } = renderHook(() => useOrganizationMembers());

    await act(async () => {
      await result.current.inviteMember({
        email: "new@example.com",
        role: "member",
      });
    });

    expect(inviteOrganizationMember).not.toHaveBeenCalled();
    expect(fetchOrganizationMembers).not.toHaveBeenCalled();
  });

  it("propagates errors thrown by inviteOrganizationMember", async () => {
    vi.mocked(inviteOrganizationMember).mockRejectedValueOnce(
      new Error("Invite failed"),
    );

    const { result } = renderHook(() =>
      useOrganizationMembers(ORG_NAME),
    );

    await expect(
      act(async () => {
        await result.current.inviteMember({
          email: "new@example.com",
          role: "member",
        });
      }),
    ).rejects.toThrow("Invite failed");

    expect(fetchOrganizationMembers).not.toHaveBeenCalled();
  });
});

describe("setSearchQuery", () => {
  it("updates searchQuery state", () => {
    const { result } = renderHook(() =>
      useOrganizationMembers(ORG_NAME),
    );

    act(() => {
      result.current.setSearchQuery("bob");
    });

    expect(result.current.searchQuery).toBe("bob");
  });

  it("can be cleared back to empty string", () => {
    const { result } = renderHook(() =>
      useOrganizationMembers(ORG_NAME),
    );

    act(() => {
      result.current.setSearchQuery("bob");
    });

    act(() => {
      result.current.setSearchQuery("");
    });

    expect(result.current.searchQuery).toBe("");
  });
});

describe("dependency changes", () => {
  it("uses updated orgName when fetchMembers is called after orgName change", async () => {
    vi.mocked(fetchOrganizationMembers).mockResolvedValue(
      mockMembersResponse([]),
    );

    const { result, rerender } = renderHook(
      ({ orgName }: { orgName: string }) =>
        useOrganizationMembers(orgName),
      { initialProps: { orgName: ORG_NAME } },
    );

    rerender({ orgName: "other-org" });

    await act(async () => {
      await result.current.fetchMembers();
    });

    expect(fetchOrganizationMembers).toHaveBeenCalledWith(
      "other-org",
      "",
    );
  });
});
