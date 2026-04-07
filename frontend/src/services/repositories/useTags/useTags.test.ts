import * as api from "../repositories.api";

import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useTags } from "./useTags";

vi.mock("@/utils/formatSize", () => ({
  formatSize: (size: number) => `${size}B`,
}));

const mockEmptyResponse = {
  data: { tags: [], total: 0, pullCount: 0 },
};

describe("useTags hook", () => {
  const repositoryId = 1;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("ne poziva API kada je repositoryId null", async () => {
    const spy = vi.spyOn(api, "getRepositoryTags");

    const { result } = renderHook(() => useTags(null));

    expect(spy).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
    expect(result.current.tags).toEqual([]);
  });

  it("uspesno ucitava tagove", async () => {
    vi.spyOn(api, "getRepositoryTags").mockResolvedValue({
      data: {
        tags: [
          { name: "v1.0", compressedSizeBytes: 1000 },
          { name: "v1.1", compressedSizeBytes: 2000 },
        ],
        total: 2,
        pullCount: 5,
      },
    } as any);

    const { result } = renderHook(() => useTags(repositoryId));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.tags).toEqual([
      { name: "v1.0", compressedSizeBytes: 1000, size: "1000B" },
      { name: "v1.1", compressedSizeBytes: 2000, size: "2000B" },
    ]);
    expect(result.current.total).toBe(2);
    expect(result.current.pullCount).toBe(5);
    expect(result.current.error).toBe("");
  });

  it("postavlja loading na true tokom fetcha", async () => {
    let resolve: (v: any) => void;
    vi.spyOn(api, "getRepositoryTags").mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );

    const { result } = renderHook(() => useTags(repositoryId));

    expect(result.current.loading).toBe(true);

    act(() => resolve(mockEmptyResponse));
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it("hvata gresku sa response.data.message", async () => {
    vi.spyOn(api, "getRepositoryTags").mockRejectedValue({
      response: { data: { message: "API error" } },
    });

    const { result } = renderHook(() => useTags(repositoryId));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe("API error");
    expect(result.current.tags).toEqual([]);
  });

  it("koristi fallback poruku kada nema response.data.message", async () => {
    vi.spyOn(api, "getRepositoryTags").mockRejectedValue(
      new Error("Network error"),
    );

    const { result } = renderHook(() => useTags(repositoryId));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe("Failed to load tags.");
  });

  it("resetuje gresku pri sledećem uspesnom fetchu", async () => {
    const spy = vi
      .spyOn(api, "getRepositoryTags")
      .mockRejectedValueOnce({ response: { data: { message: "greška" } } })
      .mockResolvedValue(mockEmptyResponse as any);

    const { result } = renderHook(() => useTags(repositoryId));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("greška");

    act(() => result.current.refetch());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe("");
  });

  it("setSearch azurira pretragu i resetuje stranicu na 1", async () => {
    vi.spyOn(api, "getRepositoryTags").mockResolvedValue(
      mockEmptyResponse as any,
    );

    const { result } = renderHook(() => useTags(repositoryId));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.changePage(3));
    await waitFor(() => expect(result.current.page).toBe(3));

    act(() => result.current.setSearch("alpine"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.search).toBe("alpine");
    expect(result.current.page).toBe(1);
  });

  it("setSortBy azurira sortiranje i resetuje stranicu na 1", async () => {
    vi.spyOn(api, "getRepositoryTags").mockResolvedValue(
      mockEmptyResponse as any,
    );

    const { result } = renderHook(() => useTags(repositoryId));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.changePage(2));
    await waitFor(() => expect(result.current.page).toBe(2));

    act(() => result.current.setSortBy("name"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.sortBy).toBe("name");
    expect(result.current.page).toBe(1);
  });

  it("setSortDir azurira smer sortiranja i resetuje stranicu na 1", async () => {
    vi.spyOn(api, "getRepositoryTags").mockResolvedValue(
      mockEmptyResponse as any,
    );

    const { result } = renderHook(() => useTags(repositoryId));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.changePage(4));
    await waitFor(() => expect(result.current.page).toBe(4));

    act(() => result.current.setSortDir("asc"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.sortDir).toBe("asc");
    expect(result.current.page).toBe(1);
  });

  it("changePage azurira trenutnu stranicu", async () => {
    vi.spyOn(api, "getRepositoryTags").mockResolvedValue(
      mockEmptyResponse as any,
    );

    const { result } = renderHook(() => useTags(repositoryId));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.changePage(3));
    await waitFor(() => expect(result.current.page).toBe(3));
  });

  it("setPageSize ayurira veličinu stranice", async () => {
    vi.spyOn(api, "getRepositoryTags").mockResolvedValue(
      mockEmptyResponse as any,
    );

    const { result } = renderHook(() => useTags(repositoryId));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.setPageSize(25));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.pageSize).toBe(25);
  });

  it("refetch ponovo poziva API", async () => {
    const spy = vi
      .spyOn(api, "getRepositoryTags")
      .mockResolvedValue(mockEmptyResponse as any);

    const { result } = renderHook(() => useTags(repositoryId));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const callsBefore = spy.mock.calls.length;

    act(() => result.current.refetch());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(spy.mock.calls.length).toBeGreaterThan(callsBefore);
  });

  it("deleteTags ne radi nista kada je repositoryId null", async () => {
    const deleteSpy = vi
      .spyOn(api, "deleteTag")
      .mockResolvedValue(undefined as any);

    const { result } = renderHook(() => useTags(null));

    await act(async () => {
      await result.current.deleteTags(["v1.0"]);
    });

    expect(deleteSpy).not.toHaveBeenCalled();
  });

  it("deleteTags brise tagove i poziva refetch", async () => {
    vi.spyOn(api, "getRepositoryTags").mockResolvedValue(
      mockEmptyResponse as any,
    );
    const deleteSpy = vi
      .spyOn(api, "deleteTag")
      .mockResolvedValue(undefined as any);

    const { result } = renderHook(() => useTags(repositoryId));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.deleteTags(["v1.0", "v1.1"]);
    });

    expect(deleteSpy).toHaveBeenCalledTimes(2);
    expect(deleteSpy).toHaveBeenCalledWith(repositoryId, "v1.0");
    expect(deleteSpy).toHaveBeenCalledWith(repositoryId, "v1.1");
  });

  it("vraca ispravne inicijalne vrednosti", () => {
    vi.spyOn(api, "getRepositoryTags").mockResolvedValue(
      mockEmptyResponse as any,
    );

    const { result } = renderHook(() => useTags(repositoryId));

    expect(result.current.page).toBe(1);
    expect(result.current.pageSize).toBe(10);
    expect(result.current.search).toBe("");
    expect(result.current.sortBy).toBe("createdat");
    expect(result.current.sortDir).toBe("desc");
    expect(result.current.total).toBe(0);
    expect(result.current.pullCount).toBe(0);
  });
});
