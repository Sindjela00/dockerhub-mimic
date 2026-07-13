using backend.Controllers;
using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace backend.Tests;

[TestClass]
public sealed class AdminControllerTests
{
    [TestMethod]
    public async Task CreateAdministrator_WithValidRequest_ReturnsTemporaryPassword()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var controller = new AdminController(new AdminService(dbContext));

        var result = await controller.CreateAdministrator(
            new AdminController.CreateAdministratorRequest("newadmin", "newadmin@example.com"),
            CancellationToken.None);

        var okResult = result as OkObjectResult;
        Assert.IsNotNull(okResult);
        Assert.IsNotNull(okResult.Value);

        var temporaryPassword = TestHelpers.GetProperty<string>(okResult.Value, "temporaryPassword");
        Assert.IsFalse(string.IsNullOrWhiteSpace(temporaryPassword));
    }

    [TestMethod]
    public async Task CreateAdministrator_WithDuplicateEmail_ReturnsConflict()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        await TestHelpers.AddUserAsync(dbContext, "existing", "existing@example.com");
        var controller = new AdminController(new AdminService(dbContext));

        var result = await controller.CreateAdministrator(
            new AdminController.CreateAdministratorRequest("anotherusername", "existing@example.com"),
            CancellationToken.None);

        Assert.IsInstanceOfType<ConflictObjectResult>(result);
    }

    [TestMethod]
    public async Task ListAdministrators_ReturnsAdministratorsList()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        await TestHelpers.AddUserAsync(dbContext, "admin1", "admin1@example.com", User.RoleAdministrator);
        await TestHelpers.AddUserAsync(dbContext, "plainuser", "plainuser@example.com", User.RoleUser);

        var controller = new AdminController(new AdminService(dbContext));
        var result = await controller.ListAdministrators(CancellationToken.None);

        var okResult = result as OkObjectResult;
        Assert.IsNotNull(okResult);
        var admins = okResult.Value as IReadOnlyList<AdminSummary>;
        Assert.IsNotNull(admins);
        Assert.AreEqual(1, admins.Count);
        Assert.AreEqual("admin1", admins[0].Username);
    }
}
