import { beforeEach, describe, expect, it, vi } from "vitest";

import api from "../../lib/api";
import { searchLogs } from "./logs.api";

vi.spyOn(api, "get").mockResolvedValue({ data: {} } as any);

beforeEach(() => vi.clearAllMocks());

describe("logs.api", () => {
  it("koristi podrazumevane page i pageSize kada nisu prosledjeni", async () => {
    await searchLogs({});
    expect(api.get).toHaveBeenCalledWith("/api/admin/logs?page=1&pageSize=25");
  });

  it("dodaje query parametar i trim-uje ga kada je prosledjen", async () => {
    await searchLogs({ query: "  error  " });
    expect(api.get).toHaveBeenCalledWith(
      "/api/admin/logs?query=error&page=1&pageSize=25",
    );
  });

  it("ne dodaje query parametar kada je prazan string", async () => {
    await searchLogs({ query: "   " });
    expect(api.get).toHaveBeenCalledWith("/api/admin/logs?page=1&pageSize=25");
  });

  it("dodaje from i to parametre kada su prosledjeni", async () => {
    await searchLogs({ from: "2026-01-01", to: "2026-01-31" });
    expect(api.get).toHaveBeenCalledWith(
      "/api/admin/logs?from=2026-01-01&to=2026-01-31&page=1&pageSize=25",
    );
  });

  it("koristi prosledjene page i pageSize", async () => {
    await searchLogs({ page: 3, pageSize: 50 });
    expect(api.get).toHaveBeenCalledWith("/api/admin/logs?page=3&pageSize=50");
  });
});
