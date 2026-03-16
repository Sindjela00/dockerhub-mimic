using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Data;

public class DatabaseSeeder
{
    private readonly AppDbContext _dbContext;
    private readonly IConfiguration _configuration;

    public DatabaseSeeder(AppDbContext dbContext, IConfiguration configuration)
    {
        _dbContext = dbContext;
        _configuration = configuration;
    }

    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        await _dbContext.Database.EnsureCreatedAsync(cancellationToken);

        await _dbContext.Database.ExecuteSqlRawAsync(
            "ALTER TABLE \"User\" ADD COLUMN IF NOT EXISTS \"Role\" text NOT NULL DEFAULT 'User';",
            cancellationToken);

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

        var hasAnyUsers = await _dbContext.Users.AnyAsync(cancellationToken);
        if (hasAnyUsers)
        {
            return;
        }

        var demoEmail = _configuration.GetValue<string>("Seed:DemoEmail") ?? "demo@dockerhubmimic.local";
        var demoPassword = _configuration.GetValue<string>("Seed:DemoPassword") ?? "Password1";
        var adminPassword = _configuration.GetValue<string>("Seed:AdminPassword") ?? "Welcome1";
        var demoRole = _configuration.GetValue<string>("Seed:DemoRole") ?? User.RoleUser;

        _dbContext.Users.AddRange(
            new User
            {
                Email = demoEmail.Trim().ToLowerInvariant(),
                PasswordHash = User.HashPassword(demoPassword),
                Role = demoRole,
                CreatedAt = new DateTime(2026, 3, 13, 0, 0, 0, DateTimeKind.Utc)
            },
            new User
            {
                Email = normalizedAdminEmail,
                PasswordHash = User.HashPassword(adminPassword),
                Role = adminRole,
                CreatedAt = new DateTime(2026, 3, 13, 0, 0, 0, DateTimeKind.Utc)
            });

        await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
