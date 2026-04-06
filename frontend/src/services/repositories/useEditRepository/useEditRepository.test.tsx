// useEditRepository.test.ts

import * as api from "../repositories.api";

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RepoVisibility } from "@/pages/RepositoriesPage/types/types";
import type { Repository } from "../repositories.api";
import { useEditRepository } from "./useEditRepository";

describe("useEditRepository", () => {
  const mockRepo: Pick<
    Repository,
    "id" | "name" | "description" | "visibility"
  > = {
    id: 1,
    name: "Test Repo",
    description: "Test description",
    visibility: "public" as RepoVisibility,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should have initial state", () => {
    const { result } = renderHook(() => useEditRepository());

    expect(result.current.saving).toBe(false);
    expect(result.current.error).toBe("");
    expect(typeof result.current.update).toBe("function");
  });

  it("should call updateRepository and set saving correctly on success", async () => {
    const updateSpy = vi
      .spyOn(api, "updateRepository")
      .mockResolvedValueOnce({} as any);

    const { result } = renderHook(() => useEditRepository());

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.update(mockRepo);
    });

    expect(updateSpy).toHaveBeenCalledWith(mockRepo.id, {
      name: mockRepo.name,
      description: mockRepo.description,
      visibility: mockRepo.visibility,
    });
    expect(success).toBe(true);
    expect(result.current.saving).toBe(false);
    expect(result.current.error).toBe("");
  });

  it("should set error on failure with message", async () => {
    const errorMessage = "Network error";
    vi.spyOn(api, "updateRepository").mockRejectedValueOnce({
      response: { data: { message: errorMessage } },
    } as any);

    const { result } = renderHook(() => useEditRepository());

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.update(mockRepo);
    });

    expect(success).toBe(false);
    expect(result.current.saving).toBe(false);
    expect(result.current.error).toBe(errorMessage);
  });

  it("should set generic error if no message provided", async () => {
    vi.spyOn(api, "updateRepository").mockRejectedValueOnce({} as any);

    const { result } = renderHook(() => useEditRepository());

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.update(mockRepo);
    });

    expect(success).toBe(false);
    expect(result.current.saving).toBe(false);
    expect(result.current.error).toBe("Failed to save changes.");
  });
});
