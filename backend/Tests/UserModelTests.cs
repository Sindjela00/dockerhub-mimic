using backend.Models;

namespace backend.Tests;

[TestClass]
public sealed class UserModelTests
{
    [TestMethod]
    public void HashPassword_ReturnsSaltAndHashFormat()
    {
        var hash = User.HashPassword("Password1");

        var parts = hash.Split(':');
        Assert.AreEqual(2, parts.Length);
        Assert.IsFalse(string.IsNullOrWhiteSpace(parts[0]));
        Assert.IsFalse(string.IsNullOrWhiteSpace(parts[1]));
    }

    [TestMethod]
    public void HashPassword_SameInput_GeneratesDifferentHashes()
    {
        var hash1 = User.HashPassword("Password1");
        var hash2 = User.HashPassword("Password1");

        Assert.AreNotEqual(hash1, hash2);
    }

    [TestMethod]
    public void IsAdminRole_ReturnsTrueForAdministratorAndSuperAdmin()
    {
        Assert.IsTrue(User.IsAdminRole(User.RoleAdministrator));
        Assert.IsTrue(User.IsAdminRole(User.RoleSuperAdmin));
        Assert.IsTrue(User.IsAdminRole("administrator"));
        Assert.IsTrue(User.IsAdminRole("superadmin"));
    }

    [TestMethod]
    public void IsAdminRole_ReturnsFalseForUserOrNull()
    {
        Assert.IsFalse(User.IsAdminRole(User.RoleUser));
        Assert.IsFalse(User.IsAdminRole(null));
        Assert.IsFalse(User.IsAdminRole(""));
    }
}
