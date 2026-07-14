import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createOrganization, fetchOrganizations } from "../organizations.api";

import { useOrganizations } from "./useOrganizations";

vi.mock("../organizations.api", () => ({
  fetchOrganizations: vi.fn(),
  createOrganization: vi.fn(),
}));

const mockOrg = (id: number) => ({
  id,
  name: `org-${id}`,
  displayName: `Org ${id}`,
  description: `Description ${id}`,
  avatarUrl: null,
  ownerUsername: "alice",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-02T00:00:00Z",
  memberCount: 2,
  repositoryCount: 1,
  currentUserRole: "admin",
});

const mockOrgsResponse = (
  orgs: ReturnType<typeof mockOrg>[],
  page = 1,
  pageSize = 12,
) => ({
  organizations: orgs,
  total: orgs.length,
  page,
  pageSize,
});

const createPayload = {
  name: "new-org",
  displayName: "New Org",
  description: "A brand new org",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("initial state", () => {
  it("exposes correct zero values", () => {
    const { result } = renderHook(() => useOrganizations());

    expect(result.current.orgs).toEqual([]);
    expect(result.current.total).toBe(0);
    expect(result.current.page).toBe(1);
    expect(result.current.pageSize).toBe(12);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.creating).toBe(false);
  });

  it("does not auto-fetch on mount", () => {
    renderHook(() => useOrganizations());

    expect(fetchOrganizations).not.toHaveBeenCalled();
  });
});

