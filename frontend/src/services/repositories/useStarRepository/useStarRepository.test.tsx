import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { starRepository, unstarRepository } from "../repositories.api";

import { useStarRepository } from "./useStarRepository";

vi.mock("../repositories.api", () => ({
  starRepository: vi.fn(),
  unstarRepository: vi.fn(),
}));

const mockStar = vi.mocked(starRepository);
const mockUnstar = vi.mocked(unstarRepository);

describe("useStarRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStar.mockResolvedValue({ data: {} } as any);
    mockUnstar.mockResolvedValue({ data: {} } as any);
  });

  it("initializes with correct starred state", () => {
    const { result } = renderHook(() => useStarRepository(1, true, 10));
    expect(result.current.starred).toBe(true);
  });

  it("initializes with correct count", () => {
    const { result } = renderHook(() => useStarRepository(1, false, 7));
    expect(result.current.count).toBe(7);
  });

  it("initializes loading as false", () => {
    const { result } = renderHook(() => useStarRepository(1, false, 0));
    expect(result.current.loading).toBe(false);
  });

  it("calls starRepository with correct id when not starred", async () => {
    const { result } = renderHook(() => useStarRepository(42, false, 5));

    await act(async () => {
      await result.current.toggle();
    });

    expect(mockStar).toHaveBeenCalledWith(42);
    expect(mockUnstar).not.toHaveBeenCalled();
  });

  it("sets starred to true and increments count after starring", async () => {
    const { result } = renderHook(() => useStarRepository(1, false, 5));

    await act(async () => {
      await result.current.toggle();
    });

    expect(result.current.starred).toBe(true);
    expect(result.current.count).toBe(6);
  });

  it("calls unstarRepository with correct id when starred", async () => {
    const { result } = renderHook(() => useStarRepository(42, true, 10));

    await act(async () => {
      await result.current.toggle();
    });

    expect(mockUnstar).toHaveBeenCalledWith(42);
    expect(mockStar).not.toHaveBeenCalled();
  });

  it("sets starred to false and decrements count after unstarring", async () => {
    const { result } = renderHook(() => useStarRepository(1, true, 10));

    await act(async () => {
      await result.current.toggle();
    });

    expect(result.current.starred).toBe(false);
    expect(result.current.count).toBe(9);
  });

  it("sets loading to true during toggle", async () => {
    let resolvePromise!: () => void;
    mockStar.mockReturnValue(
      new Promise((res) => {
        resolvePromise = () => res({ data: {} } as any);
      }),
    );

    const { result } = renderHook(() => useStarRepository(1, false, 0));

    act(() => {
      result.current.toggle();
    });

    expect(result.current.loading).toBe(true);

    await act(async () => {
      resolvePromise();
    });

    expect(result.current.loading).toBe(false);
  });

  it("resets loading to false after toggle completes", async () => {
    const { result } = renderHook(() => useStarRepository(1, false, 0));

    await act(async () => {
      await result.current.toggle();
    });

    expect(result.current.loading).toBe(false);
  });

  it("updates starred when initialStarred prop changes", async () => {
    const { result, rerender } = renderHook(
      ({ initialStarred }) => useStarRepository(1, initialStarred, 5),
      { initialProps: { initialStarred: false } },
    );

    expect(result.current.starred).toBe(false);

    rerender({ initialStarred: true });

    await waitFor(() => {
      expect(result.current.starred).toBe(true);
    });
  });

  it("updates count when initialCount prop changes", async () => {
    const { result, rerender } = renderHook(
      ({ initialCount }) => useStarRepository(1, false, initialCount),
      { initialProps: { initialCount: 3 } },
    );

    expect(result.current.count).toBe(3);

    rerender({ initialCount: 99 });

    await waitFor(() => {
      expect(result.current.count).toBe(99);
    });
  });
});
