using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using backend.Data;
using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace backend.Tests;

[TestClass]
public sealed class LogsAuthorizationTests
{
    [TestMethod]
    public async Task SearchLogs_AsPlainUser_ReturnsForbidden()
    {
        await using var factory = new LogsTestApplicationFactory();
        using var client = await CreateAuthenticatedClientAsync(factory, "plainuser", "plainuser@example.com", User.RoleUser);

        var response = await client.GetAsync("/api/admin/logs?query=level:error");

        Assert.AreEqual(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [TestMethod]
    public async Task SearchLogs_AsAdministrator_ReturnsOk()
    {
        await using var factory = new LogsTestApplicationFactory();
        using var client = await CreateAuthenticatedClientAsync(factory, "admin", "admin@example.com", User.RoleAdministrator);

        var response = await client.GetAsync("/api/admin/logs?query=level:error");

        Assert.AreEqual(HttpStatusCode.OK, response.StatusCode);
    }

    [TestMethod]
    public async Task SearchLogs_AsSuperAdmin_ReturnsOk()
    {
        await using var factory = new LogsTestApplicationFactory();
        using var client = await CreateAuthenticatedClientAsync(factory, "superadmin", "superadmin@example.com", User.RoleSuperAdmin);

        var response = await client.GetAsync("/api/admin/logs?query=level:error");

        Assert.AreEqual(HttpStatusCode.OK, response.StatusCode);
    }

    private static async Task<HttpClient> CreateAuthenticatedClientAsync(
        LogsTestApplicationFactory factory,
        string username,
        string email,
        string role)
    {
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Users.Add(new User
            {
                Email = email,
                Username = username,
                PasswordHash = User.HashPassword("Password1"),
                Role = role,
                MustChangePassword = false,
                CreatedAt = DateTime.UtcNow
            });
            await db.SaveChangesAsync();
        }

        var client = factory.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost") });
        var loginResponse = await client.PostAsJsonAsync("/api/auth/login", new { identifier = username, password = "Password1" });
        var loginBody = await loginResponse.Content.ReadFromJsonAsync<JsonElement>();
        var token = loginBody.GetProperty("token").GetString();

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client;
    }

    private sealed class StubLogSearchService : ILogSearchService
    {
        public Task<LogSearchResult> SearchAsync(
            string? queryText,
            DateTime? from,
            DateTime? to,
            int page,
            int pageSize,
            CancellationToken cancellationToken)
            => Task.FromResult(new LogSearchResult(true, 0, [], null));
    }

    private sealed class LogsTestApplicationFactory : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Development");
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

                services.RemoveAll<ILogSearchService>();
                services.AddScoped<ILogSearchService, StubLogSearchService>();

                services.RemoveAll<IDistributedCache>();
                services.AddSingleton<IDistributedCache, FakeDistributedCache>();
            });
        }
    }
}
