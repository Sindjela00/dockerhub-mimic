import * as repositoriesApi from "../repositories.api";

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useCreateRepository } from "./useCreateRepository";

vi.mock("../repositories.api");

const mockCreateRepository = vi.mocked(repositoriesApi.createRepository);

const MOCK_REPO = {
  id: 1,
  name: "my-image",
  fullName: "john.doe/my-image",
  description: "My description",
  visibility: "public" as const,
  ownerEmail: "john@example.com",
  createdAt: "2025-03-10T12:00:00Z",
  updatedAt: "2025-03-10T12:00:00Z",
  isOfficial: false,
  starCount: 0,
  tags: [],
};

const PAYLOAD = {
  name: "my-image",
  description: "My description",
  visibility: "public" as const,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useCreateRepository", () => {
  it("inicijalno stanje — loading false, error prazan", () => {
    const { result } = renderHook(() => useCreateRepository());

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe("");
  });

  it("vraca repository nakon uspesnog kreiranja", async () => {
    mockCreateRepository.mockResolvedValueOnce({
      data: {
        message: "Repository created successfully.",
        repository: MOCK_REPO,
      },
    });

    const { result } = renderHook(() => useCreateRepository());

    let repo;
    await act(async () => {
      repo = await result.current.handleCreate(PAYLOAD);
    });

    expect(repo).toEqual(MOCK_REPO);
  });

  it("poziva createRepository sa ispravnim payload-om", async () => {
    mockCreateRepository.mockResolvedValueOnce({
      data: { message: "Created.", repository: MOCK_REPO },
    });

    const { result } = renderHook(() => useCreateRepository());

    await act(async () => {
      await result.current.handleCreate(PAYLOAD);
    });

    expect(mockCreateRepository).toHaveBeenCalledWith(PAYLOAD);
  });

  it("poziva createRepository sa private visibility", async () => {
    mockCreateRepository.mockResolvedValueOnce({
      data: {
        message: "Created.",
        repository: { ...MOCK_REPO, visibility: "private" },
      },
    });

    const { result } = renderHook(() => useCreateRepository());

    await act(async () => {
      await result.current.handleCreate({ ...PAYLOAD, visibility: "private" });
    });

    expect(mockCreateRepository).toHaveBeenCalledWith({
      ...PAYLOAD,
      visibility: "private",
    });
  });

  it("error je prazan nakon uspesnog kreiranja", async () => {
    mockCreateRepository.mockResolvedValueOnce({
      data: { message: "Created.", repository: MOCK_REPO },
    });

    const { result } = renderHook(() => useCreateRepository());

    await act(async () => {
      await result.current.handleCreate(PAYLOAD);
    });

    expect(result.current.error).toBe("");
  });

  it("loading je true tokom poziva", async () => {
    let resolvePromise!: (v: any) => void;
    mockCreateRepository.mockReturnValueOnce(
      new Promise((res) => {
        resolvePromise = res;
      }),
    );

    const { result } = renderHook(() => useCreateRepository());

    act(() => {
      result.current.handleCreate(PAYLOAD);
    });

    expect(result.current.loading).toBe(true);

    await act(async () => {
      resolvePromise({ data: { message: "Created.", repository: MOCK_REPO } });
    });

    expect(result.current.loading).toBe(false);
  });

  it("loading je false nakon uspesnog poziva", async () => {
    mockCreateRepository.mockResolvedValueOnce({
      data: { message: "Created.", repository: MOCK_REPO },
    });

    const { result } = renderHook(() => useCreateRepository());

    await act(async () => {
      await result.current.handleCreate(PAYLOAD);
    });

    expect(result.current.loading).toBe(false);
  });

  it("vraca null kad API ne uspe", async () => {
    mockCreateRepository.mockRejectedValueOnce({
      response: { data: { message: "Name already taken." } },
    });

    const { result } = renderHook(() => useCreateRepository());

    let repo;
    await act(async () => {
      repo = await result.current.handleCreate(PAYLOAD);
    });

    expect(repo).toBeNull();
  });

  it("postavlja error poruku iz response-a", async () => {
    mockCreateRepository.mockRejectedValueOnce({
      response: { data: { message: "Name already taken." } },
    });

    const { result } = renderHook(() => useCreateRepository());

    await act(async () => {
      await result.current.handleCreate(PAYLOAD);
    });

    expect(result.current.error).toBe("Name already taken.");
  });

  it("postavlja fallback error poruku kad nema response.data.message", async () => {
    mockCreateRepository.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useCreateRepository());

    await act(async () => {
      await result.current.handleCreate(PAYLOAD);
    });

    expect(result.current.error).toBe("Failed to create repository.");
  });

  it("loading je false cak i kad API ne uspe", async () => {
    mockCreateRepository.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useCreateRepository());

    await act(async () => {
      await result.current.handleCreate(PAYLOAD);
    });

    expect(result.current.loading).toBe(false);
  });

  it("resetuje error pre novog pokusaja", async () => {
    mockCreateRepository.mockRejectedValueOnce({
      response: { data: { message: "Name already taken." } },
    });

    const { result } = renderHook(() => useCreateRepository());

    await act(async () => {
      await result.current.handleCreate(PAYLOAD);
    });

    expect(result.current.error).toBe("Name already taken.");

    mockCreateRepository.mockResolvedValueOnce({
      data: { message: "Created.", repository: MOCK_REPO },
    });

    await act(async () => {
      await result.current.handleCreate(PAYLOAD);
    });

    expect(result.current.error).toBe("");
  });
});
