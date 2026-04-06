import * as api from "../repositories.api";

import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useTags } from "./useTags";

vi.mock("@/utils/formatSize", () => ({
  formatSize: (size: number) => `${size}B`,
}));

describe("useTags hook", () => {
  const repositoryId = 1;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches tags successfully", async () => {
    const mockData = {
      data: {
        tags: [
          { name: "v1.0", compressedSizeBytes: 1000 },
          { name: "v1.1", compressedSizeBytes: 2000 },
        ],
        total: 2,
        pullCount: 5,
      },
    };
    vi.spyOn(api, "getRepositoryTags").mockResolvedValue(mockData as any);

    const { result } = renderHook(() => useTags(repositoryId));

    // čekamo da loading postane false
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.tags).toEqual([
      { name: "v1.0", compressedSizeBytes: 1000, size: "1000B" },
      { name: "v1.1", compressedSizeBytes: 2000, size: "2000B" },
    ]);
    expect(result.current.total).toBe(2);
    expect(result.current.pullCount).toBe(5);
    expect(result.current.error).toBe("");
  });

  it("handles API error", async () => {
    vi.spyOn(api, "getRepositoryTags").mockRejectedValue({
      response: { data: { message: "API error" } },
    });

    const { result } = renderHook(() => useTags(repositoryId));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe("API error");
    expect(result.current.tags).toEqual([]);
  });

  it("updates search and resets page", async () => {
    vi.spyOn(api, "getRepositoryTags").mockResolvedValue({
      data: { tags: [], total: 0, pullCount: 0 },
    } as any);

    const { result } = renderHook(() => useTags(repositoryId));

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setSearch("test");
    });

    expect(result.current.search).toBe("test");
    expect(result.current.page).toBe(1);
  });

  it("changes sortBy and resets page", async () => {
    vi.spyOn(api, "getRepositoryTags").mockResolvedValue({
      data: { tags: [], total: 0, pullCount: 0 },
    } as any);

    const { result } = renderHook(() => useTags(repositoryId));

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setSortBy("name");
    });

    expect(result.current.sortBy).toBe("name");
    expect(result.current.page).toBe(1);
  });

  it("changes page", async () => {
    vi.spyOn(api, "getRepositoryTags").mockResolvedValue({
      data: { tags: [], total: 0, pullCount: 0 },
    } as any);

    const { result } = renderHook(() => useTags(repositoryId));

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.changePage(3);
    });

    expect(result.current.page).toBe(3);
  });
});
