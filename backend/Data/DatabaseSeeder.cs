using backend.Models;
using backend.Services;
using Microsoft.EntityFrameworkCore;

namespace backend.Data;

public class DatabaseSeeder
{
    private readonly AppDbContext _dbContext;
    private readonly IConfiguration _configuration;
    private readonly HarborService _harborService;
    private readonly ILogger<DatabaseSeeder> _logger;

    public DatabaseSeeder(AppDbContext dbContext, IConfiguration configuration, HarborService harborService, ILogger<DatabaseSeeder> logger)
    {
        _dbContext = dbContext;
        _configuration = configuration;
        _harborService = harborService;
        _logger = logger;
    }

    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        await _dbContext.Database.EnsureCreatedAsync(cancellationToken);

        var adminEmail = _configuration.GetValue<string>("Seed:AdminEmail") ?? "admin@dockerhubmimic.local";
        var adminRole = _configuration.GetValue<string>("Seed:AdminRole") ?? User.RoleAdministrator;
        var normalizedAdminEmail = adminEmail.Trim().ToLowerInvariant();

        var existingAdmin = await _dbContext.Users.FirstOrDefaultAsync(
            user => user.Email == normalizedAdminEmail,
            cancellationToken);

        if (existingAdmin is not null && existingAdmin.Role != adminRole)
        {
            existingAdmin.Role = adminRole;
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        var demoEmail = _configuration.GetValue<string>("Seed:DemoEmail") ?? "demo@dockerhubmimic.local";
        var demoPassword = _configuration.GetValue<string>("Seed:DemoPassword") ?? "Password1";
        var adminPassword = _configuration.GetValue<string>("Seed:AdminPassword") ?? "Welcome1";
        var demoRole = _configuration.GetValue<string>("Seed:DemoRole") ?? User.RoleUser;

        var hasAnyUsers = await _dbContext.Users.AnyAsync(cancellationToken);
        if (!hasAnyUsers)
        {
            _dbContext.Users.AddRange(
                new User
                {
                    Email = demoEmail.Trim().ToLowerInvariant(),
                    Username = "demo",
                    PasswordHash = User.HashPassword(demoPassword),
                    Role = demoRole,
                    CreatedAt = new DateTime(2026, 3, 13, 0, 0, 0, DateTimeKind.Utc)
                },
                new User
                {
                    Email = normalizedAdminEmail,
                    Username = "admin",
                    PasswordHash = User.HashPassword(adminPassword),
                    Role = adminRole,
                    CreatedAt = new DateTime(2026, 3, 13, 0, 0, 0, DateTimeKind.Utc)
                });

            await _dbContext.SaveChangesAsync(cancellationToken);

            // Provision users in Harbor
            await ProvisionHarborUserAsync("demo", demoEmail, demoPassword, cancellationToken);
            await ProvisionHarborUserAsync("admin", normalizedAdminEmail, adminPassword, cancellationToken);
        }

        var demoUser = await _dbContext.Users.FirstOrDefaultAsync(
            user => user.Email == demoEmail.Trim().ToLowerInvariant(),
            cancellationToken);

        var adminUser = await _dbContext.Users.FirstOrDefaultAsync(
            user => user.Email == normalizedAdminEmail,
            cancellationToken);

        if (demoUser is null || adminUser is null)
        {
            return;
        }

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
}
