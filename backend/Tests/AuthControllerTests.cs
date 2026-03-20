using System.Text.Json;
using backend.Controllers;
using backend.Data;
using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace backend.Tests;

[TestClass]
public sealed class AuthControllerTests
{
    [TestMethod]
    public async Task Register_WithValidRequest_ReturnsTokenAndUserRole()
    {
        using var dbContext = CreateDbContext();
        var controller = CreateController(dbContext);

        var result = await controller.Register(
            new AuthController.RegisterRequest("testuser", "TestUser@Example.com", "Password1"),
            CancellationToken.None);

        var okResult = result as OkObjectResult;
        Assert.IsNotNull(okResult);
        Assert.IsNotNull(okResult.Value);
        Assert.AreEqual("User", GetProperty<string>(okResult.Value, "role"));

        var token = GetProperty<string>(okResult.Value, "token");
        Assert.IsFalse(string.IsNullOrWhiteSpace(token));

        var createdUser = await dbContext.Users.FirstOrDefaultAsync(user => user.Email == "testuser@example.com");
        Assert.IsNotNull(createdUser);
        Assert.AreEqual(User.RoleUser, createdUser.Role);
        Assert.AreEqual("testuser", createdUser.Username);
    }

    [TestMethod]
    public async Task Register_WithInvalidPassword_ReturnsBadRequest()
    {
        using var dbContext = CreateDbContext();
        var controller = CreateController(dbContext);

        var result = await controller.Register(
            new AuthController.RegisterRequest("user", "user@example.com", "weak"),
            CancellationToken.None);

        Assert.IsInstanceOfType<BadRequestObjectResult>(result);
    }

    [TestMethod]
    public async Task Register_WithDuplicateEmail_ReturnsConflict()
    {
        using var dbContext = CreateDbContext();
        dbContext.Users.Add(new User
        {
            Email = "user@example.com",
            Username = "user",
            PasswordHash = User.HashPassword("Password1"),
            Role = User.RoleUser,
            CreatedAt = DateTime.UtcNow
        });
        await dbContext.SaveChangesAsync();

        var controller = CreateController(dbContext);
        var result = await controller.Register(
            new AuthController.RegisterRequest("user", "user@example.com", "Password1"),
            CancellationToken.None);

        Assert.IsInstanceOfType<ConflictObjectResult>(result);
    }

    [TestMethod]
    public async Task Login_WithValidCredentials_ReturnsTokenAndRole()
    {
        using var dbContext = CreateDbContext();
        dbContext.Users.Add(new User
        {
            Email = "admin@example.com",
            Username = "admin",
            PasswordHash = User.HashPassword("Password1"),
            Role = User.RoleAdministrator,
            CreatedAt = DateTime.UtcNow
        });
        await dbContext.SaveChangesAsync();

        var controller = CreateController(dbContext);
        var result = await controller.Login(
            new AuthController.LoginRequest("admin", "Password1"),
            CancellationToken.None);

        var okResult = result as OkObjectResult;
        Assert.IsNotNull(okResult);
        Assert.IsNotNull(okResult.Value);
        Assert.AreEqual(User.RoleAdministrator, GetProperty<string>(okResult.Value, "role"));
        Assert.IsFalse(string.IsNullOrWhiteSpace(GetProperty<string>(okResult.Value, "token")));
    }

    [TestMethod]
    public async Task Login_WithInvalidCredentials_ReturnsUnauthorized()
    {
        using var dbContext = CreateDbContext();
        dbContext.Users.Add(new User
        {
            Email = "user@example.com",
            Username = "user",
            PasswordHash = User.HashPassword("Password1"),
            Role = User.RoleUser,
            CreatedAt = DateTime.UtcNow
        });
        await dbContext.SaveChangesAsync();

        var controller = CreateController(dbContext);
        var result = await controller.Login(
            new AuthController.LoginRequest("user", "WrongPassword1"),
            CancellationToken.None);

        Assert.IsInstanceOfType<UnauthorizedObjectResult>(result);
    }