describe("fetchOrganizations", () => {
  it("fetches with default pagination args when called bare", async () => {
    vi.mocked(fetchOrganizations).mockResolvedValueOnce(
      mockOrgsResponse([mockOrg(1)]),
    );

    const { result } = renderHook(() => useOrganizations());

    await act(async () => {
      await result.current.fetchOrganizations();
    });

    expect(fetchOrganizations).toHaveBeenCalledWith({
      page: 1,
      pageSize: 12,
      search: undefined,
    });
  });

  it("forwards custom page, search, and pageSize to the API", async () => {
    vi.mocked(fetchOrganizations).mockResolvedValueOnce(
      mockOrgsResponse([], 2, 6),
    );

    const { result } = renderHook(() => useOrganizations());

    await act(async () => {
      await result.current.fetchOrganizations(2, "acme", 6);
    });

    expect(fetchOrganizations).toHaveBeenCalledWith({
      page: 2,
      pageSize: 6,
      search: "acme",
    });
  });

  it("stores orgs, total, page, and pageSize from the response", async () => {
    const orgs = [mockOrg(1), mockOrg(2)];
    vi.mocked(fetchOrganizations).mockResolvedValueOnce(
      mockOrgsResponse(orgs, 2, 6),
    );

    const { result } = renderHook(() => useOrganizations());

    await act(async () => {
      await result.current.fetchOrganizations(2, undefined, 6);
    });

    expect(result.current.orgs).toEqual(orgs);
    expect(result.current.total).toBe(2);
    expect(result.current.page).toBe(2);
    expect(result.current.pageSize).toBe(6);
    expect(result.current.error).toBeNull();
  });

  it("sets loading to true while fetching and false after", async () => {
    let resolve!: (v: ReturnType<typeof mockOrgsResponse>) => void;
    vi.mocked(fetchOrganizations).mockReturnValueOnce(
      new Promise((r) => {
        resolve = r;
      }),
    );

    const { result } = renderHook(() => useOrganizations());

    act(() => {
      result.current.fetchOrganizations();
    });

    expect(result.current.loading).toBe(true);

    act(() => {
      resolve(mockOrgsResponse([]));
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it("clears error before each fetch", async () => {
    vi.mocked(fetchOrganizations)
      .mockRejectedValueOnce(new Error("First failure"))
      .mockResolvedValueOnce(mockOrgsResponse([mockOrg(1)]));

    const { result } = renderHook(() => useOrganizations());

    await act(async () => {
      await result.current.fetchOrganizations();
    });

    expect(result.current.error).toBe("First failure");

    await act(async () => {
      await result.current.fetchOrganizations();
    });

    expect(result.current.error).toBeNull();
  });

  it("sets error from Error.message on failure", async () => {
    vi.mocked(fetchOrganizations).mockRejectedValueOnce(
      new Error("Network error"),
    );

    const { result } = renderHook(() => useOrganizations());

    await act(async () => {
      await result.current.fetchOrganizations();
    });

    expect(result.current.error).toBe("Network error");
    expect(result.current.loading).toBe(false);
  });

  it("sets 'Unknown error' for non-Error rejections", async () => {
    vi.mocked(fetchOrganizations).mockRejectedValueOnce("something bad");

    const { result } = renderHook(() => useOrganizations());

    await act(async () => {
      await result.current.fetchOrganizations();
    });

    expect(result.current.error).toBe("Unknown error");
  });

  it("replaces stale orgs on re-fetch", async () => {
    const first = [mockOrg(1), mockOrg(2)];
    const second = [mockOrg(3)];

    vi.mocked(fetchOrganizations)
      .mockResolvedValueOnce(mockOrgsResponse(first))
      .mockResolvedValueOnce(mockOrgsResponse(second));

    const { result } = renderHook(() => useOrganizations());

    await act(async () => {
      await result.current.fetchOrganizations();
    });

    expect(result.current.orgs).toEqual(first);

    await act(async () => {
      await result.current.fetchOrganizations();
    });

    expect(result.current.orgs).toEqual(second);
    expect(result.current.total).toBe(1);
  });
});

describe("addOrganization", () => {
  it("calls createOrganization with the payload", async () => {
    vi.mocked(createOrganization).mockResolvedValueOnce(mockOrg(10));
    vi.mocked(fetchOrganizations).mockResolvedValueOnce(mockOrgsResponse([]));

    const { result } = renderHook(() => useOrganizations());

    await act(async () => {
      await result.current.addOrganization(createPayload);
    });

    expect(createOrganization).toHaveBeenCalledWith(createPayload);
  });

  it("returns { success: true, data } on success", async () => {
    const created = mockOrg(10);
    vi.mocked(createOrganization).mockResolvedValueOnce(created);
    vi.mocked(fetchOrganizations).mockResolvedValueOnce(mockOrgsResponse([]));

    const { result } = renderHook(() => useOrganizations());

    let response: Awaited<ReturnType<typeof result.current.addOrganization>>;
    await act(async () => {
      response = await result.current.addOrganization(createPayload);
    });

    expect(response!).toEqual({ success: true, data: created });
  });

  it("re-fetches the current page after creation", async () => {
    vi.mocked(createOrganization).mockResolvedValueOnce(mockOrg(10));
    vi.mocked(fetchOrganizations).mockResolvedValueOnce(
      mockOrgsResponse([mockOrg(10)]),
    );

    const { result } = renderHook(() => useOrganizations());

    await act(async () => {
      await result.current.addOrganization(createPayload);
    });

    expect(fetchOrganizations).toHaveBeenCalledTimes(1);
    expect(fetchOrganizations).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, pageSize: 12 }),
    );
  });

  it("re-fetches using current page and pageSize from state", async () => {
    vi.mocked(fetchOrganizations)
      .mockResolvedValueOnce(mockOrgsResponse([], 2, 6))
      .mockResolvedValueOnce(mockOrgsResponse([]));
    vi.mocked(createOrganization).mockResolvedValueOnce(mockOrg(10));

    const { result } = renderHook(() => useOrganizations());

    await act(async () => {
      await result.current.fetchOrganizations(2, undefined, 6);
    });

    await act(async () => {
      await result.current.addOrganization(createPayload);
    });

    expect(fetchOrganizations).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 2, pageSize: 6 }),
    );
  });

  it("sets creating to true while in-flight and false after success", async () => {
    let resolve!: (v: ReturnType<typeof mockOrg>) => void;
    vi.mocked(createOrganization).mockReturnValueOnce(
      new Promise((r) => {
        resolve = r;
      }),
    );
    vi.mocked(fetchOrganizations).mockResolvedValue(mockOrgsResponse([]));

    const { result } = renderHook(() => useOrganizations());

    act(() => {
      result.current.addOrganization(createPayload);
    });

    expect(result.current.creating).toBe(true);

    act(() => {
      resolve(mockOrg(10));
    });

    await waitFor(() => expect(result.current.creating).toBe(false));
  });

  it("clears error before creating", async () => {
    vi.mocked(fetchOrganizations).mockRejectedValueOnce(
      new Error("Stale error"),
    );

    const { result } = renderHook(() => useOrganizations());

    await act(async () => {
      await result.current.fetchOrganizations();
    });

    expect(result.current.error).toBe("Stale error");

    vi.mocked(createOrganization).mockResolvedValueOnce(mockOrg(10));
    vi.mocked(fetchOrganizations).mockResolvedValueOnce(mockOrgsResponse([]));

    await act(async () => {
      await result.current.addOrganization(createPayload);
    });

    expect(result.current.error).toBeNull();
  });

  it("returns { success: false, error } when createOrganization throws an Error", async () => {
    vi.mocked(createOrganization).mockRejectedValueOnce(
      new Error("Duplicate name"),
    );

    const { result } = renderHook(() => useOrganizations());

    let response: Awaited<ReturnType<typeof result.current.addOrganization>>;
    await act(async () => {
      response = await result.current.addOrganization(createPayload);
    });

    expect(response!).toEqual({ success: false, error: "Duplicate name" });
    expect(result.current.error).toBe("Duplicate name");
    expect(result.current.creating).toBe(false);
  });

  it("returns 'Failed to create organization' for non-Error rejections", async () => {
    vi.mocked(createOrganization).mockRejectedValueOnce("unknown");

    const { result } = renderHook(() => useOrganizations());

    let response: Awaited<ReturnType<typeof result.current.addOrganization>>;
    await act(async () => {
      response = await result.current.addOrganization(createPayload);
    });

    expect(response!).toEqual({
      success: false,
      error: "Failed to create organization",
    });
    expect(result.current.error).toBe("Failed to create organization");
  });

  it("does not call fetchOrganizations when createOrganization fails", async () => {
    vi.mocked(createOrganization).mockRejectedValueOnce(
      new Error("Server error"),
    );

    const { result } = renderHook(() => useOrganizations());

    await act(async () => {
      await result.current.addOrganization(createPayload);
    });

    expect(fetchOrganizations).not.toHaveBeenCalled();
  });

  it("sets creating to false after failure", async () => {
    vi.mocked(createOrganization).mockRejectedValueOnce(
      new Error("Server error"),
    );

    const { result } = renderHook(() => useOrganizations());

    await act(async () => {
      await result.current.addOrganization(createPayload);
    });

    expect(result.current.creating).toBe(false);
  });
});
