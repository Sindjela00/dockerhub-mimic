import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createAdmin,
  listAdmins,
  searchUsersForBadges,
  setUserBadge,
} from "./admin.api";

import api from "../../lib/api";

vi.spyOn(api, "post").mockResolvedValue({ data: {} } as any);
vi.spyOn(api, "get").mockResolvedValue({ data: {} } as any);
vi.spyOn(api, "put").mockResolvedValue({ data: {} } as any);

beforeEach(() => vi.clearAllMocks());

describe("admin.api", () => {
  it("createAdmin poziva ispravan endpoint sa payloadom", async () => {
    const payload = { username: "jsmith", email: "jsmith@example.com" };
    await createAdmin(payload);
    expect(api.post).toHaveBeenCalledWith(
      "/api/admin/administrators",
      payload,
    );
  });

  it("listAdmins poziva ispravan endpoint", async () => {
    await listAdmins();
    expect(api.get).toHaveBeenCalledWith("/api/admin/administrators");
  });

  it("searchUsersForBadges koristi podrazumevane page i pageSize kada nisu prosledjeni", async () => {
    await searchUsersForBadges(undefined);
    expect(api.get).toHaveBeenCalledWith("/api/admin/users", {
      params: { page: 1, pageSize: 20 },
    });
  });

  it("searchUsersForBadges dodaje search parametar kada je prosledjen i trim-uje ga", async () => {
    await searchUsersForBadges("  john  ", 2, 10);
    expect(api.get).toHaveBeenCalledWith("/api/admin/users", {
      params: { page: 2, pageSize: 10, search: "john" },
    });
  });

  it("searchUsersForBadges ne dodaje search parametar kada je prazan string", async () => {
    await searchUsersForBadges("   ");
    expect(api.get).toHaveBeenCalledWith("/api/admin/users", {
      params: { page: 1, pageSize: 20 },
    });
  });

  it("setUserBadge poziva ispravan endpoint sa payloadom", async () => {
    await setUserBadge(5, "verified", true);
    expect(api.put).toHaveBeenCalledWith("/api/admin/users/5/badges", {
      badge: "verified",
      value: true,
    });
  });
});