    [TestMethod]
    public async Task ChangePassword_WithValidRequest_UpdatesHash()
    {
        using var dbContext = CreateDbContext();
        dbContext.Users.Add(new User
        {
            Email = "user@example.com",
            Username = "user",
            PasswordHash = User.HashPassword("Password1"),
            Role = User.RoleUser,
            CreatedAt = DateTime.UtcNow
        });
        await dbContext.SaveChangesAsync();

        var oldHash = (await dbContext.Users.FirstAsync()).PasswordHash;
        var controller = CreateController(dbContext);

        var result = await controller.ChangePassword(
            new AuthController.ChangePasswordRequest("user@example.com", "Password1", "Newpass1A"),
            CancellationToken.None);

        Assert.IsInstanceOfType<OkObjectResult>(result);

        var updatedHash = (await dbContext.Users.FirstAsync()).PasswordHash;
        Assert.AreNotEqual(oldHash, updatedHash);
    }

    [TestMethod]
    public async Task ChangePassword_WithInvalidNewPassword_ReturnsBadRequest()
    {
        using var dbContext = CreateDbContext();
        dbContext.Users.Add(new User
        {
            Email = "user@example.com",
            Username = "user",
            PasswordHash = User.HashPassword("Password1"),
            Role = User.RoleUser,
            CreatedAt = DateTime.UtcNow
        });
        await dbContext.SaveChangesAsync();

        var controller = CreateController(dbContext);
        var result = await controller.ChangePassword(
            new AuthController.ChangePasswordRequest("user@example.com", "Password1", "weak"),
            CancellationToken.None);

        Assert.IsInstanceOfType<BadRequestObjectResult>(result);
    }

    private static AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    private static AuthController CreateController(AppDbContext dbContext)
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Key"] = "unit-test-secret-key-unit-test-secret-key-123456",
                ["Jwt:Issuer"] = "unit-tests",
                ["Jwt:Audience"] = "unit-tests-client",
                ["Jwt:ExpiresMinutes"] = "60",
                ["Registry:BaseUrl"] = "http://localhost:5002"
            })
            .Build();

        var tokenService = new JwtTokenService(config);
        var harborService = new StubHarborService();
        var cache = new MemoryCache(new MemoryCacheOptions());
        return new AuthController(dbContext, tokenService, harborService, cache, config);
    }

    private sealed class StubHarborService : HarborService
    {
        public Task<HarborUserProvisioningResult> CreateUserAsync(string username, string email, string password, CancellationToken cancellationToken)
        {
            return Task.FromResult(new HarborUserProvisioningResult(true));
        }

        public Task<HarborProjectProvisioningResult> CreateProjectAsync(string projectName, bool isPublic = false, string? username = null, string? password = null, CancellationToken cancellationToken = default)
        {
            return Task.FromResult(new HarborProjectProvisioningResult(true));
        }

        public Task<HarborRepositoryProvisioningResult> CreateRepositoryAsync(string projectName, string repositoryName, bool isPublic, int? userId = null, CancellationToken cancellationToken = default)
        {
            return Task.FromResult(new HarborRepositoryProvisioningResult(true));
        }

        public Task<HarborRepositoryDeletionResult> DeleteRepositoryAsync(string projectName, string repositoryName, int? userId = null, CancellationToken cancellationToken = default)
        {
            return Task.FromResult(new HarborRepositoryDeletionResult(true));
        }

        public Task<HarborRepositoryQueryResult> GetRepositoriesAsync(string projectName, int? userId = null, CancellationToken cancellationToken = default)
        {
            return Task.FromResult(new HarborRepositoryQueryResult(true, Array.Empty<HarborRepositoryInfo>()));
        }

        public Task<IReadOnlyList<string>> GetCatalogAsync(CancellationToken cancellationToken = default)
        {
            return Task.FromResult<IReadOnlyList<string>>(Array.Empty<string>());
        }

        public Task<IReadOnlyList<string>> GetTagsAsync(string repositoryName, CancellationToken cancellationToken = default)
        {
            return Task.FromResult<IReadOnlyList<string>>(Array.Empty<string>());
        }

        public Task<JsonElement> GetManifestAsync(string repositoryName, string reference, CancellationToken cancellationToken = default)
        {
            using var doc = JsonDocument.Parse("{}");
            return Task.FromResult(doc.RootElement.Clone());
        }
    }

    private static T GetProperty<T>(object source, string propertyName)
    {
        var property = source.GetType().GetProperty(propertyName);
        Assert.IsNotNull(property);

        var value = property.GetValue(source);
        Assert.IsNotNull(value);

        return (T)value;
    }
}
