import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { deleteOrganization, fetchOrganization } from "../organizations.api";

import { useOrganization } from "./useOrganization";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("../organizations.api", () => ({
  fetchOrganization: vi.fn(),
  deleteOrganization: vi.fn(),
}));

const ORG_NAME = "acme";

const mockOrg = {
  id: 1,
  name: "acme",
  displayName: "Acme Corp",
  description: "A test org",
  avatarUrl: null,
  ownerUsername: "alice",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-02T00:00:00Z",
  memberCount: 5,
  repositoryCount: 3,
  currentUserRole: "admin",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("initial fetch", () => {
  it("fetches the organization on mount and sets it", async () => {
    vi.mocked(fetchOrganization).mockResolvedValueOnce(mockOrg);

    const { result } = renderHook(() => useOrganization(ORG_NAME));

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(fetchOrganization).toHaveBeenCalledWith(ORG_NAME);
    expect(result.current.organization).toEqual(mockOrg);
    expect(result.current.error).toBeNull();
  });

  it("does not fetch when orgName is missing", () => {
    renderHook(() => useOrganization(undefined));

    expect(fetchOrganization).not.toHaveBeenCalled();
  });

  it("sets error state on fetch failure", async () => {
    vi.mocked(fetchOrganization).mockRejectedValueOnce(new Error("Not found"));

    const { result } = renderHook(() => useOrganization(ORG_NAME));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.organization).toBeNull();
    expect(result.current.error).toBe("Not found");
  });

  it("sets a generic error message for non-Error rejections", async () => {
    vi.mocked(fetchOrganization).mockRejectedValueOnce("something went wrong");

    const { result } = renderHook(() => useOrganization(ORG_NAME));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe("Unknown error");
  });

  it("resets error before each fetch attempt", async () => {
    vi.mocked(fetchOrganization)
      .mockRejectedValueOnce(new Error("First failure"))
      .mockResolvedValueOnce(mockOrg);

    const { result } = renderHook(() => useOrganization(ORG_NAME));

    await waitFor(() => expect(result.current.error).toBe("First failure"));

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.organization).toEqual(mockOrg);
  });
});

describe("loading state", () => {
  it("is true while fetching and false after resolution", async () => {
    let resolve!: (v: typeof mockOrg) => void;
    vi.mocked(fetchOrganization).mockReturnValueOnce(
      new Promise((r) => {
        resolve = r;
      }),
    );

    const { result } = renderHook(() => useOrganization(ORG_NAME));

    expect(result.current.loading).toBe(true);

    act(() => {
      resolve(mockOrg);
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it("sets loading to false even when fetch throws", async () => {
    vi.mocked(fetchOrganization).mockRejectedValueOnce(new Error("oops"));

    const { result } = renderHook(() => useOrganization(ORG_NAME));

    await waitFor(() => expect(result.current.loading).toBe(false));
  });
});

describe("refetch", () => {
  it("re-calls fetchOrganization when invoked manually", async () => {
    vi.mocked(fetchOrganization).mockResolvedValue(mockOrg);

    const { result } = renderHook(() => useOrganization(ORG_NAME));

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.refetch();
    });

    expect(fetchOrganization).toHaveBeenCalledTimes(2);
  });

  it("updates organization data on successful refetch", async () => {
    const updatedOrg = { ...mockOrg, displayName: "Acme Ltd" };
    vi.mocked(fetchOrganization)
      .mockResolvedValueOnce(mockOrg)
      .mockResolvedValueOnce(updatedOrg);

    const { result } = renderHook(() => useOrganization(ORG_NAME));

    await waitFor(() => expect(result.current.organization).toEqual(mockOrg));

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.organization).toEqual(updatedOrg);
  });
});

describe("remove", () => {
  it("calls deleteOrganization and navigates on success", async () => {
    vi.mocked(fetchOrganization).mockResolvedValue(mockOrg);
    vi.mocked(deleteOrganization).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useOrganization(ORG_NAME));

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.remove();
    });

    expect(deleteOrganization).toHaveBeenCalledWith(ORG_NAME);
    expect(mockNavigate).toHaveBeenCalledWith("/organizations", {
      replace: true,
    });
  });

  it("sets deleteLoading to true during deletion and false after", async () => {
    vi.mocked(fetchOrganization).mockResolvedValue(mockOrg);

    let resolve!: () => void;
    vi.mocked(deleteOrganization).mockReturnValueOnce(
      new Promise<void>((r) => {
        resolve = r;
      }),
    );

    const { result } = renderHook(() => useOrganization(ORG_NAME));

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.remove();
    });

    expect(result.current.deleteLoading).toBe(true);

    act(() => {
      resolve();
    });

    await waitFor(() => expect(result.current.deleteLoading).toBe(false));
  });
});

describe("dependency changes", () => {
  it("re-fetches when orgName changes", async () => {
    vi.mocked(fetchOrganization).mockResolvedValue(mockOrg);

    const { result, rerender } = renderHook(
      ({ orgName }: { orgName: string }) => useOrganization(orgName),
      { initialProps: { orgName: "acme" } },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    rerender({ orgName: "other-org" });

    await waitFor(() => expect(fetchOrganization).toHaveBeenCalledTimes(2));
    expect(fetchOrganization).toHaveBeenLastCalledWith("other-org");
  });
});
