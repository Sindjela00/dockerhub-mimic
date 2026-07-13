import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { searchUsersForBadges, setUserBadge } from "../admin.api";
import { useUserBadges } from "./useUserBadges";

vi.mock("../admin.api", () => ({
  searchUsersForBadges: vi.fn(),
  setUserBadge: vi.fn(),
}));

const mockUsers = [
  {
    id: 1,
    username: "john",
    email: "john@example.com",
    verifiedPublisher: false,
    sponsoredOSS: false,
  },
  {
    id: 2,
    username: "jane",
    email: "jane@example.com",
    verifiedPublisher: false,
    sponsoredOSS: false,
  },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useUserBadges", () => {
  describe("search", () => {
    it("ucitava korisnike uspesno", async () => {
      vi.mocked(searchUsersForBadges).mockResolvedValueOnce({
        data: { users: mockUsers, total: 2, page: 1, pageSize: 20 },
      } as any);

      const { result } = renderHook(() => useUserBadges());

      await act(async () => {
        await result.current.search("john");
      });

      expect(searchUsersForBadges).toHaveBeenCalledWith("john");
      expect(result.current.users).toEqual(mockUsers);
      expect(result.current.total).toBe(2);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe("");
    });

    it("postavlja gresku iz response-a kada pretraga ne uspe", async () => {
      vi.mocked(searchUsersForBadges).mockRejectedValueOnce({
        response: { data: { message: "Search failed." } },
      });

      const { result } = renderHook(() => useUserBadges());

      await act(async () => {
        await result.current.search();
      });

      expect(result.current.error).toBe("Search failed.");
    });

    it("postavlja genericku gresku kada response nema poruku", async () => {
      vi.mocked(searchUsersForBadges).mockRejectedValueOnce(
        new Error("boom"),
      );

      const { result } = renderHook(() => useUserBadges());

      await act(async () => {
        await result.current.search();
      });

      expect(result.current.error).toBe("Failed to load users.");
    });

    it("loading je true tokom pretrage", async () => {
      let resolve!: (v: any) => void;
      vi.mocked(searchUsersForBadges).mockReturnValueOnce(
        new Promise((r) => {
          resolve = r;
        }),
      );

      const { result } = renderHook(() => useUserBadges());

      act(() => {
        result.current.search();
      });

      expect(result.current.loading).toBe(true);

      await act(async () => {
        resolve({ data: { users: [], total: 0, page: 1, pageSize: 20 } });
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe("toggleBadge", () => {
    it("azurira korisnika nakon uspesne izmene bedza", async () => {
      vi.mocked(searchUsersForBadges).mockResolvedValueOnce({
        data: { users: mockUsers, total: 2, page: 1, pageSize: 20 },
      } as any);

      const updatedUser = { ...mockUsers[0], verifiedPublisher: true };
      vi.mocked(setUserBadge).mockResolvedValueOnce({
        data: { message: "ok", user: updatedUser },
      } as any);

      const { result } = renderHook(() => useUserBadges());

      await act(async () => {
        await result.current.search();
      });

      await act(async () => {
        await result.current.toggleBadge(1, "verified", true);
      });

      expect(setUserBadge).toHaveBeenCalledWith(1, "verified", true);
      expect(result.current.users[0]).toEqual(updatedUser);
      expect(result.current.users[1]).toEqual(mockUsers[1]);
    });

    it("postavlja gresku iz response-a kada izmena bedza ne uspe", async () => {
      vi.mocked(setUserBadge).mockRejectedValueOnce({
        response: { data: { message: "Cannot update badge." } },
      });

      const { result } = renderHook(() => useUserBadges());

      await act(async () => {
        await result.current.toggleBadge(1, "sponsored", true);
      });

      expect(result.current.error).toBe("Cannot update badge.");
    });

    it("postavlja genericku gresku kada response nema poruku", async () => {
      vi.mocked(setUserBadge).mockRejectedValueOnce(new Error("boom"));

      const { result } = renderHook(() => useUserBadges());

      await act(async () => {
        await result.current.toggleBadge(1, "sponsored", true);
      });

      expect(result.current.error).toBe("Failed to update user badge.");
    });
  });
});
