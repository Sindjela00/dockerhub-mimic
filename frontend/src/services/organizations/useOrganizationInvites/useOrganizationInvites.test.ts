import {
  OrganizationInvite,
  cancelMemberInvite,
  fetchMembersInvites,
} from "../organizations.api";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useOrganizationInvites } from "./useOrganizationInvites";

vi.mock("../organizations.api", () => ({
  fetchMembersInvites: vi.fn(),
  cancelMemberInvite: vi.fn(),
}));

const TOKEN = "test-token";
const ORG_NAME = "acme";

const mockInvite = (id: number): OrganizationInvite => ({
  id,
  organizationName: ORG_NAME,
  email: `user${id}@example.com`,
  role: "member",
  status: "pending",
  invitedByUsername: "alice",
  expiresAt: "2024-02-01T00:00:00Z",
  createdAt: "2024-01-01T00:00:00Z",
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("initial state", () => {
  it("starts with empty invites, no loading, and no error", () => {
    vi.mocked(fetchMembersInvites).mockResolvedValue([]);

    const { result } = renderHook(() =>
      useOrganizationInvites(TOKEN, ORG_NAME),
    );

    expect(result.current.invites).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("does not auto-fetch on mount", () => {
    renderHook(() => useOrganizationInvites(TOKEN, ORG_NAME));

    expect(fetchMembersInvites).not.toHaveBeenCalled();
  });
});

describe("fetchInvites", () => {
  it("fetches and stores invites on success", async () => {
    const invites = [mockInvite(1), mockInvite(2)];
    vi.mocked(fetchMembersInvites).mockResolvedValueOnce(invites);

    const { result } = renderHook(() =>
      useOrganizationInvites(TOKEN, ORG_NAME),
    );

    await act(async () => {
      await result.current.fetchInvites();
    });

    expect(fetchMembersInvites).toHaveBeenCalledWith(ORG_NAME, TOKEN);
    expect(result.current.invites).toEqual(invites);
    expect(result.current.error).toBeNull();
  });

  it("sets loading to true during fetch and false after", async () => {
    let resolve!: (v: OrganizationInvite[]) => void;
    vi.mocked(fetchMembersInvites).mockReturnValueOnce(
      new Promise((r) => {
        resolve = r;
      }),
    );

    const { result } = renderHook(() =>
      useOrganizationInvites(TOKEN, ORG_NAME),
    );

    act(() => {
      result.current.fetchInvites();
    });

    expect(result.current.loading).toBe(true);

    act(() => {
      resolve([]);
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it("sets loading to false even when fetch throws", async () => {
    vi.mocked(fetchMembersInvites).mockRejectedValueOnce(new Error("oops"));

    const { result } = renderHook(() =>
      useOrganizationInvites(TOKEN, ORG_NAME),
    );

    await act(async () => {
      await result.current.fetchInvites();
    });

    expect(result.current.loading).toBe(false);
  });

  it("sets error message on fetch failure", async () => {
    vi.mocked(fetchMembersInvites).mockRejectedValueOnce(
      new Error("Network error"),
    );

    const { result } = renderHook(() =>
      useOrganizationInvites(TOKEN, ORG_NAME),
    );

    await act(async () => {
      await result.current.fetchInvites();
    });

    expect(result.current.error).toBe("Failed to load invites.");
    expect(result.current.invites).toEqual([]);
  });

  it("clears error before each fetch attempt", async () => {
    vi.mocked(fetchMembersInvites)
      .mockRejectedValueOnce(new Error("First failure"))
      .mockResolvedValueOnce([mockInvite(1)]);

    const { result } = renderHook(() =>
      useOrganizationInvites(TOKEN, ORG_NAME),
    );

    await act(async () => {
      await result.current.fetchInvites();
    });

    expect(result.current.error).toBe("Failed to load invites.");

    await act(async () => {
      await result.current.fetchInvites();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.invites).toEqual([mockInvite(1)]);
  });

  it("replaces stale invites with fresh data on re-fetch", async () => {
    const first = [mockInvite(1), mockInvite(2)];
    const second = [mockInvite(3)];

    vi.mocked(fetchMembersInvites)
      .mockResolvedValueOnce(first)
      .mockResolvedValueOnce(second);

    const { result } = renderHook(() =>
      useOrganizationInvites(TOKEN, ORG_NAME),
    );

    await act(async () => {
      await result.current.fetchInvites();
    });

    expect(result.current.invites).toEqual(first);

    await act(async () => {
      await result.current.fetchInvites();
    });

    expect(result.current.invites).toEqual(second);
  });
});

describe("cancelInvite", () => {
  it("calls cancelMemberInvite with the correct args", async () => {
    vi.mocked(cancelMemberInvite).mockResolvedValueOnce(undefined);
    vi.mocked(fetchMembersInvites).mockResolvedValue([]);

    const { result } = renderHook(() =>
      useOrganizationInvites(TOKEN, ORG_NAME),
    );

    await act(async () => {
      await result.current.cancelInvite(5);
    });

    expect(cancelMemberInvite).toHaveBeenCalledWith(5, ORG_NAME, TOKEN);
  });

  it("re-fetches invites after cancellation", async () => {
    vi.mocked(cancelMemberInvite).mockResolvedValueOnce(undefined);
    vi.mocked(fetchMembersInvites).mockResolvedValue([mockInvite(2)]);

    const { result } = renderHook(() =>
      useOrganizationInvites(TOKEN, ORG_NAME),
    );

    await act(async () => {
      await result.current.cancelInvite(1);
    });

    expect(fetchMembersInvites).toHaveBeenCalledTimes(1);
    expect(result.current.invites).toEqual([mockInvite(2)]);
  });

  it("reflects updated invite list after cancel removes an entry", async () => {
    const remaining = [mockInvite(2)];

    vi.mocked(fetchMembersInvites)
      .mockResolvedValueOnce([mockInvite(1), mockInvite(2)])
      .mockResolvedValueOnce(remaining);

    vi.mocked(cancelMemberInvite).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() =>
      useOrganizationInvites(TOKEN, ORG_NAME),
    );

    await act(async () => {
      await result.current.fetchInvites();
    });

    expect(result.current.invites).toHaveLength(2);

    await act(async () => {
      await result.current.cancelInvite(1);
    });

    expect(result.current.invites).toEqual(remaining);
  });

  it("propagates errors thrown by cancelMemberInvite", async () => {
    vi.mocked(cancelMemberInvite).mockRejectedValueOnce(
      new Error("Cancel failed"),
    );

    const { result } = renderHook(() =>
      useOrganizationInvites(TOKEN, ORG_NAME),
    );

    await expect(
      act(async () => {
        await result.current.cancelInvite(5);
      }),
    ).rejects.toThrow("Cancel failed");

    expect(fetchMembersInvites).not.toHaveBeenCalled();
  });
});

describe("dependency changes", () => {
  it("uses updated token when fetchInvites is called after token change", async () => {
    vi.mocked(fetchMembersInvites).mockResolvedValue([]);

    const { result, rerender } = renderHook(
      ({ token }: { token: string }) => useOrganizationInvites(token, ORG_NAME),
      { initialProps: { token: TOKEN } },
    );

    rerender({ token: "new-token" });

    await act(async () => {
      await result.current.fetchInvites();
    });

    expect(fetchMembersInvites).toHaveBeenCalledWith(ORG_NAME, "new-token");
  });

  it("uses updated orgName when fetchInvites is called after orgName change", async () => {
    vi.mocked(fetchMembersInvites).mockResolvedValue([]);

    const { result, rerender } = renderHook(
      ({ orgName }: { orgName: string }) =>
        useOrganizationInvites(TOKEN, orgName),
      { initialProps: { orgName: ORG_NAME } },
    );

    rerender({ orgName: "other-org" });

    await act(async () => {
      await result.current.fetchInvites();
    });

    expect(fetchMembersInvites).toHaveBeenCalledWith("other-org", TOKEN);
  });
});
