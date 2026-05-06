import {
  acceptOrganizationInvite,
  addTeamMember,
  addTeamRepository,
  cancelMemberInvite,
  createOrgRepository,
  createOrganization,
  createOrganizationTeam,
  deleteOrganization,
  deleteTeam,
  fetchMembersInvites,
  fetchOrganization,
  fetchOrganizationMembers,
  fetchOrganizationRepositories,
  fetchOrganizationTeams,
  fetchOrganizations,
  fetchTeam,
  fetchTeamMembers,
  fetchTeamRepositories,
  inviteOrganizationMember,
  removeOrganizationMember,
  removeRepositoryFromTeam,
  removeTeamMember,
  updateOrganization,
  updateTeam,
} from "./organizations.api";
import { beforeEach, describe, expect, it, vi } from "vitest";

import api from "@/lib/api";

vi.mock("@/lib/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const TOKEN = "test-token";
const AUTH_HEADER = { headers: { Authorization: `Bearer ${TOKEN}` } };

beforeEach(() => {
  vi.clearAllMocks();
});

const mockOrganization = {
  id: 1,
  name: "acme",
  displayName: "Acme Corp",
  description: "A test org",
  avatarUrl: null,
  ownerUsername: "alice",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-02T00:00:00Z",
  memberCount: 5,
  repositoryCount: 3,
  currentUserRole: "admin",
};

const mockTeam = {
  id: 10,
  name: "eng",
  description: "Engineering team",
  organizationName: "acme",
  memberCount: 4,
  repositoryCount: 2,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-02T00:00:00Z",
};

const mockMember = {
  userId: 99,
  username: "bob",
  email: "bob@example.com",
  role: "member",
  addedAt: "2024-01-01T00:00:00Z",
};

const mockInvite = {
  id: 5,
  organizationName: "acme",
  email: "carol@example.com",
  role: "member",
  status: "pending" as const,
  invitedByUsername: "alice",
  expiresAt: "2024-02-01T00:00:00Z",
  createdAt: "2024-01-01T00:00:00Z",
};

const mockTeamRepo = {
  repositoryId: 7,
  repositoryName: "api",
  fullName: "acme/api",
  permission: "read",
};

describe("acceptOrganizationInvite", () => {
  it("posts to the invites accept endpoint with the token", async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: { ok: true } });

    const result = await acceptOrganizationInvite("invite-abc");

    expect(api.post).toHaveBeenCalledWith("/api/organizations/invites/accept", {
      token: "invite-abc",
    });
    expect(result).toEqual({ ok: true });
  });
});

describe("fetchMembersInvites", () => {
  it("returns the list of invites for an org", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: [mockInvite] });

    const result = await fetchMembersInvites("acme", TOKEN);

    expect(api.get).toHaveBeenCalledWith(
      "/api/organizations/acme/invites",
      AUTH_HEADER,
    );
    expect(result).toEqual([mockInvite]);
  });
});

describe("cancelMemberInvite", () => {
  it("calls DELETE on the specific invite", async () => {
    vi.mocked(api.delete).mockResolvedValueOnce({});

    await cancelMemberInvite(5, "acme", TOKEN);

    expect(api.delete).toHaveBeenCalledWith(
      "/api/organizations/acme/invites/5",
      AUTH_HEADER,
    );
  });
});

describe("removeTeamMember", () => {
  it("deletes the correct team member URL", async () => {
    vi.mocked(api.delete).mockResolvedValueOnce({});

    await removeTeamMember("acme", "eng", 99, TOKEN);

    expect(api.delete).toHaveBeenCalledWith(
      "/api/organizations/acme/teams/eng/members/99",
      AUTH_HEADER,
    );
  });
});

describe("deleteOrganization", () => {
  it("calls DELETE on the org endpoint", async () => {
    vi.mocked(api.delete).mockResolvedValueOnce({});

    await deleteOrganization("acme", TOKEN);

    expect(api.delete).toHaveBeenCalledWith(
      "/api/organizations/acme",
      AUTH_HEADER,
    );
  });
});

describe("addTeamMember", () => {
  it("posts userId to the team members endpoint", async () => {
    vi.mocked(api.post).mockResolvedValueOnce({});

    await addTeamMember("acme", "eng", 99, TOKEN);

    expect(api.post).toHaveBeenCalledWith(
      "/api/organizations/acme/teams/eng/members",
      { userId: 99 },
      AUTH_HEADER,
    );
  });
});

describe("fetchTeamMembers", () => {
  it("returns team members response", async () => {
    const mockResponse = {
      teamName: "eng",
      organizationName: "acme",
      members: [
        {
          userId: 99,
          username: "bob",
          email: "bob@example.com",
          addedAt: "2024-01-01",
        },
      ],
      total: 1,
    };
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockResponse });

    const result = await fetchTeamMembers("acme", "eng", TOKEN);

    expect(api.get).toHaveBeenCalledWith(
      "/api/organizations/acme/teams/eng/members",
      AUTH_HEADER,
    );
    expect(result).toEqual(mockResponse);
  });
});

