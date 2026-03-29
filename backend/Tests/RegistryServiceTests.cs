using System.IdentityModel.Tokens.Jwt;
using System.Security.Cryptography;
using System.Text.Json;
using backend.Data;
using backend.Models;
using backend.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

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
        var cache = new MemoryCache(new MemoryCacheOptions());
        var user = await TestHelpers.AddUserAsync(dbContext, "demo", "demo@example.com");
        await TestHelpers.AddRepositoryAsync(dbContext, user, "sample", "public", pullCount: 0);
        cache.Set("registry_creds_demo", ("demo", "Password1"));

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

    private static RegistryService CreateService(AppDbContext dbContext, MemoryCache? cache = null)
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

        return new RegistryService(dbContext, cache ?? new MemoryCache(new MemoryCacheOptions()), configuration);
    }
}