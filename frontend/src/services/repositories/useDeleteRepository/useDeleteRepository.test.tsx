import * as api from "../repositories.api";

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useDeleteRepository } from "./useDeleteRepository";

describe("useDeleteRepository", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("initial state should be correct", () => {
    const { result } = renderHook(() => useDeleteRepository());

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe("");
  });

  it("should handle successful delete", async () => {
    const deleteRepoMock = vi
      .spyOn(api, "deleteRepository")
      .mockResolvedValueOnce({ data: {} as any });

    const { result } = renderHook(() => useDeleteRepository());

    let response: boolean = false;
    await act(async () => {
      response = await result.current.handleDelete(1);
    });

    expect(response).toBe(true);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe("");
    expect(deleteRepoMock).toHaveBeenCalledWith(1);
  });

  it("should handle failed delete", async () => {
    const errorMessage = "Cannot delete repository";
    vi.spyOn(api, "deleteRepository").mockRejectedValueOnce({
      response: { data: { message: errorMessage } },
    });

    const { result } = renderHook(() => useDeleteRepository());

    let response: boolean = true;
    await act(async () => {
      response = await result.current.handleDelete(1);
    });

    expect(response).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(errorMessage);
  });

  it("should set default error message if no response message", async () => {
    vi.spyOn(api, "deleteRepository").mockRejectedValueOnce({});

    const { result } = renderHook(() => useDeleteRepository());

    let response: boolean = true;
    await act(async () => {
      response = await result.current.handleDelete(1);
    });

    expect(response).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe("Failed to delete repository.");
  });
});
