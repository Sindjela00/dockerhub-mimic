using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace backend.Tests;

[TestClass]
public sealed class MustChangePasswordAuthorizationTests
{
    [TestMethod]
    public async Task ProtectedEndpoint_WhenMustChangePasswordTrue_ReturnsForbiddenWithCode_ThenSucceedsAfterChange()
    {
        await using var factory = new InMemoryBackendApplicationFactory();
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost") });

        await client.PostAsJsonAsync("/api/auth/register", new
        {
            username = "lockeduser",
            email = "locked@example.com",
            password = "Password1"
        });

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var user = await db.Users.FirstAsync(u => u.Email == "locked@example.com");
            user.MustChangePassword = true;
            await db.SaveChangesAsync();
        }

        var loginResponse = await client.PostAsJsonAsync("/api/auth/login", new
        {
            identifier = "lockeduser",
            password = "Password1"
        });
        var loginBody = await loginResponse.Content.ReadFromJsonAsync<JsonElement>();
        Assert.IsTrue(loginBody.GetProperty("mustChangePassword").GetBoolean());
        var lockedToken = loginBody.GetProperty("token").GetString();

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", lockedToken);
        var blockedResponse = await client.PostAsync("/api/repositories/1/star", new StringContent(""));

        Assert.AreEqual(HttpStatusCode.Forbidden, blockedResponse.StatusCode);
        var blockedBody = await blockedResponse.Content.ReadFromJsonAsync<JsonElement>();
        Assert.AreEqual("MUST_CHANGE_PASSWORD", blockedBody.GetProperty("code").GetString());

        var changeResponse = await client.PostAsJsonAsync("/api/auth/change_password", new
        {
            email = "locked@example.com",
            oldPassword = "Password1",
            newPassword = "Newpass1A"
        });
        var changeBody = await changeResponse.Content.ReadFromJsonAsync<JsonElement>();
        Assert.IsFalse(changeBody.GetProperty("mustChangePassword").GetBoolean());
        var newToken = changeBody.GetProperty("token").GetString();

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", newToken);
        var allowedResponse = await client.PostAsync("/api/repositories/1/star", new StringContent(""));

        Assert.AreNotEqual(HttpStatusCode.Forbidden, allowedResponse.StatusCode);
    }

    [TestMethod]
    public async Task AdminEndpoint_WhenCallerIsRegularAdministrator_ReturnsForbidden()
    {
        await using var factory = new InMemoryBackendApplicationFactory();
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost") });

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Users.Add(new User
            {
                Email = "admin@example.com",
                Username = "admin",
                PasswordHash = User.HashPassword("Password1"),
                Role = User.RoleAdministrator,
                MustChangePassword = false,
                CreatedAt = DateTime.UtcNow
            });
            await db.SaveChangesAsync();
        }

        var loginResponse = await client.PostAsJsonAsync("/api/auth/login", new
        {
            identifier = "admin",
            password = "Password1"
        });
        var loginBody = await loginResponse.Content.ReadFromJsonAsync<JsonElement>();
        var token = loginBody.GetProperty("token").GetString();

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var response = await client.PostAsJsonAsync("/api/admin/administrators", new
        {
            username = "newadmin",
            email = "newadmin@example.com"
        });

        Assert.AreEqual(HttpStatusCode.Forbidden, response.StatusCode);
    }

    private sealed class InMemoryBackendApplicationFactory : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Development");

            // Program.cs reads Jwt:* and the connection string before builder.Build() runs, so
            // ConfigureAppConfiguration (applied later in the host-building pipeline) is too late
            // for those specific values. UseSetting feeds values in via the command-line-style
            // configuration source that WebApplication.CreateBuilder(args) reads immediately.
            builder.UseSetting("SkipDatabaseSeeding", "true");
            builder.UseSetting("SkipElasticsearchInit", "true");
            builder.UseSetting("Jwt:Key", "unit-test-secret-key-unit-test-secret-key-123456");
            builder.UseSetting("Jwt:Issuer", "unit-tests");
            builder.UseSetting("Jwt:Audience", "unit-tests-client");
            builder.UseSetting("Jwt:ExpiresMinutes", "60");
            builder.UseSetting("ConnectionStrings:DefaultConnection", "Host=localhost;Database=unused;Username=unused;Password=unused");
            builder.UseSetting("Redis:Configuration", "localhost:6379");

            builder.ConfigureServices(services =>
            {
                var databaseName = Guid.NewGuid().ToString();
                services.RemoveAll<DbContextOptions<AppDbContext>>();
                services.RemoveAll<IDbContextOptionsConfiguration<AppDbContext>>();
                services.RemoveAll<AppDbContext>();
                services.AddDbContext<AppDbContext>(options => options.UseInMemoryDatabase(databaseName));

                services.RemoveAll<IDistributedCache>();
                services.AddSingleton<IDistributedCache, FakeDistributedCache>();
            });
        }
    }
}