describe("removeOrganizationMember", () => {
  it("calls DELETE for the org member", async () => {
    vi.mocked(api.delete).mockResolvedValueOnce({
      data: { message: "removed" },
    });

    const result = await removeOrganizationMember("acme", 99, TOKEN);

    expect(api.delete).toHaveBeenCalledWith(
      "/api/organizations/acme/members/99",
      AUTH_HEADER,
    );
    expect(result).toEqual({ data: { message: "removed" } });
  });
});

describe("removeRepositoryFromTeam", () => {
  it("calls DELETE on the team repository endpoint", async () => {
    vi.mocked(api.delete).mockResolvedValueOnce({});

    await removeRepositoryFromTeam("acme", "eng", 7, TOKEN);

    expect(api.delete).toHaveBeenCalledWith(
      "/api/organizations/acme/teams/eng/repositories/7",
      AUTH_HEADER,
    );
  });
});

describe("fetchTeamRepositories", () => {
  it("returns team repositories response", async () => {
    const mockResponse = {
      teamName: "eng",
      organizationName: "acme",
      repositories: [mockTeamRepo],
      total: 1,
    };
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockResponse });

    const result = await fetchTeamRepositories("acme", "eng", TOKEN);

    expect(api.get).toHaveBeenCalledWith(
      "/api/organizations/acme/teams/eng/repositories",
      AUTH_HEADER,
    );
    expect(result).toEqual(mockResponse);
  });
});

describe("addTeamRepository", () => {
  it("posts the payload and returns the response", async () => {
    const payload = { repositoryId: 7, permission: "write" };
    const mockResponse = { message: "added", teamRepository: mockTeamRepo };
    vi.mocked(api.post).mockResolvedValueOnce({ data: mockResponse });

    const result = await addTeamRepository("acme", "eng", payload, TOKEN);

    expect(api.post).toHaveBeenCalledWith(
      "/api/organizations/acme/teams/eng/repositories",
      payload,
      AUTH_HEADER,
    );
    expect(result).toEqual(mockResponse);
  });
});

describe("deleteTeam", () => {
  it("calls DELETE on the team endpoint", async () => {
    vi.mocked(api.delete).mockResolvedValueOnce({});

    await deleteTeam("acme", "eng", TOKEN);

    expect(api.delete).toHaveBeenCalledWith(
      "/api/organizations/acme/teams/eng",
      AUTH_HEADER,
    );
  });
});

describe("updateTeam", () => {
  it("PUTs updated team data and returns the team", async () => {
    const payload = { name: "engineering", description: "Updated" };
    vi.mocked(api.put).mockResolvedValueOnce({
      data: { ...mockTeam, ...payload },
    });

    const result = await updateTeam("acme", "eng", payload, TOKEN);

    expect(api.put).toHaveBeenCalledWith(
      "/api/organizations/acme/teams/eng",
      payload,
      AUTH_HEADER,
    );
    expect(result.name).toBe("engineering");
  });
});

describe("fetchTeam", () => {
  it("returns a single team", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockTeam });

    const result = await fetchTeam("acme", "eng", TOKEN);

    expect(api.get).toHaveBeenCalledWith(
      "/api/organizations/acme/teams/eng",
      AUTH_HEADER,
    );
    expect(result).toEqual(mockTeam);
  });
});

describe("fetchOrganizationMembers", () => {
  it("fetches members without search", async () => {
    const mockResponse = {
      organizationName: "acme",
      members: [mockMember],
      total: 1,
    };
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockResponse });

    const result = await fetchOrganizationMembers("acme", TOKEN);

    expect(api.get).toHaveBeenCalledWith(
      "/api/organizations/acme/members",
      AUTH_HEADER,
    );
    expect(result).toEqual(mockResponse);
  });

  it("appends search query when provided", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: { organizationName: "acme", members: [], total: 0 },
    });

    await fetchOrganizationMembers("acme", TOKEN, "bob");

    expect(api.get).toHaveBeenCalledWith(
      "/api/organizations/acme/members?search=bob",
      AUTH_HEADER,
    );
  });

  it("ignores blank search strings", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: { organizationName: "acme", members: [], total: 0 },
    });

    await fetchOrganizationMembers("acme", TOKEN, "   ");

    expect(api.get).toHaveBeenCalledWith(
      "/api/organizations/acme/members",
      AUTH_HEADER,
    );
  });
});

describe("inviteOrganizationMember", () => {
  it("posts an invite and returns the new member", async () => {
    const payload = { email: "carol@example.com", role: "member" };
    vi.mocked(api.post).mockResolvedValueOnce({ data: mockMember });

    const result = await inviteOrganizationMember("acme", payload, TOKEN);

    expect(api.post).toHaveBeenCalledWith(
      "/api/organizations/acme/invites",
      payload,
      AUTH_HEADER,
    );
    expect(result).toEqual(mockMember);
  });
});

describe("createOrganizationTeam", () => {
  it("creates a team and returns it", async () => {
    const payload = { name: "eng", description: "Engineering" };
    vi.mocked(api.post).mockResolvedValueOnce({ data: mockTeam });

    const result = await createOrganizationTeam("acme", payload, TOKEN);

    expect(api.post).toHaveBeenCalledWith(
      "/api/organizations/acme/teams",
      payload,
      AUTH_HEADER,
    );
    expect(result).toEqual(mockTeam);
  });
});

