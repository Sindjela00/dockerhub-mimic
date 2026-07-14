// src/services/repositories/useRepository/useRepository.test.ts

import * as api from "../repositories.api";

import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useRepository } from "./useRepository";

function createMockRepo(
  overrides: Partial<api.Repository> = {},
): api.Repository {
  return {
    id: 1,
    name: "Test Repository",
    fullName: "user/Test Repository",
    description: "A test repo",
    visibility: "public",
    ownerEmail: "user@example.com",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-02T00:00:00Z",
    isOfficial: false,
    starCount: 42,
    tags: ["tag1", "tag2"],
    ...overrides,
  };
}

describe("useRepository", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("loads repository successfully", async () => {
    vi.spyOn(api, "getRepositoryById").mockResolvedValue({
      data: createMockRepo(),
    });

    const { result } = renderHook(() => useRepository(1));

    // Pocetno stanje
    expect(result.current.repo).toBeNull();
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe("");

    await waitFor(() => expect(result.current.repo).toEqual(createMockRepo()));

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe("");
  });

  it("handles API error", async () => {
    vi.spyOn(api, "getRepositoryById").mockRejectedValue({
      response: { data: { message: "Not found" } },
    });

    const { result } = renderHook(() => useRepository(1));

    await waitFor(() => expect(result.current.error).toBe("Not found"));

    expect(result.current.repo).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it("falls back to a generic error message when the response has no message", async () => {
    vi.spyOn(api, "getRepositoryById").mockRejectedValue(new Error("boom"));

    const { result } = renderHook(() => useRepository(1));

    await waitFor(() =>
      expect(result.current.error).toBe("Failed to load repository."),
    );
  });

  it("does not update state after unmount when the load resolves late", async () => {
    let resolve!: (v: { data: api.Repository }) => void;
    vi.spyOn(api, "getRepositoryById").mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );

    const { result, unmount } = renderHook(() => useRepository(1));
    unmount();

    resolve({ data: createMockRepo() });

    // Give the resolved microtask a chance to run; state must stay untouched.
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.repo).toBeNull();
    expect(result.current.loading).toBe(true);
  });

  it("does not update state after unmount when the load rejects late", async () => {
    let reject!: (err: unknown) => void;
    vi.spyOn(api, "getRepositoryById").mockReturnValue(
      new Promise((_, r) => {
        reject = r;
      }),
    );

    const { result, unmount } = renderHook(() => useRepository(1));
    unmount();

    reject(new Error("late failure"));

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.error).toBe("");
    expect(result.current.loading).toBe(true);
  });

  it("handles missing ID", () => {
    const { result } = renderHook(() => useRepository(undefined));

    expect(result.current.repo).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe("Repository ID is missing.");
  });

  it("allows manually setting repo", () => {
    const { result } = renderHook(() => useRepository(undefined));

    act(() => {
      result.current.setRepo(createMockRepo());
    });

    expect(result.current.repo).toEqual(createMockRepo());
  });
});
