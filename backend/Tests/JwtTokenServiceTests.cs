using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using backend.Data;
using backend.Models;
using backend.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace backend.Tests;

[TestClass]
public sealed class JwtTokenServiceTests
{
    [TestMethod]
    public void GenerateToken_ContainsExpectedClaims()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Key"] = "unit-test-secret-key-unit-test-secret-key-123456",
                ["Jwt:Issuer"] = "issuer-test",
                ["Jwt:Audience"] = "audience-test",
                ["Jwt:ExpiresMinutes"] = "60"
            })
            .Build();

        var dbOptions = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var service = new AuthService(new AppDbContext(dbOptions), config, TestHelpers.CreateCache());

        var token = service.GenerateToken(new User
        {
            Email = "claims@example.com",
            Role = User.RoleAdministrator,
            PasswordHash = "unused"
        });

        var parsed = new JwtSecurityTokenHandler().ReadJwtToken(token);

        Assert.AreEqual("issuer-test", parsed.Issuer);
        Assert.AreEqual("audience-test", parsed.Audiences.FirstOrDefault());
        Assert.IsTrue(parsed.Claims.Any(claim => claim.Type == JwtRegisteredClaimNames.Email && claim.Value == "claims@example.com"));
        Assert.IsTrue(parsed.Claims.Any(claim =>
            (claim.Type == ClaimTypes.Role || claim.Type == "role")
            && claim.Value == User.RoleAdministrator));
    }
}
