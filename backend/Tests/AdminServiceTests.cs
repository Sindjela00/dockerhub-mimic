using backend.Models;
using backend.Services;
using Microsoft.EntityFrameworkCore;

namespace backend.Tests;

[TestClass]
public sealed class AdminServiceTests
{
    [TestMethod]
    public async Task CreateAdministratorAsync_WithValidData_CreatesUserWithAdministratorRoleAndMustChangePassword()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var service = new AdminService(dbContext);

        var result = await service.CreateAdministratorAsync("newadmin", "NewAdmin@Example.com", CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        Assert.IsFalse(string.IsNullOrWhiteSpace(result.TemporaryPassword));

        var createdUser = await dbContext.Users.FirstAsync(u => u.Email == "newadmin@example.com");
        Assert.AreEqual(User.RoleAdministrator, createdUser.Role);
        Assert.IsTrue(createdUser.MustChangePassword);
        Assert.IsTrue(User.VerifyPassword(result.TemporaryPassword!, createdUser.PasswordHash));
    }

    [TestMethod]
    public async Task CreateAdministratorAsync_WithDuplicateEmail_ReturnsFailure()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        await TestHelpers.AddUserAsync(dbContext, "existing", "existing@example.com");

        var service = new AdminService(dbContext);
        var result = await service.CreateAdministratorAsync("anotherusername", "existing@example.com", CancellationToken.None);

        Assert.IsFalse(result.Succeeded);
        StringAssert.Contains(result.Message, "already exists");
    }

    [TestMethod]
    public async Task CreateAdministratorAsync_WithInvalidUsername_ReturnsValidationError()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var service = new AdminService(dbContext);

        var result = await service.CreateAdministratorAsync("!", "admin@example.com", CancellationToken.None);

        Assert.IsFalse(result.Succeeded);
        StringAssert.Contains(result.Message, "Username");
    }

    [TestMethod]
    public async Task ListAdministratorsAsync_ReturnsOnlyAdministrators()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        await TestHelpers.AddUserAsync(dbContext, "plainuser", "plainuser@example.com", User.RoleUser);
        await TestHelpers.AddUserAsync(dbContext, "admin1", "admin1@example.com", User.RoleAdministrator);
        await TestHelpers.AddUserAsync(dbContext, "superadmin", "superadmin@example.com", User.RoleSuperAdmin);

        var service = new AdminService(dbContext);
        var admins = await service.ListAdministratorsAsync(CancellationToken.None);

        Assert.AreEqual(1, admins.Count);
        Assert.AreEqual("admin1", admins[0].Username);
    }

    [TestMethod]
    public async Task SearchUsersAsync_ReturnsOnlyOrdinaryUsersMatchingSearch()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        await TestHelpers.AddUserAsync(dbContext, "johndoe", "john@example.com", User.RoleUser);
        await TestHelpers.AddUserAsync(dbContext, "janedoe", "jane@example.com", User.RoleUser);
        await TestHelpers.AddUserAsync(dbContext, "admin1", "admin1@example.com", User.RoleAdministrator);

        var service = new AdminService(dbContext);
        var result = await service.SearchUsersAsync("doe", 1, 20, CancellationToken.None);

        Assert.AreEqual(2, result.Total);
        Assert.IsTrue(result.Users.All(u => u.Username is "johndoe" or "janedoe"));
    }

    [TestMethod]
    public async Task SetUserBadgeAsync_WithVerifiedBadge_SetsVerifiedPublisherFlag()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var user = await TestHelpers.AddUserAsync(dbContext, "johndoe", "john@example.com", User.RoleUser);

        var service = new AdminService(dbContext);
        var result = await service.SetUserBadgeAsync(user.Id, "verified", true, CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        Assert.IsTrue(result.User!.VerifiedPublisher);

        var updatedUser = await dbContext.Users.FirstAsync(u => u.Id == user.Id);
        Assert.IsTrue(updatedUser.VerifiedPublisher);
    }

    [TestMethod]
    public async Task SetUserBadgeAsync_WithSponsoredBadgeOnAdministrator_ReturnsFailure()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var admin = await TestHelpers.AddUserAsync(dbContext, "admin1", "admin1@example.com", User.RoleAdministrator);

        var service = new AdminService(dbContext);
        var result = await service.SetUserBadgeAsync(admin.Id, "sponsored", true, CancellationToken.None);

        Assert.IsFalse(result.Succeeded);
        StringAssert.Contains(result.Message, "ordinary users");
    }

    [TestMethod]
    public async Task SetUserBadgeAsync_WithInvalidBadgeName_ReturnsFailure()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var user = await TestHelpers.AddUserAsync(dbContext, "johndoe", "john@example.com", User.RoleUser);

        var service = new AdminService(dbContext);
        var result = await service.SetUserBadgeAsync(user.Id, "not-a-badge", true, CancellationToken.None);

        Assert.IsFalse(result.Succeeded);
        StringAssert.Contains(result.Message, "Badge must be");
    }
}
