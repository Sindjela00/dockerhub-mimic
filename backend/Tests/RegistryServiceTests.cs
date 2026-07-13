using System.IdentityModel.Tokens.Jwt;
using System.Security.Cryptography;
using System.Text.Json;
using backend.Data;
using backend.Models;
using backend.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;

namespace backend.Tests;

[TestClass]
public sealed class RegistryServiceTests
{
    [TestMethod]
    public async Task GetRegistryTokenAsync_WithoutCredentials_ReturnsError()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var service = CreateService(dbContext);

        var result = await service.GetRegistryTokenAsync(null, null, null, null, null, CancellationToken.None);

        Assert.IsFalse(result.Succeeded);
        Assert.AreEqual("Missing or invalid credentials for registry token.", result.ErrorMessage);
    }

    [TestMethod]
    public async Task GetRegistryTokenAsync_WithInvalidPassword_ReturnsError()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        await TestHelpers.AddUserAsync(dbContext, "demo", "demo@example.com");
        var service = CreateService(dbContext);
        var authHeader = $"Basic {Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes("demo:wrong"))}";

        var result = await service.GetRegistryTokenAsync(authHeader, "demo", "registry", "client", ["repository:demo/sample:pull"], CancellationToken.None);

        Assert.IsFalse(result.Succeeded);
        Assert.AreEqual("Invalid username/email or password.", result.ErrorMessage);
    }

    [TestMethod]
    public async Task GetRegistryTokenAsync_WithCollaboratorOnPublicRepository_GrantsPushAndPull()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        var collaborator = await TestHelpers.AddUserAsync(dbContext, "collab", "collab@example.com");
        var repository = await TestHelpers.AddRepositoryAsync(dbContext, owner, "sample", "public", pullCount: 0);
        dbContext.RepositoryCollaborators.Add(new RepositoryCollaborator
        {
            RepositoryId = repository.Id,
            Repository = repository,
            UserId = collaborator.Id,
            User = collaborator,
            Role = "write",
            AddedAt = DateTime.UtcNow
        });
        await dbContext.SaveChangesAsync();

        var service = CreateService(dbContext);
        var authHeader = $"Basic {Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes("collab:Password1"))}";

        var result = await service.GetRegistryTokenAsync(authHeader, "collab", "dockerhub-mimic-registry", "client", ["repository:owner/sample:pull,push,delete"], CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        Assert.IsFalse(string.IsNullOrWhiteSpace(result.Token));

        var token = new JwtSecurityTokenHandler().ReadJwtToken(result.Token);
        var accessJson = token.Claims.First(claim => claim.Type == "access").Value;
        using var accessDocument = JsonDocument.Parse(accessJson);
        var accessElement = accessDocument.RootElement.ValueKind == JsonValueKind.Array
            ? accessDocument.RootElement[0]
            : accessDocument.RootElement;
        var actions = accessElement.GetProperty("actions").EnumerateArray().Select(item => item.GetString()).ToArray();
        CollectionAssert.AreEquivalent(new[] { "pull", "push" }, actions!);
    }

    [TestMethod]
    public async Task GetRegistryTokenAsync_WithCachedCredentials_UsesAccountFallback()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var cache = TestHelpers.CreateCache();
        var user = await TestHelpers.AddUserAsync(dbContext, "demo", "demo@example.com");
        await TestHelpers.AddRepositoryAsync(dbContext, user, "sample", "public", pullCount: 0);
        await cache.SetStringAsync("registry_creds_demo", "Password1");

        var service = CreateService(dbContext, cache);
        var result = await service.GetRegistryTokenAsync(null, "demo", "dockerhub-mimic-registry", null, ["repository:demo/sample:pull"], CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        Assert.IsFalse(string.IsNullOrWhiteSpace(result.Token));
    }

    [TestMethod]
    public async Task HandleRegistryEventsAsync_WithEmptyEnvelope_ReturnsNoEventsMessage()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var service = CreateService(dbContext);

        var result = await service.HandleRegistryEventsAsync(new RegistryEventEnvelope([]), CancellationToken.None);

        Assert.AreEqual("No events received.", result.Message);
    }

    [TestMethod]
    public async Task HandleRegistryEventsAsync_PushThenPull_CreatesRepositoryAndTracksPulls()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        await TestHelpers.AddUserAsync(dbContext, "demo", "demo@example.com");
        var service = CreateService(dbContext);
        var envelope = new RegistryEventEnvelope([
            new RegistryEvent(
                "push",
                new RegistryEventTarget("demo/sample", "latest", "sha256:abc", 123, "application/vnd.oci.image.manifest.v1+json", new RegistryEventPlatform("linux", "amd64")),
                new RegistryEventActor("demo")),
            new RegistryEvent(
                "pull",
                new RegistryEventTarget("demo/sample", "latest", null, null, null, null),
                new RegistryEventActor("demo"))
        ]);

        var result = await service.HandleRegistryEventsAsync(envelope, CancellationToken.None);

        Assert.AreEqual("Registry events processed.", result.Message);
        var repository = await dbContext.Repositories.Include(item => item.Tags).SingleAsync();
        var tag = await dbContext.RepositoryTags.SingleAsync();
        Assert.AreEqual("sample", repository.Name);
        Assert.AreEqual("private", repository.Visibility);
        Assert.AreEqual(1, repository.PullCount);
        Assert.AreEqual("latest", tag.Name);
        Assert.AreEqual("sha256:abc", tag.Digest);
        Assert.AreEqual("linux", tag.Os);
        Assert.AreEqual("amd64", tag.Architecture);
        Assert.AreEqual(1, tag.PullCount);
        Assert.IsNotNull(tag.LastPulledAt);
        Assert.IsNotNull(tag.LastPushedAt);
    }

    [TestMethod]
    public async Task GetRegistryTokenAsync_OrgOwnerOnPrivateOrgRepo_GrantsPushAndPull()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "orgowner", "orgowner@example.com");
        var org = await AddOrgAsync(dbContext, owner, "myorg");
        await TestHelpers.AddOrgRepositoryAsync(dbContext, org, owner, "backend", "private");

        var service = CreateService(dbContext);
        var authHeader = $"Basic {Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes("orgowner:Password1"))}";

        var result = await service.GetRegistryTokenAsync(authHeader, "orgowner", "registry", null,
            ["repository:myorg/backend:push,pull"], CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        var actions = ParseGrantedActions(result.Token!);
        CollectionAssert.AreEquivalent(new[] { "push", "pull" }, actions);
    }

    [TestMethod]
    public async Task GetRegistryTokenAsync_SuperAdminOnSomeoneElsesPrivateRepo_GrantsPushAndPull()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        var superAdmin = await TestHelpers.AddUserAsync(dbContext, "superadmin", "superadmin@example.com", User.RoleSuperAdmin);
        await TestHelpers.AddRepositoryAsync(dbContext, owner, "sample", "private", pullCount: 0);

        var service = CreateService(dbContext);
        var authHeader = $"Basic {Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes("superadmin:Password1"))}";

        var result = await service.GetRegistryTokenAsync(authHeader, "superadmin", "registry", null,
            ["repository:owner/sample:push,pull"], CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        var actions = ParseGrantedActions(result.Token!);
        CollectionAssert.AreEquivalent(new[] { "push", "pull" }, actions);
    }

    [TestMethod]
    public async Task GetRegistryTokenAsync_OrgAdminOnPrivateOrgRepo_GrantsPushAndPull()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "orgowner", "orgowner@example.com");
        var admin = await TestHelpers.AddUserAsync(dbContext, "orgadmin", "orgadmin@example.com");
        var org = await AddOrgAsync(dbContext, owner, "myorg");
        await AddOrgMemberAsync(dbContext, org, admin, OrganizationMember.RoleAdmin);
        await TestHelpers.AddOrgRepositoryAsync(dbContext, org, owner, "backend", "private");

        var service = CreateService(dbContext);
        var authHeader = $"Basic {Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes("orgadmin:Password1"))}";

        var result = await service.GetRegistryTokenAsync(authHeader, "orgadmin", "registry", null,
            ["repository:myorg/backend:push,pull"], CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        var actions = ParseGrantedActions(result.Token!);
        CollectionAssert.AreEquivalent(new[] { "push", "pull" }, actions);
    }

    [TestMethod]
    public async Task GetRegistryTokenAsync_OrgMemberOnPrivateOrgRepo_GrantsPullOnly()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "orgowner", "orgowner@example.com");
        var member = await TestHelpers.AddUserAsync(dbContext, "orgmember", "orgmember@example.com");
        var org = await AddOrgAsync(dbContext, owner, "myorg");
        await AddOrgMemberAsync(dbContext, org, member, OrganizationMember.RoleMember);
        await TestHelpers.AddOrgRepositoryAsync(dbContext, org, owner, "backend", "private");

        var service = CreateService(dbContext);
        var authHeader = $"Basic {Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes("orgmember:Password1"))}";

        var result = await service.GetRegistryTokenAsync(authHeader, "orgmember", "registry", null,
            ["repository:myorg/backend:push,pull"], CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        var actions = ParseGrantedActions(result.Token!);
        CollectionAssert.AreEquivalent(new[] { "pull" }, actions);
    }

    [TestMethod]
    public async Task GetRegistryTokenAsync_NonMemberOnPrivateOrgRepo_GrantsNothing()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "orgowner", "orgowner@example.com");
        var outsider = await TestHelpers.AddUserAsync(dbContext, "outsider", "outsider@example.com");
        var org = await AddOrgAsync(dbContext, owner, "myorg");
        await TestHelpers.AddOrgRepositoryAsync(dbContext, org, owner, "backend", "private");

        var service = CreateService(dbContext);
        var authHeader = $"Basic {Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes("outsider:Password1"))}";

        var result = await service.GetRegistryTokenAsync(authHeader, "outsider", "registry", null,
            ["repository:myorg/backend:push,pull"], CancellationToken.None);

        // Token is still issued but with no access entries (outsider has no permissions on private org repo)
        Assert.IsTrue(result.Succeeded);
        var actions = ParseGrantedActions(result.Token!);
        Assert.AreEqual(0, actions.Length);
    }

    [TestMethod]
    public async Task GetRegistryTokenAsync_CollaboratorOnPublicOrgRepo_CannotPush()
    {
        // Org repos use team-based permissions; collaborators should NOT grant push to org repos
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "orgowner", "orgowner@example.com");
        var collab = await TestHelpers.AddUserAsync(dbContext, "collab", "collab@example.com");
        var org = await AddOrgAsync(dbContext, owner, "myorg");
        var repo = await TestHelpers.AddOrgRepositoryAsync(dbContext, org, owner, "app", "public");

        // Add collab as a repository collaborator with write role (on a public org repo)
        dbContext.RepositoryCollaborators.Add(new RepositoryCollaborator
        {
            RepositoryId = repo.Id,
            UserId = collab.Id,
            Role = "write",
            AddedAt = DateTime.UtcNow
        });
        await dbContext.SaveChangesAsync();

        var service = CreateService(dbContext);
        var authHeader = $"Basic {Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes("collab:Password1"))}";

        var result = await service.GetRegistryTokenAsync(authHeader, "collab", "registry", null,
            ["repository:myorg/app:push,pull"], CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        var actions = ParseGrantedActions(result.Token!);
        // pull is allowed (public repo), but push is NOT allowed via collaborator on an org repo
        CollectionAssert.AreEquivalent(new[] { "pull" }, actions);
    }

    [TestMethod]
    public async Task GetRegistryTokenAsync_TeamMemberWithReadWriteOnOrgRepo_GrantsPushAndPull()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "orgowner", "orgowner@example.com");
        var dev = await TestHelpers.AddUserAsync(dbContext, "dev", "dev@example.com");
        var org = await AddOrgAsync(dbContext, owner, "myorg");
        await AddOrgMemberAsync(dbContext, org, dev, OrganizationMember.RoleMember);
        var repo = await TestHelpers.AddOrgRepositoryAsync(dbContext, org, owner, "service", "private");

        var team = new OrganizationTeam
        {
            OrganizationId = org.Id,
            Name = "devs",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        dbContext.OrganizationTeams.Add(team);
        await dbContext.SaveChangesAsync();

        dbContext.OrganizationTeamMembers.Add(new OrganizationTeamMember
        {
            TeamId = team.Id,
            UserId = dev.Id,
            AddedAt = DateTime.UtcNow
        });
        dbContext.OrganizationTeamRepositories.Add(new OrganizationTeamRepository
        {
            TeamId = team.Id,
            RepositoryId = repo.Id,
            Permission = OrganizationTeamRepository.PermissionReadWrite
        });
        await dbContext.SaveChangesAsync();

        var service = CreateService(dbContext);
        var authHeader = $"Basic {Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes("dev:Password1"))}";

        var result = await service.GetRegistryTokenAsync(authHeader, "dev", "registry", null,
            ["repository:myorg/service:push,pull"], CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        var actions = ParseGrantedActions(result.Token!);
        CollectionAssert.AreEquivalent(new[] { "push", "pull" }, actions);
    }

    [TestMethod]
    public async Task GetRegistryTokenAsync_TeamMemberWithReadOnlyOnOrgRepo_GrantsPullOnly()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "orgowner", "orgowner@example.com");
        var reader = await TestHelpers.AddUserAsync(dbContext, "reader", "reader@example.com");
        var org = await AddOrgAsync(dbContext, owner, "myorg");
        await AddOrgMemberAsync(dbContext, org, reader, OrganizationMember.RoleMember);
        var repo = await TestHelpers.AddOrgRepositoryAsync(dbContext, org, owner, "docs", "private");

        var team = new OrganizationTeam
        {
            OrganizationId = org.Id,
            Name = "readers",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        dbContext.OrganizationTeams.Add(team);
        await dbContext.SaveChangesAsync();

        dbContext.OrganizationTeamMembers.Add(new OrganizationTeamMember
        {
            TeamId = team.Id,
            UserId = reader.Id,
            AddedAt = DateTime.UtcNow
        });
        dbContext.OrganizationTeamRepositories.Add(new OrganizationTeamRepository
        {
            TeamId = team.Id,
            RepositoryId = repo.Id,
            Permission = OrganizationTeamRepository.PermissionReadOnly
        });
        await dbContext.SaveChangesAsync();

        var service = CreateService(dbContext);
        var authHeader = $"Basic {Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes("reader:Password1"))}";

        var result = await service.GetRegistryTokenAsync(authHeader, "reader", "registry", null,
            ["repository:myorg/docs:push,pull"], CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        var actions = ParseGrantedActions(result.Token!);
        CollectionAssert.AreEquivalent(new[] { "pull" }, actions);
    }

    private static string[] ParseGrantedActions(string tokenString)
    {
        var token = new JwtSecurityTokenHandler().ReadJwtToken(tokenString);
        // ReadJwtToken expands JSON arrays: each element becomes a separate claim.
        // For an empty access array, no "access" claim is written at all.
        var accessClaim = token.Claims.FirstOrDefault(c => c.Type == "access");
        if (accessClaim is null) return Array.Empty<string>();

        using var doc = JsonDocument.Parse(accessClaim.Value);
        // Value is the JSON object for one entry (expanded from array) or a JSON array
        var entry = doc.RootElement.ValueKind == JsonValueKind.Array
            ? (doc.RootElement.GetArrayLength() > 0 ? doc.RootElement[0] : default)
            : doc.RootElement;

        if (entry.ValueKind != JsonValueKind.Object) return Array.Empty<string>();

        return entry.GetProperty("actions").EnumerateArray()
            .Select(a => a.GetString()!)
            .ToArray();
    }

    private static async Task<Organization> AddOrgAsync(AppDbContext dbContext, User owner, string name)
    {
        var org = new Organization
        {
            Name = name,
            DisplayName = name,
            Description = $"{name} org",
            OwnerId = owner.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        dbContext.Organizations.Add(org);
        await dbContext.SaveChangesAsync();

        dbContext.OrganizationMembers.Add(new OrganizationMember
        {
            OrganizationId = org.Id,
            UserId = owner.Id,
            Role = OrganizationMember.RoleOwner,
            AddedAt = DateTime.UtcNow
        });
        await dbContext.SaveChangesAsync();
        return org;
    }

    private static async Task AddOrgMemberAsync(AppDbContext dbContext, Organization org, User user, string role)
    {
        dbContext.OrganizationMembers.Add(new OrganizationMember
        {
            OrganizationId = org.Id,
            UserId = user.Id,
            Role = role,
            AddedAt = DateTime.UtcNow
        });
        await dbContext.SaveChangesAsync();
    }

    private static RegistryService CreateService(AppDbContext dbContext, IDistributedCache? cache = null)
    {
        var privateKeyPath = Path.Combine(Path.GetTempPath(), $"registry-private-{Guid.NewGuid():N}.pem");
        using (var rsa = RSA.Create(2048))
        {
            File.WriteAllText(privateKeyPath, rsa.ExportRSAPrivateKeyPem());
        }

        var configuration = TestHelpers.CreateConfiguration([
            new KeyValuePair<string, string?>("REGISTRY_JWT_PRIVATE_KEY_PATH", privateKeyPath),
            new KeyValuePair<string, string?>("REGISTRY_JWT_EXPIRES_SECONDS", "3600")
        ]);

        return new RegistryService(dbContext, cache ?? TestHelpers.CreateCache(), configuration);
    }
}