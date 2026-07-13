import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { listAdmins } from "../admin.api";
import { useListAdmins } from "./useListAdmins";

vi.mock("../admin.api", () => ({
  listAdmins: vi.fn(),
}));

const mockAdmins = [
  {
    id: 1,
    username: "admin1",
    email: "admin1@example.com",
    role: "Administrator",
    createdAt: "2026-01-01T00:00:00Z",
    mustChangePassword: false,
  },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useListAdmins", () => {
  it("ucitava administratore pri mountovanju", async () => {
    vi.mocked(listAdmins).mockResolvedValueOnce({ data: mockAdmins } as any);

    const { result } = renderHook(() => useListAdmins());

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.admins).toEqual(mockAdmins);
    expect(result.current.error).toBe("");
  });

  it("postavlja gresku iz response-a kada poziv ne uspe", async () => {
    vi.mocked(listAdmins).mockRejectedValueOnce({
      response: { data: { message: "Not authorized." } },
    });

    const { result } = renderHook(() => useListAdmins());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe("Not authorized.");
    expect(result.current.admins).toEqual([]);
  });

  it("postavlja generičku gresku kada response nema poruku", async () => {
    vi.mocked(listAdmins).mockRejectedValueOnce(new Error("network down"));

    const { result } = renderHook(() => useListAdmins());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe("Failed to load administrators.");
  });

  it("refetch ponovo poziva listAdmins", async () => {
    vi.mocked(listAdmins).mockResolvedValue({ data: mockAdmins } as any);

    const { result } = renderHook(() => useListAdmins());

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.refetch();
    });

    expect(listAdmins).toHaveBeenCalledTimes(2);
  });
});
