using backend.Models;
using backend.Services;
using Microsoft.EntityFrameworkCore;
using System.Net;

namespace backend.Data;

public class DatabaseSeeder
{
    private readonly AppDbContext _dbContext;
    private readonly IConfiguration _configuration;
    private readonly HarborService _harborService;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<DatabaseSeeder> _logger;

    public DatabaseSeeder(
        AppDbContext dbContext,
        IConfiguration configuration,
        HarborService harborService,
        IHttpClientFactory httpClientFactory,
        ILogger<DatabaseSeeder> logger)
    {
        _dbContext = dbContext;
        _configuration = configuration;
        _harborService = harborService;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        await _dbContext.Database.EnsureCreatedAsync(cancellationToken);

        var adminEmail = _configuration.GetValue<string>("Seed:AdminEmail") ?? "admin@dockerhubmimic.local";
        var adminRole = _configuration.GetValue<string>("Seed:AdminRole") ?? User.RoleAdministrator;
        var normalizedAdminEmail = adminEmail.Trim().ToLowerInvariant();

        var demoEmail = _configuration.GetValue<string>("Seed:DemoEmail") ?? "demo@dockerhubmimic.local";
        var normalizedDemoEmail = demoEmail.Trim().ToLowerInvariant();
        var demoPassword = _configuration.GetValue<string>("Seed:DemoPassword") ?? "Password1";
        var adminPassword = _configuration.GetValue<string>("Seed:AdminPassword") ?? "Welcome1";
        var demoRole = _configuration.GetValue<string>("Seed:DemoRole") ?? User.RoleUser;

        var seededCreatedAt = new DateTime(2026, 3, 13, 0, 0, 0, DateTimeKind.Utc);
        var existingDemo = await _dbContext.Users.FirstOrDefaultAsync(
            user => user.Email == normalizedDemoEmail,
            cancellationToken);
        var existingAdmin = await _dbContext.Users.FirstOrDefaultAsync(
            user => user.Email == normalizedAdminEmail,
            cancellationToken);

        if (existingDemo is null)
        {
            _dbContext.Users.Add(new User
            {
                Email = normalizedDemoEmail,
                Username = "demo",
                PasswordHash = User.HashPassword(demoPassword),
                Role = demoRole,
                CreatedAt = seededCreatedAt
            });
        }
        else
        {
            existingDemo.Username = "demo";
            existingDemo.PasswordHash = User.HashPassword(demoPassword);
            existingDemo.Role = demoRole;
        }

        if (existingAdmin is null)
        {
            _dbContext.Users.Add(new User
            {
                Email = normalizedAdminEmail,
                Username = "admin",
                PasswordHash = User.HashPassword(adminPassword),
                Role = adminRole,
                CreatedAt = seededCreatedAt
            });
        }
        else
        {
            existingAdmin.Username = "admin";
            existingAdmin.PasswordHash = User.HashPassword(adminPassword);
            existingAdmin.Role = adminRole;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        var harborReady = await WaitForHarborAsync(cancellationToken);
        if (!harborReady)
        {
            _logger.LogWarning("Seed: Harbor API is unavailable; skipping Harbor user/repository provisioning for this startup.");
            return;
        }

        // Keep these calls idempotent so users/repositories are eventually provisioned
        // once Harbor becomes available, even if Harbor was down on a previous startup.
        // Harbor built-in admin is managed by Harbor itself and should not be provisioned here.
        await ProvisionHarborUserAsync("demo", normalizedDemoEmail, demoPassword, cancellationToken);

        // Seed Harbor repositories (no DB persistence — Harbor is the source of truth)
        await ProvisionHarborRepositoryAsync("demo", "hello-world", isPublic: true, cancellationToken);
        await ProvisionHarborRepositoryAsync("demo", "private-sample", isPublic: false, cancellationToken);
        await ProvisionHarborRepositoryAsync("admin", "official-nginx", isPublic: true, cancellationToken);
    }

    private async Task ProvisionHarborUserAsync(string username, string email, string password, CancellationToken cancellationToken)
    {
        var result = await _harborService.CreateUserAsync(username, email, password, cancellationToken);
        if (!result.Succeeded && result.StatusCode != StatusCodes.Status409Conflict)
        {
            _logger.LogWarning("Seed: Failed to create Harbor user {Username}: {Error}", username, result.ErrorMessage);
        }
    }

    private async Task ProvisionHarborRepositoryAsync(string projectName, string repositoryName, bool isPublic, CancellationToken cancellationToken)
    {
        var result = await _harborService.CreateRepositoryAsync(projectName, repositoryName, isPublic, cancellationToken: cancellationToken);
        if (!result.Succeeded)
        {
            _logger.LogWarning("Seed: Failed to create Harbor repository {Project}/{Repository}: {Error}", projectName, repositoryName, result.ErrorMessage);
        }
    }

    private async Task<bool> WaitForHarborAsync(CancellationToken cancellationToken)
    {
        var apiBaseUrl = (_configuration["Harbor:ApiBaseUrl"] ?? "http://harbor-core:8080").TrimEnd('/');
        var client = _httpClientFactory.CreateClient("HarborApi");

        const int maxAttempts = 8;
        var delay = TimeSpan.FromSeconds(2);

        for (var attempt = 1; attempt <= maxAttempts; attempt++)
        {
            try
            {
                using var request = new HttpRequestMessage(HttpMethod.Get, $"{apiBaseUrl}/api/v2.0/ping");
                using var response = await client.SendAsync(request, cancellationToken);

                if (response.StatusCode == HttpStatusCode.OK)
                {
                    return true;
                }

                _logger.LogInformation(
                    "Seed: Harbor readiness check attempt {Attempt}/{MaxAttempts} returned status {StatusCode}.",
                    attempt,
                    maxAttempts,
                    (int)response.StatusCode);
            }
            catch (HttpRequestException ex)
            {
                _logger.LogInformation(
                    ex,
                    "Seed: Harbor readiness check attempt {Attempt}/{MaxAttempts} failed to connect.",
                    attempt,
                    maxAttempts);
            }

            if (attempt < maxAttempts)
            {
                await Task.Delay(delay, cancellationToken);
            }
        }

        return false;
    }
}
