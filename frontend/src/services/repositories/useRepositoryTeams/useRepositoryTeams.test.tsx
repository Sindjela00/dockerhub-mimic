import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getRepositoryTeams,
  updateRepositoryTeamPermission,
} from "@/services/repositories/repositories.api";

import { removeRepositoryFromTeam } from "@/services/organizations/organizations.api";
import { useRepositoryTeams } from "./useRepositoryTeams";

vi.mock("@/services/repositories/repositories.api", () => ({
  getRepositoryTeams: vi.fn(),
  updateRepositoryTeamPermission: vi.fn(),
}));

vi.mock("@/services/organizations/organizations.api", () => ({
  removeRepositoryFromTeam: vi.fn(),
}));

const mockTeam = { teamId: 1, teamName: "alpha", permission: "read" };
const mockTeam2 = { teamId: 2, teamName: "beta", permission: "write" };

function setup(
  overrides: { repoId?: number; orgName?: string; token?: string } = {},
) {
  const { repoId = 10, orgName = "my-org", token = "test-token" } = overrides;
  return renderHook(() => useRepositoryTeams(repoId, orgName, token));
}

describe("useRepositoryTeams", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("initial state", () => {
    it("starts with empty teams array", () => {
      const { result } = setup();
      expect(result.current.teams).toEqual([]);
    });

    it("starts with loading false", () => {
      const { result } = setup();
      expect(result.current.loading).toBe(false);
    });

    it("starts with null error", () => {
      const { result } = setup();
      expect(result.current.error).toBeNull();
    });

    it("exposes fetchTeams, removeTeam, updatePermission functions", () => {
      const { result } = setup();
      expect(typeof result.current.fetchTeams).toBe("function");
      expect(typeof result.current.removeTeam).toBe("function");
      expect(typeof result.current.updatePermission).toBe("function");
    });
  });

  describe("fetchTeams", () => {
    it("sets loading true while fetching", async () => {
      let resolve!: (v: any) => void;
      (getRepositoryTeams as any).mockReturnValue(
        new Promise((r) => (resolve = r)),
      );

      const { result } = setup();
      act(() => {
        result.current.fetchTeams();
      });

      expect(result.current.loading).toBe(true);
      resolve({ data: { teams: [] } });
    });

    it("sets teams from api response", async () => {
      (getRepositoryTeams as any).mockResolvedValue({
        data: { teams: [mockTeam, mockTeam2] },
      });

      const { result } = setup();
      act(() => {
        result.current.fetchTeams();
      });

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.teams).toEqual([mockTeam, mockTeam2]);
    });

    it("sets loading false after success", async () => {
      (getRepositoryTeams as any).mockResolvedValue({ data: { teams: [] } });

      const { result } = setup();
      act(() => {
        result.current.fetchTeams();
      });

      await waitFor(() => expect(result.current.loading).toBe(false));
    });

    it("clears previous error on new fetch", async () => {
      (getRepositoryTeams as any)
        .mockRejectedValueOnce(new Error("first error"))
        .mockResolvedValueOnce({ data: { teams: [] } });

      const { result } = setup();

      act(() => {
        result.current.fetchTeams();
      });
      await waitFor(() => expect(result.current.error).toBe("first error"));

      act(() => {
        result.current.fetchTeams();
      });
      await waitFor(() => expect(result.current.error).toBeNull());
    });

    it("sets error message on fetch failure", async () => {
      (getRepositoryTeams as any).mockRejectedValue(new Error("Network error"));

      const { result } = setup();
      act(() => {
        result.current.fetchTeams();
      });

      await waitFor(() => expect(result.current.error).toBe("Network error"));
    });

    it("falls back to default error message when error has no message", async () => {
      (getRepositoryTeams as any).mockRejectedValue({});

      const { result } = setup();
      act(() => {
        result.current.fetchTeams();
      });

      await waitFor(() =>
        expect(result.current.error).toBe("Failed to load teams"),
      );
    });

    it("sets loading false after failure", async () => {
      (getRepositoryTeams as any).mockRejectedValue(new Error("fail"));

      const { result } = setup();
      act(() => {
        result.current.fetchTeams();
      });

      await waitFor(() => expect(result.current.loading).toBe(false));
    });

    it("calls getRepositoryTeams with repoId and token", async () => {
      (getRepositoryTeams as any).mockResolvedValue({ data: { teams: [] } });

      const { result } = setup({ repoId: 42, token: "my-token" });
      act(() => {
        result.current.fetchTeams();
      });

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(getRepositoryTeams).toHaveBeenCalledWith(42, "my-token");
    });

    it("does nothing when orgName is empty", () => {
      const { result } = setup({ orgName: "" });
      act(() => {
        result.current.fetchTeams();
      });
      expect(getRepositoryTeams).not.toHaveBeenCalled();
    });

    it("does nothing when token is empty", () => {
      const { result } = setup({ token: "" });
      act(() => {
        result.current.fetchTeams();
      });
      expect(getRepositoryTeams).not.toHaveBeenCalled();
    });
  });

  describe("removeTeam", () => {
    async function setupWithTeams() {
      (getRepositoryTeams as any).mockResolvedValue({
        data: { teams: [mockTeam, mockTeam2] },
      });
      (removeRepositoryFromTeam as any).mockResolvedValue(undefined);

      const { result } = setup();
      act(() => {
        result.current.fetchTeams();
      });
      await waitFor(() => expect(result.current.teams).toHaveLength(2));
      return result;
    }

    it("removes the team from local state", async () => {
      const result = await setupWithTeams();

      await act(async () => {
        await result.current.removeTeam(1, "alpha");
      });

      expect(result.current.teams).toEqual([mockTeam2]);
    });

    it("calls removeRepositoryFromTeam with correct args", async () => {
      const result = await setupWithTeams();

      await act(async () => {
        await result.current.removeTeam(1, "alpha");
      });

      expect(removeRepositoryFromTeam).toHaveBeenCalledWith(
        "my-org",
        "alpha",
        10,
        "test-token",
      );
    });

    it("removes the correct team when multiple exist", async () => {
      const result = await setupWithTeams();

      await act(async () => {
        await result.current.removeTeam(2, "beta");
      });

      expect(result.current.teams).toEqual([mockTeam]);
    });

    it("does nothing when token is empty", async () => {
      (getRepositoryTeams as any).mockResolvedValue({
        data: { teams: [mockTeam] },
      });

      const { result } = setup({ token: "" });
      await act(async () => {
        await result.current.removeTeam(1, "alpha");
      });

      expect(removeRepositoryFromTeam).not.toHaveBeenCalled();
    });

    it("propagates errors from removeRepositoryFromTeam", async () => {
      (getRepositoryTeams as any).mockResolvedValue({
        data: { teams: [mockTeam] },
      });
      (removeRepositoryFromTeam as any).mockRejectedValue(
        new Error("Remove failed"),
      );

      const { result } = setup();
      act(() => {
        result.current.fetchTeams();
      });
      await waitFor(() => expect(result.current.teams).toHaveLength(1));

      await expect(
        act(async () => {
          await result.current.removeTeam(1, "alpha");
        }),
      ).rejects.toThrow("Remove failed");
    });
  });

  describe("updatePermission", () => {
    async function setupWithTeams() {
      (getRepositoryTeams as any).mockResolvedValue({
        data: { teams: [mockTeam, mockTeam2] },
      });

      const { result } = setup();
      act(() => {
        result.current.fetchTeams();
      });
      await waitFor(() => expect(result.current.teams).toHaveLength(2));
      return result;
    }

    it("optimistically updates permission in local state", async () => {
      (updateRepositoryTeamPermission as any).mockResolvedValue(undefined);
      const result = await setupWithTeams();

      act(() => {
        result.current.updatePermission(1, "admin");
      });

      expect(result.current.teams.find((t) => t.teamId === 1)?.permission).toBe(
        "admin",
      );
    });

    it("calls updateRepositoryTeamPermission with correct args", async () => {
      (updateRepositoryTeamPermission as any).mockResolvedValue(undefined);
      const result = await setupWithTeams();

      await act(async () => {
        await result.current.updatePermission(1, "admin");
      });

      expect(updateRepositoryTeamPermission).toHaveBeenCalledWith(10, 1, {
        permission: "admin",
      });
    });

    it("only updates the targeted team, leaves others unchanged", async () => {
      (updateRepositoryTeamPermission as any).mockResolvedValue(undefined);
      const result = await setupWithTeams();

      await act(async () => {
        await result.current.updatePermission(1, "admin");
      });

      expect(result.current.teams.find((t) => t.teamId === 2)?.permission).toBe(
        "write",
      );
    });

    it("rolls back to previous permission on API failure", async () => {
      (updateRepositoryTeamPermission as any).mockRejectedValue(
        new Error("API error"),
      );
      const result = await setupWithTeams();

      await act(async () => {
        await result.current.updatePermission(1, "admin");
      });

      await waitFor(() =>
        expect(
          result.current.teams.find((t) => t.teamId === 1)?.permission,
        ).toBe("read"),
      );
    });

    it("rolls back only the affected team on failure", async () => {
      (updateRepositoryTeamPermission as any).mockRejectedValue(
        new Error("fail"),
      );
      const result = await setupWithTeams();

      await act(async () => {
        await result.current.updatePermission(1, "admin");
      });

      await waitFor(() =>
        expect(
          result.current.teams.find((t) => t.teamId === 2)?.permission,
        ).toBe("write"),
      );
    });

    it("falls back to empty string when previous permission is undefined", async () => {
      (getRepositoryTeams as any).mockResolvedValue({
        data: {
          teams: [{ teamId: 99, teamName: "ghost", permission: undefined }],
        },
      });
      (updateRepositoryTeamPermission as any).mockRejectedValue(
        new Error("fail"),
      );

      const { result } = setup();
      act(() => {
        result.current.fetchTeams();
      });
      await waitFor(() => expect(result.current.teams).toHaveLength(1));

      await act(async () => {
        await result.current.updatePermission(99, "admin");
      });

      await waitFor(() =>
        expect(
          result.current.teams.find((t) => t.teamId === 99)?.permission,
        ).toBe(""),
      );
    });

    it("does nothing when token is empty", async () => {
      const { result } = setup({ token: "" });

      await act(async () => {
        await result.current.updatePermission(1, "admin");
      });

      expect(updateRepositoryTeamPermission).not.toHaveBeenCalled();
    });
  });
});
