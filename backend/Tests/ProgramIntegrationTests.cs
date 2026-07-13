using System.Net;
using System.Net.Http.Json;
using backend.Services;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace backend.Tests;

[TestClass]
public sealed class ProgramIntegrationTests
{
    [TestMethod]
    public async Task RegisterAndLogin_WorkThroughApplicationPipeline()
    {
        await using var factory = new BackendApplicationFactory();
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("https://localhost")
        });

        var registerResponse = await client.PostAsJsonAsync("/api/auth/register", new
        {
            username = "integration",
            email = "integration@example.com",
            password = "Password1"
        });
        var loginResponse = await client.PostAsJsonAsync("/api/auth/login", new
        {
            identifier = "integration",
            password = "Password1"
        });

        Assert.AreEqual(HttpStatusCode.OK, registerResponse.StatusCode);
        Assert.AreEqual(HttpStatusCode.OK, loginResponse.StatusCode);
    }

    [TestMethod]
    public async Task ExploreEndpoint_ReturnsOkFromHostedApplication()
    {
        await using var factory = new BackendApplicationFactory();
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("https://localhost")
        });

        var response = await client.GetAsync("/api/repositories/explore");

        Assert.AreEqual(HttpStatusCode.OK, response.StatusCode);
    }

    private sealed class BackendApplicationFactory : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Development");
            builder.ConfigureAppConfiguration((_, configBuilder) =>
            {
                configBuilder.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["SkipDatabaseSeeding"] = "true",
                    ["SkipElasticsearchInit"] = "true",
                    ["Jwt:Key"] = "unit-test-secret-key-unit-test-secret-key-123456",
                    ["Jwt:Issuer"] = "unit-tests",
                    ["Jwt:Audience"] = "unit-tests-client",
                    ["Jwt:ExpiresMinutes"] = "60",
                    ["ConnectionStrings:DefaultConnection"] = "Host=localhost;Database=unused;Username=unused;Password=unused",
                    ["Redis:Configuration"] = "localhost:6379"
                });
            });

            builder.ConfigureServices(services =>
            {
                services.RemoveAll<IAuthService>();
                services.RemoveAll<IRepositoriesService>();
                services.AddScoped<IAuthService, StubAuthService>();
                services.AddScoped<IRepositoriesService, StubRepositoriesService>();
            });
        }
    }

    private sealed class StubAuthService : IAuthService
    {
        public Task<AuthResult> RegisterAsync(string username, string email, string password, CancellationToken cancellationToken)
            => Task.FromResult(new AuthResult(true, "registered", "token", "User"));

        public Task<AuthResult> LoginAsync(string identifier, string password, CancellationToken cancellationToken)
            => Task.FromResult(new AuthResult(true, "logged-in", "token", "User"));

        public Task<AuthResult> ChangePasswordAsync(string email, string oldPassword, string newPassword, CancellationToken cancellationToken)
            => Task.FromResult(new AuthResult(true, "changed"));

        public string GenerateToken(backend.Models.User user) => "token";
    }

    private sealed class StubRepositoriesService : IRepositoriesService
    {
        public Task<RepositoriesResult<RepositoryListResponse>> ExploreRepositoriesAsync(string? search, string? owner, string? visibility, int? minStars, string? sortBy, string? sortDir, bool mine, bool starred, string? badges, int page, int pageSize, string? currentUsername, CancellationToken cancellationToken)
            => Task.FromResult(new RepositoriesResult<RepositoryListResponse>(true, new RepositoryListResponse { Page = page, PageSize = pageSize, Total = 0 }, null));

        public Task<RepositoriesResult<RepositoryResponse>> GetRepositoryAsync(int id, string? currentUsername, string? userRole, CancellationToken cancellationToken)
            => Task.FromResult(new RepositoriesResult<RepositoryResponse>(true, new RepositoryResponse { Id = id, Name = "repo" }, null));

        public Task<RepositoriesResult<RepositoryResponse>> CreateRepositoryAsync(string name, string? description, string visibility, bool isOfficial, string username, string? userRole, CancellationToken cancellationToken)
            => Task.FromResult(new RepositoriesResult<RepositoryResponse>(true, new RepositoryResponse { Id = 1, Name = name }, null));

        public Task<RepositoriesResult<RepositoryResponse>> UpdateRepositoryAsync(int id, string? name, string? description, string? visibility, string? currentUsername, string? userRole, CancellationToken cancellationToken)
            => Task.FromResult(new RepositoriesResult<RepositoryResponse>(true, new RepositoryResponse { Id = id, Name = name ?? "repo" }, null));

        public Task<RepositoriesResult<string>> DeleteRepositoryAsync(int id, string? currentUsername, string? userRole, CancellationToken cancellationToken)
            => Task.FromResult(new RepositoriesResult<string>(true, "deleted", null));

        public Task<RepositoriesResult<RepositoryTagListResponse>> GetRepositoryTagsAsync(int id, string? search, string? sortBy, string? sortDir, int page, int pageSize, string? currentUsername, string? userRole, CancellationToken cancellationToken)
            => Task.FromResult(new RepositoriesResult<RepositoryTagListResponse>(true, new RepositoryTagListResponse { RepositoryId = id, RepositoryFullName = "demo/repo", Page = page, PageSize = pageSize, Total = 0 }, null));

        public Task<RepositoriesResult<RepositoryCollaboratorListResponse>> GetRepositoryCollaboratorsAsync(int id, string? currentUsername, string? userRole, CancellationToken cancellationToken)
            => Task.FromResult(new RepositoriesResult<RepositoryCollaboratorListResponse>(true, new RepositoryCollaboratorListResponse { RepositoryId = id, RepositoryFullName = "demo/repo", Total = 0 }, null));

        public Task<RepositoriesResult<RepositoryCollaboratorResponse>> AddRepositoryCollaboratorAsync(int id, string identifier, string? role, string? currentUsername, string? userRole, CancellationToken cancellationToken)
            => Task.FromResult(new RepositoriesResult<RepositoryCollaboratorResponse>(true, new RepositoryCollaboratorResponse { UserId = 1, Username = identifier, Role = role ?? "write" }, null));

        public Task<RepositoriesResult<string>> RemoveRepositoryCollaboratorAsync(int id, int userId, string? currentUsername, string? userRole, CancellationToken cancellationToken)
            => Task.FromResult(new RepositoriesResult<string>(true, "removed", null));

        public Task<RepositoriesResult<string>> DeleteRepositoryTagAsync(int id, string tagName, string? currentUsername, string? userRole, CancellationToken cancellationToken)
            => Task.FromResult(new RepositoriesResult<string>(true, "deleted", null));

        public Task<RepositoriesResult<RepositoryResponse>> StarRepositoryAsync(int id, string? currentUsername, CancellationToken cancellationToken)
            => Task.FromResult(new RepositoriesResult<RepositoryResponse>(true, new RepositoryResponse { Id = id, Name = "repo", StarCount = 1 }, null));

        public Task<RepositoriesResult<RepositoryResponse>> UnstarRepositoryAsync(int id, string? currentUsername, CancellationToken cancellationToken)
            => Task.FromResult(new RepositoriesResult<RepositoryResponse>(true, new RepositoryResponse { Id = id, Name = "repo", StarCount = 0 }, null));

        public Task<RepositoriesResult<RepositoryTeamAccessListResponse>> GetRepositoryTeamsAsync(int id, string? currentUsername, string? userRole, CancellationToken cancellationToken)
            => Task.FromResult(new RepositoriesResult<RepositoryTeamAccessListResponse>(true, new RepositoryTeamAccessListResponse { RepositoryId = id }, null));

        public Task<RepositoriesResult<RepositoryTeamAccessResponse>> SetRepositoryTeamPermissionAsync(int id, int teamId, string permission, string? currentUsername, string? userRole, CancellationToken cancellationToken)
            => Task.FromResult(new RepositoriesResult<RepositoryTeamAccessResponse>(true, new RepositoryTeamAccessResponse { TeamId = teamId }, null));

        public Task<RepositoriesResult<string>> RemoveRepositoryTeamAsync(int id, int teamId, string? currentUsername, string? userRole, CancellationToken cancellationToken)
            => Task.FromResult(new RepositoriesResult<string>(true, "removed", null));

        public Task<RepositoriesResult<UserDashboardStatsResponse>> GetDashboardStatsAsync(string? currentUsername, CancellationToken cancellationToken)
            => Task.FromResult(new RepositoriesResult<UserDashboardStatsResponse>(true, new UserDashboardStatsResponse(), null));
    }
}