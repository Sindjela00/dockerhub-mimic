using System.Reflection;
using backend.Data;
using backend.Models;
using Microsoft.Extensions.Logging.Abstractions;

namespace backend.Tests;

[TestClass]
public sealed class DatabaseSeederTests
{
    [TestMethod]
    public async Task EnsureUserAsync_CreatesNormalizedUser()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var seeder = CreateSeeder(dbContext);

        var user = await InvokePrivateAsync<User>(seeder, "EnsureUserAsync", "ADMIN@EXAMPLE.COM", " Admin ", "Password1", User.RoleAdministrator, DateTime.UtcNow, CancellationToken.None);

        Assert.AreEqual("ADMIN@EXAMPLE.COM", user.Email);
        Assert.AreEqual("admin", user.Username);
        Assert.AreEqual(1, dbContext.Users.Count());
    }

    [TestMethod]
    public async Task EnsureUserAsync_UpdatesExistingUser()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        dbContext.Users.Add(new User
        {
            Email = "demo@example.com",
            Username = "old",
            PasswordHash = User.HashPassword("Password1"),
            Role = User.RoleUser,
            CreatedAt = DateTime.UtcNow
        });
        await dbContext.SaveChangesAsync();
        var seeder = CreateSeeder(dbContext);

        var updated = await InvokePrivateAsync<User>(seeder, "EnsureUserAsync", "demo@example.com", "Demo", "Password2", User.RoleAdministrator, DateTime.UtcNow, CancellationToken.None);

        Assert.AreEqual("demo", updated.Username);
        Assert.AreEqual(User.RoleAdministrator, updated.Role);
        Assert.IsTrue(User.VerifyPassword("Password2", updated.PasswordHash));
    }

    [TestMethod]
    public async Task EnsureRepositoryAsync_CreatesAndUpdatesRepository()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "demo", "demo@example.com");
        var seeder = CreateSeeder(dbContext);

        await InvokePrivateAsync<object?>(seeder, "EnsureRepositoryAsync", owner, " Sample ", "Created", " Public ", false, DateTime.UtcNow, CancellationToken.None);
        await dbContext.SaveChangesAsync();
        await InvokePrivateAsync<object?>(seeder, "EnsureRepositoryAsync", owner, "sample", "Updated", "private", true, DateTime.UtcNow, CancellationToken.None);
        await dbContext.SaveChangesAsync();

        var repository = dbContext.Repositories.Single();
        Assert.AreEqual("sample", repository.Name);
        Assert.AreEqual("Updated", repository.Description);
        Assert.AreEqual("private", repository.Visibility);
        Assert.IsTrue(repository.IsOfficial);
    }

    [TestMethod]
    public async Task EnsureSuperAdminAsync_CreatesExactlyOneSuperAdminWithMustChangePasswordTrue()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var passwordFilePath = Path.Combine(Path.GetTempPath(), $"super-admin-password-{Guid.NewGuid():N}.txt");
        var seeder = CreateSeeder(dbContext, new Dictionary<string, string?>
        {
            ["Seed:SuperAdminPasswordFilePath"] = passwordFilePath
        });

        try
        {
            await InvokePrivateAsync<object?>(seeder, "EnsureSuperAdminAsync", CancellationToken.None);

            var superAdmins = dbContext.Users.Where(user => user.Role == User.RoleSuperAdmin).ToList();
            Assert.AreEqual(1, superAdmins.Count);
            Assert.IsTrue(superAdmins[0].MustChangePassword);

            Assert.IsTrue(File.Exists(passwordFilePath));
            var generatedPassword = await File.ReadAllTextAsync(passwordFilePath);
            Assert.IsTrue(User.VerifyPassword(generatedPassword, superAdmins[0].PasswordHash));
        }
        finally
        {
            if (File.Exists(passwordFilePath))
                File.Delete(passwordFilePath);
        }
    }

    [TestMethod]
    public async Task EnsureSuperAdminAsync_WhenSuperAdminAlreadyExists_DoesNotRegeneratePasswordOrFile()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var existingSuperAdmin = await TestHelpers.AddUserAsync(dbContext, "superadmin", "superadmin@example.com", User.RoleSuperAdmin, mustChangePassword: false);
        var originalHash = existingSuperAdmin.PasswordHash;

        var passwordFilePath = Path.Combine(Path.GetTempPath(), $"super-admin-password-{Guid.NewGuid():N}.txt");
        var seeder = CreateSeeder(dbContext, new Dictionary<string, string?>
        {
            ["Seed:SuperAdminPasswordFilePath"] = passwordFilePath
        });

        await InvokePrivateAsync<object?>(seeder, "EnsureSuperAdminAsync", CancellationToken.None);

        Assert.AreEqual(1, dbContext.Users.Count(user => user.Role == User.RoleSuperAdmin));
        Assert.AreEqual(originalHash, existingSuperAdmin.PasswordHash);
        Assert.IsFalse(File.Exists(passwordFilePath));
    }

    [TestMethod]
    public void NormalizeHelpers_TrimAndLowercaseValues()
    {
        var normalizeEmail = typeof(DatabaseSeeder).GetMethod("NormalizeEmail", BindingFlags.Static | BindingFlags.NonPublic);
        var normalizeIdentifier = typeof(DatabaseSeeder).GetMethod("NormalizeIdentifier", BindingFlags.Static | BindingFlags.NonPublic);

        Assert.IsNotNull(normalizeEmail);
        Assert.IsNotNull(normalizeIdentifier);
        Assert.AreEqual("admin@example.com", normalizeEmail.Invoke(null, [" ADMIN@EXAMPLE.COM "]));
        Assert.AreEqual("demo-user", normalizeIdentifier.Invoke(null, [" Demo-User "]));
    }

    private static DatabaseSeeder CreateSeeder(AppDbContext dbContext)
        => new(dbContext, TestHelpers.CreateConfiguration(), NullLogger<DatabaseSeeder>.Instance);

    private static DatabaseSeeder CreateSeeder(AppDbContext dbContext, IEnumerable<KeyValuePair<string, string?>> configOverrides)
        => new(dbContext, TestHelpers.CreateConfiguration(configOverrides), NullLogger<DatabaseSeeder>.Instance);

    private static async Task<T> InvokePrivateAsync<T>(object instance, string methodName, params object?[] arguments)
    {
        var method = instance.GetType().GetMethod(methodName, BindingFlags.Instance | BindingFlags.NonPublic);
        Assert.IsNotNull(method);

        var task = method.Invoke(instance, arguments);
        Assert.IsNotNull(task);

        await ((Task)task);

        var resultProperty = task.GetType().GetProperty("Result");
        if (resultProperty is null)
            return default!;

        return (T)resultProperty.GetValue(task)!;
    }
}