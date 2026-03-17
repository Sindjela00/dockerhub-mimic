import { beforeEach, describe, expect, it, vi } from "vitest";
import { changePassword, login, register } from "./auth.api";

import api from "../../lib/api";

vi.spyOn(api, "post").mockResolvedValue({ data: {} } as any);

beforeEach(() => vi.clearAllMocks());

describe("auth.api", () => {
  it("register poziva ispravan endpoint sa payloadom", async () => {
    const payload = {
      email: "test@test.com",
      username: "john",
      password: "Password1",
    };
    await register(payload);
    expect(api.post).toHaveBeenCalledWith("/api/auth/register", payload);
  });

  it("login poziva ispravan endpoint sa payloadom", async () => {
    const payload = { email: "test@test.com", password: "Password1" };
    await login(payload);
    expect(api.post).toHaveBeenCalledWith("/api/auth/login", payload);
  });

  it("changePassword poziva ispravan endpoint sa payloadom", async () => {
    const payload = {
      email: "test@test.com",
      oldPassword: "OldPass1",
      newPassword: "NewPass1",
    };
    await changePassword(payload);
    expect(api.post).toHaveBeenCalledWith("/api/auth/change_password", payload);
  });
});