describe("fetchOrganizations", () => {
  it("fetches with default pagination", async () => {
    const mockResponse = {
      organizations: [mockOrganization],
      total: 1,
      page: 1,
      pageSize: 12,
    };
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockResponse });

    const result = await fetchOrganizations({ token: TOKEN });

    expect(api.get).toHaveBeenCalledWith(
      "/api/organizations?page=1&pageSize=12",
      AUTH_HEADER,
    );
    expect(result).toEqual(mockResponse);
  });

  it("includes search param when provided", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: { organizations: [], total: 0, page: 1, pageSize: 12 },
    });

    await fetchOrganizations({ token: TOKEN, search: "acme" });

    const callArg = vi.mocked(api.get).mock.calls[0][0] as string;
    expect(callArg).toContain("search=acme");
  });

  it("respects custom page and pageSize", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: { organizations: [], total: 0, page: 2, pageSize: 5 },
    });

    await fetchOrganizations({ token: TOKEN, page: 2, pageSize: 5 });

    const callArg = vi.mocked(api.get).mock.calls[0][0] as string;
    expect(callArg).toContain("page=2");
    expect(callArg).toContain("pageSize=5");
  });
});

describe("createOrganization", () => {
  it("posts the org payload and returns the response", async () => {
    const payload = {
      name: "acme",
      displayName: "Acme Corp",
      description: "A test org",
    };
    vi.mocked(api.post).mockResolvedValueOnce({ data: mockOrganization });

    const result = await createOrganization(payload, TOKEN);

    expect(api.post).toHaveBeenCalledWith(
      "/api/organizations",
      payload,
      AUTH_HEADER,
    );
    expect(result).toEqual(mockOrganization);
  });
});

describe("fetchOrganization", () => {
  it("fetches a single organization by name", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockOrganization });

    const result = await fetchOrganization("acme", TOKEN);

    expect(api.get).toHaveBeenCalledWith(
      "/api/organizations/acme",
      AUTH_HEADER,
    );
    expect(result).toEqual(mockOrganization);
  });
});

describe("updateOrganization", () => {
  it("patches org fields and returns updated org", async () => {
    const payload = { displayName: "Acme Ltd", description: "Updated" };
    vi.mocked(api.patch).mockResolvedValueOnce({
      data: { ...mockOrganization, ...payload },
    });

    const result = await updateOrganization("acme", payload, TOKEN);

    expect(api.patch).toHaveBeenCalledWith(
      "/api/organizations/acme",
      payload,
      AUTH_HEADER,
    );
    expect(result.displayName).toBe("Acme Ltd");
  });
});

describe("fetchOrganizationRepositories", () => {
  it("fetches repos without search", async () => {
    const mockResponse = { repositories: [], total: 0 };
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockResponse });

    const result = await fetchOrganizationRepositories("acme", TOKEN);

    expect(api.get).toHaveBeenCalledWith(
      "/api/organizations/acme/repositories",
      AUTH_HEADER,
    );
    expect(result).toEqual(mockResponse);
  });

  it("appends search param when provided", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: { repositories: [], total: 0 },
    });

    await fetchOrganizationRepositories("acme", TOKEN, "api");

    const callArg = vi.mocked(api.get).mock.calls[0][0] as string;
    expect(callArg).toContain("search=api");
  });
});

describe("createOrgRepository", () => {
  it("posts repo creation payload for an org", async () => {
    const payload = {
      name: "new-repo",
      description: "A repo",
      visibility: "public" as const,
    };
    vi.mocked(api.post).mockResolvedValueOnce({
      data: { id: 1, name: "new-repo" },
    });

    await createOrgRepository("acme", payload);

    expect(api.post).toHaveBeenCalledWith(
      "/api/organizations/acme/repositories",
      payload,
    );
  });
});

describe("fetchOrganizationTeams", () => {
  it("fetches teams without search", async () => {
    const mockResponse = {
      organizationName: "acme",
      teams: [mockTeam],
      total: 1,
    };
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockResponse });

    const result = await fetchOrganizationTeams("acme", TOKEN);

    expect(api.get).toHaveBeenCalledWith(
      "/api/organizations/acme/teams",
      AUTH_HEADER,
    );
    expect(result).toEqual(mockResponse);
  });

  it("appends search param when provided", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: { organizationName: "acme", teams: [], total: 0 },
    });

    await fetchOrganizationTeams("acme", TOKEN, "eng");

    const callArg = vi.mocked(api.get).mock.calls[0][0] as string;
    expect(callArg).toContain("search=eng");
  });

  it("ignores whitespace-only search strings", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: { organizationName: "acme", teams: [], total: 0 },
    });

    await fetchOrganizationTeams("acme", TOKEN, "   ");

    expect(api.get).toHaveBeenCalledWith(
      "/api/organizations/acme/teams",
      AUTH_HEADER,
    );
  });
});
