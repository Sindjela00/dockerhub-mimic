import * as repositoriesApi from "../repositories.api";

import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useRepositories } from "./useRepositories";

vi.mock("../repositories.api");

const mockGetMyRepositories = vi.mocked(repositoriesApi.getMyRepositories);

const MOCK_REPO = {
  id: 1,
  name: "nginx",
  fullName: "john.doe/nginx",
  description: "Official build of Nginx.",
  visibility: "public" as const,
  ownerEmail: "john@example.com",
  createdAt: "2023-01-15T08:00:00Z",
  updatedAt: "2025-03-10T12:00:00Z",
  isOfficial: false,
  starCount: 48,
  tags: ["latest"],
};

const MOCK_RESPONSE = {
  repositories: [MOCK_REPO],
  total: 1,
  page: 1,
  pageSize: 20,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetMyRepositories.mockResolvedValue({ data: MOCK_RESPONSE });
});

describe("useRepositories", () => {
  it("inicijalno stanje je prazno sa loading true", async () => {
    const { result } = renderHook(() => useRepositories());

    expect(result.current.loading).toBe(true);
    expect(result.current.repos).toEqual([]);
    expect(result.current.error).toBe("");

    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it("učitava repoe na mount-u", async () => {
    const { result } = renderHook(() => useRepositories());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.repos).toEqual([MOCK_REPO]);
    expect(result.current.total).toBe(1);
    expect(result.current.page).toBe(1);
    expect(result.current.pageSize).toBe(20);
    expect(result.current.error).toBe("");
  });

  it("koristi custom initialPageSize", async () => {
    renderHook(() => useRepositories(10));

    await waitFor(() =>
      expect(mockGetMyRepositories).toHaveBeenCalledWith({
        page: 1,
        pageSize: 10,
      }),
    );
  });

  it("fetchRepositories ažurira repos nakon poziva", async () => {
    const { result } = renderHook(() => useRepositories());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const newRepo = {
      ...MOCK_REPO,
      id: 2,
      name: "my-api",
      fullName: "john.doe/my-api",
    };
    mockGetMyRepositories.mockResolvedValueOnce({
      data: { repositories: [newRepo], total: 1, page: 1, pageSize: 20 },
    });

    await act(async () => {
      await result.current.fetchRepositories();
    });

    expect(result.current.repos).toEqual([newRepo]);
  });

  it("fetchRepositories postavlja loading na true tokom poziva", async () => {
    const { result } = renderHook(() => useRepositories());
    await waitFor(() => expect(result.current.loading).toBe(false));

    let resolvePromise!: (v: any) => void;
    mockGetMyRepositories.mockReturnValueOnce(
      new Promise((res) => {
        resolvePromise = res;
      }),
    );

    act(() => {
      result.current.fetchRepositories();
    });

    expect(result.current.loading).toBe(true);

    await act(async () => {
      resolvePromise({ data: MOCK_RESPONSE });
    });

    expect(result.current.loading).toBe(false);
  });

  it("postavlja error poruku iz response-a kad API ne uspe", async () => {
    mockGetMyRepositories.mockRejectedValueOnce({
      response: { data: { message: "Unauthorized." } },
    });

    const { result } = renderHook(() => useRepositories());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe("Unauthorized.");
    expect(result.current.repos).toEqual([]);
  });

  it("postavlja fallback error poruku kad nema response.data.message", async () => {
    mockGetMyRepositories.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useRepositories());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe("Failed to load repositories.");
  });

  it("resetuje error pre novog fetch-a", async () => {
    mockGetMyRepositories.mockRejectedValueOnce({
      response: { data: { message: "Unauthorized." } },
    });

    const { result } = renderHook(() => useRepositories());
    await waitFor(() => expect(result.current.error).toBe("Unauthorized."));

    mockGetMyRepositories.mockResolvedValueOnce({ data: MOCK_RESPONSE });

    await act(async () => {
      await result.current.fetchRepositories();
    });

    expect(result.current.error).toBe("");
  });
});
