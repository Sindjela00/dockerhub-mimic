import * as api from "../repositories.api";

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useRepositories } from "./useRepositories";

vi.mock("../repositories.api", () => ({
  getMyRepositories: vi.fn(),
}));

const mockedGetMyRepositories = api.getMyRepositories as unknown as ReturnType<
  typeof vi.fn
>;

describe("useRepositories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should have initial state", () => {
    const { result } = renderHook(() => useRepositories());

    expect(result.current.repos).toEqual([]);
    expect(result.current.total).toBe(0);
    expect(result.current.page).toBe(1);
    expect(result.current.pageSize).toBe(9);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe("");
  });

  it("should fetch repositories successfully", async () => {
    mockedGetMyRepositories.mockResolvedValueOnce({
      data: {
        repositories: [{ id: 1, name: "Repo 1" }],
        total: 1,
        page: 2,
        pageSize: 9,
      },
    });

    const { result } = renderHook(() => useRepositories());

    await act(async () => {
      await result.current.fetchRepositories(2);
    });

    expect(mockedGetMyRepositories).toHaveBeenCalledWith({
      page: 2,
      pageSize: 9,
    });

    expect(result.current.repos).toEqual([{ id: 1, name: "Repo 1" }]);
    expect(result.current.total).toBe(1);
    expect(result.current.page).toBe(2);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe("");
  });

  it("should pass all filters correctly", async () => {
    mockedGetMyRepositories.mockResolvedValueOnce({
      data: {
        repositories: [],
        total: 0,
        page: 1,
        pageSize: 9,
      },
    });

    const { result } = renderHook(() => useRepositories());

    await act(async () => {
      await result.current.fetchRepositories(
        1,
        true,
        "public",
        " test ",
        "stars",
        "desc",
        true,
      );
    });

    expect(mockedGetMyRepositories).toHaveBeenCalledWith({
      page: 1,
      pageSize: 9,
      mine: true,
      visibility: "public",
      search: "test", // trim check
      sortBy: "stars",
      sortDir: "desc",
      starred: true,
    });
  });

  it("should handle error correctly", async () => {
    mockedGetMyRepositories.mockRejectedValueOnce({
      response: {
        data: {
          message: "API error",
        },
      },
    });

    const { result } = renderHook(() => useRepositories());

    await act(async () => {
      await result.current.fetchRepositories();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe("API error");
  });

  it("should fallback to default error message", async () => {
    mockedGetMyRepositories.mockRejectedValueOnce(new Error("Unknown"));

    const { result } = renderHook(() => useRepositories());

    await act(async () => {
      await result.current.fetchRepositories();
    });

    expect(result.current.error).toBe("Failed to load repositories.");
  });

  it("should set loading true while fetching", async () => {
    let resolveFn: any;

    mockedGetMyRepositories.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFn = resolve;
        }),
    );

    const { result } = renderHook(() => useRepositories());

    act(() => {
      result.current.fetchRepositories();
    });

    expect(result.current.loading).toBe(true);

    await act(async () => {
      resolveFn({
        data: {
          repositories: [],
          total: 0,
          page: 1,
          pageSize: 9,
        },
      });
    });

    expect(result.current.loading).toBe(false);
  });
});
