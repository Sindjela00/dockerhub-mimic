using backend.Models;
using backend.Services;
using Microsoft.Extensions.Caching.Memory;

namespace backend.Tests;

[TestClass]
public sealed class AuthServiceTests
{
    [TestMethod]
    public async Task RegisterAsync_WithInvalidUsername_ReturnsValidationError()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var service = new AuthService(dbContext, TestHelpers.CreateConfiguration(), new MemoryCache(new MemoryCacheOptions()));

        var result = await service.RegisterAsync("!", "user@example.com", "Password1", CancellationToken.None);

        Assert.IsFalse(result.Succeeded);
        StringAssert.Contains(result.Message, "Username");
    }

    [TestMethod]
    public async Task LoginAsync_WithNormalizedEmail_CachesRegistryCredentials()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var cache = new MemoryCache(new MemoryCacheOptions());
        dbContext.Users.Add(new User
        {
            Email = "user@example.com",
            Username = "demo",
            PasswordHash = User.HashPassword("Password1"),
            Role = User.RoleUser,
            CreatedAt = DateTime.UtcNow
        });
        await dbContext.SaveChangesAsync();

        var service = new AuthService(dbContext, TestHelpers.CreateConfiguration(), cache);
        var result = await service.LoginAsync(" USER@EXAMPLE.COM ", "Password1", CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        Assert.IsTrue(cache.TryGetValue<(string Username, string Password)>("registry_creds_demo", out var cached));
        Assert.AreEqual("demo", cached.Username);
        Assert.AreEqual("Password1", cached.Password);
    }

    [TestMethod]
    public async Task ChangePasswordAsync_WithWrongOldPassword_ReturnsUnauthorizedResult()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        dbContext.Users.Add(new User
        {
            Email = "user@example.com",
            Username = "demo",
            PasswordHash = User.HashPassword("Password1"),
            Role = User.RoleUser,
            CreatedAt = DateTime.UtcNow
        });
        await dbContext.SaveChangesAsync();

        var service = new AuthService(dbContext, TestHelpers.CreateConfiguration(), new MemoryCache(new MemoryCacheOptions()));
        var result = await service.ChangePasswordAsync("user@example.com", "wrong", "Password2", CancellationToken.None);

        Assert.IsFalse(result.Succeeded);
        Assert.AreEqual("Invalid email or password.", result.Message);
    }

    [TestMethod]
    public void HelperMethods_NormalizeAndValidateInputs()
    {
        Assert.AreEqual("user@example.com", AuthService.NormalizeEmail(" USER@EXAMPLE.COM "));
        Assert.AreEqual("demo-user", AuthService.NormalizeUsername(" Demo-User "));
        Assert.AreEqual("demo", AuthService.NormalizeIdentifier(" DEMO "));
        Assert.IsTrue(AuthService.IsValidUsername("demo.user_01"));
        Assert.IsFalse(AuthService.IsValidUsername("ab"));
        Assert.IsTrue(AuthService.IsValidPassword("Password1"));
        Assert.IsFalse(AuthService.IsValidPassword("weak"));
        Assert.IsTrue(AuthService.VerifyPassword("Password1", User.HashPassword("Password1")));
        Assert.IsFalse(AuthService.VerifyPassword("Password1", "invalid"));
    }
}