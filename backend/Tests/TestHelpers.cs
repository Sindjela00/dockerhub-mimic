using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Configuration;

namespace backend.Tests;

/// <summary>Minimal in-memory IDistributedCache stand-in for Redis in unit tests. Ignores expiration.</summary>
internal sealed class FakeDistributedCache : IDistributedCache
{
    private readonly Dictionary<string, byte[]> _store = new();

    public byte[]? Get(string key) => _store.TryGetValue(key, out var value) ? value : null;

    public Task<byte[]?> GetAsync(string key, CancellationToken token = default) => Task.FromResult(Get(key));

    public void Refresh(string key) { }

    public Task RefreshAsync(string key, CancellationToken token = default) => Task.CompletedTask;

    public void Remove(string key) => _store.Remove(key);

    public Task RemoveAsync(string key, CancellationToken token = default)
    {
        Remove(key);
        return Task.CompletedTask;
    }

    public void Set(string key, byte[] value, DistributedCacheEntryOptions options) => _store[key] = value;

    public Task SetAsync(string key, byte[] value, DistributedCacheEntryOptions options, CancellationToken token = default)
    {
        Set(key, value, options);
        return Task.CompletedTask;
    }
}

internal static class TestHelpers
{
    public static IDistributedCache CreateCache() => new FakeDistributedCache();

    public static AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    public static IConfiguration CreateConfiguration(IEnumerable<KeyValuePair<string, string?>>? overrides = null)
    {
        var values = new Dictionary<string, string?>
        {
            ["Jwt:Key"] = "unit-test-secret-key-unit-test-secret-key-123456",
            ["Jwt:Issuer"] = "unit-tests",
            ["Jwt:Audience"] = "unit-tests-client",
            ["Jwt:ExpiresMinutes"] = "60",
            ["Registry:BaseUrl"] = "http://localhost:5002",
            ["Registry:JwtIssuer"] = "unit-tests-registry",
            ["REGISTRY_JWT_PUBLIC_CERT_PATH"] = Path.Combine(Path.GetTempPath(), $"missing-cert-{Guid.NewGuid():N}.crt")
        };

        if (overrides is not null)
        {
            foreach (var pair in overrides)
                values[pair.Key] = pair.Value;
        }

        return new ConfigurationBuilder()
            .AddInMemoryCollection(values)
            .Build();
    }

    public static async Task<User> AddUserAsync(AppDbContext dbContext, string username, string email, string role = User.RoleUser, bool mustChangePassword = false)
    {
        var user = new User
        {
            Username = username,
            Email = email,
            PasswordHash = User.HashPassword("Password1"),
            Role = role,
            MustChangePassword = mustChangePassword,
            CreatedAt = DateTime.UtcNow
        };

        dbContext.Users.Add(user);
        await dbContext.SaveChangesAsync();
        return user;
    }

    public static async Task<Repository> AddRepositoryAsync(
        AppDbContext dbContext,
        User owner,
        string name,
        string visibility,
        int pullCount,
        int starCount = 0,
        bool isOfficial = false,
        string? description = null)
    {
        var repository = new Repository
        {
            Name = name,
            Description = description ?? $"Description for {name}",
            Visibility = visibility,
            OwnerId = owner.Id,
            Owner = owner,
            CreatedAt = DateTime.UtcNow.AddMinutes(-5),
            UpdatedAt = DateTime.UtcNow,
            PullCount = pullCount,
            StarCount = starCount,
            IsOfficial = isOfficial
        };

        dbContext.Repositories.Add(repository);
        await dbContext.SaveChangesAsync();
        return repository;
    }

    public static async Task<RepositoryTag> AddTagAsync(
        AppDbContext dbContext,
        Repository repository,
        string name,
        int pullCount,
        long compressedSizeBytes)
    {
        var tag = new RepositoryTag
        {
            RepositoryId = repository.Id,
            Repository = repository,
            Name = name,
            PullCount = pullCount,
            CompressedSizeBytes = compressedSizeBytes,
            CreatedAt = DateTime.UtcNow.AddMinutes(-10),
            LastPushedAt = DateTime.UtcNow.AddMinutes(-pullCount),
            LastPulledAt = DateTime.UtcNow.AddMinutes(-Math.Max(1, pullCount))
        };

        dbContext.RepositoryTags.Add(tag);
        await dbContext.SaveChangesAsync();
        return tag;
    }

    public static async Task<Repository> AddOrgRepositoryAsync(
        AppDbContext dbContext,
        Organization org,
        User owner,
        string name,
        string visibility)
    {
        var repository = new Repository
        {
            Name = name,
            Description = $"Description for {name}",
            Visibility = visibility,
            OwnerId = owner.Id,
            Owner = owner,
            OrganizationId = org.Id,
            Organization = org,
            CreatedAt = DateTime.UtcNow.AddMinutes(-5),
            UpdatedAt = DateTime.UtcNow,
            PullCount = 0,
            StarCount = 0,
            IsOfficial = false
        };

        dbContext.Repositories.Add(repository);
        await dbContext.SaveChangesAsync();
        return repository;
    }

    public static T GetProperty<T>(object source, string propertyName)
    {
        var property = source.GetType().GetProperty(propertyName);
        Assert.IsNotNull(property);

        var value = property.GetValue(source);
        Assert.IsNotNull(value);

        return (T)value;
    }
}