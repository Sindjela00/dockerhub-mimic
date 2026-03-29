using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace backend.Tests;

internal static class TestHelpers
{
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

    public static async Task<User> AddUserAsync(AppDbContext dbContext, string username, string email, string role = User.RoleUser)
    {
        var user = new User
        {
            Username = username,
            Email = email,
            PasswordHash = User.HashPassword("Password1"),
            Role = role,
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

    public static T GetProperty<T>(object source, string propertyName)
    {
        var property = source.GetType().GetProperty(propertyName);
        Assert.IsNotNull(property);

        var value = property.GetValue(source);
        Assert.IsNotNull(value);

        return (T)value;
    }
}