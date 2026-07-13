using backend.Data;
using backend.Models;
using backend.Utils;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public sealed record AdminSummary(int Id, string Username, string Email, string Role, DateTime CreatedAt, bool MustChangePassword);

public sealed record AdminCreationResult(bool Succeeded, string Message, string? Username = null, string? Email = null, string? TemporaryPassword = null);

public sealed record UserBadgeSummary(int Id, string Username, string Email, bool VerifiedPublisher, bool SponsoredOSS);

public sealed record UserBadgeListResult(IReadOnlyList<UserBadgeSummary> Users, int Total);

public sealed record UserBadgeUpdateResult(bool Succeeded, string? Message, UserBadgeSummary? User = null);

public interface IAdminService
{
    Task<AdminCreationResult> CreateAdministratorAsync(string username, string email, CancellationToken cancellationToken);
    Task<IReadOnlyList<AdminSummary>> ListAdministratorsAsync(CancellationToken cancellationToken);
    Task<UserBadgeListResult> SearchUsersAsync(string? search, int page, int pageSize, CancellationToken cancellationToken);
    Task<UserBadgeUpdateResult> SetUserBadgeAsync(int userId, string badge, bool value, CancellationToken cancellationToken);
}

public class AdminService : IAdminService
{
    private readonly AppDbContext _dbContext;

    public AdminService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<AdminCreationResult> CreateAdministratorAsync(string username, string email, CancellationToken cancellationToken)
    {
        if (!AuthService.IsValidUsername(username))
        {
            return new AdminCreationResult(false, "Username must be 3-64 characters and contain only letters, numbers, dots, hyphens, or underscores.");
        }

        var normalizedEmail = AuthService.NormalizeEmail(email);
        var normalizedUsername = AuthService.NormalizeUsername(username);

        var userExists = await _dbContext.Users
            .AnyAsync(u => u.Email == normalizedEmail || u.Username == normalizedUsername, cancellationToken);

        if (userExists)
        {
            return new AdminCreationResult(false, "User with this email or username already exists.");
        }

        var temporaryPassword = SecurePasswordGenerator.Generate();

        _dbContext.Users.Add(new User
        {
            Email = normalizedEmail,
            Username = normalizedUsername,
            PasswordHash = User.HashPassword(temporaryPassword),
            Role = User.RoleAdministrator,
            MustChangePassword = true,
            CreatedAt = DateTime.UtcNow
        });

        await _dbContext.SaveChangesAsync(cancellationToken);

        return new AdminCreationResult(true, "Administrator created successfully.", normalizedUsername, normalizedEmail, temporaryPassword);
    }

    public async Task<IReadOnlyList<AdminSummary>> ListAdministratorsAsync(CancellationToken cancellationToken)
    {
        return await _dbContext.Users
            .Where(u => u.Role == User.RoleAdministrator)
            .OrderBy(u => u.Username)
            .Select(u => new AdminSummary(u.Id, u.Username, u.Email, u.Role, u.CreatedAt, u.MustChangePassword))
            .ToListAsync(cancellationToken);
    }

    public async Task<UserBadgeListResult> SearchUsersAsync(string? search, int page, int pageSize, CancellationToken cancellationToken)
    {
        page = page <= 0 ? 1 : page;
        pageSize = pageSize is <= 0 or > 100 ? 20 : pageSize;

        var query = _dbContext.Users.Where(u => u.Role == User.RoleUser);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var normalizedSearch = search.Trim().ToLowerInvariant();
            query = query.Where(u => u.Username.ToLower().Contains(normalizedSearch) || u.Email.ToLower().Contains(normalizedSearch));
        }

        var total = await query.CountAsync(cancellationToken);
        var users = await query
            .OrderBy(u => u.Username)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new UserBadgeSummary(u.Id, u.Username, u.Email, u.VerifiedPublisher, u.SponsoredOSS))
            .ToListAsync(cancellationToken);

        return new UserBadgeListResult(users, total);
    }

    public async Task<UserBadgeUpdateResult> SetUserBadgeAsync(int userId, string badge, bool value, CancellationToken cancellationToken)
    {
        var normalizedBadge = badge.Trim().ToLowerInvariant();
        if (normalizedBadge != "verified" && normalizedBadge != "sponsored")
            return new UserBadgeUpdateResult(false, "Badge must be 'verified' or 'sponsored'.");

        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
        if (user is null)
            return new UserBadgeUpdateResult(false, "User not found.");

        if (user.Role != User.RoleUser)
            return new UserBadgeUpdateResult(false, "Badges can only be assigned to ordinary users.");

        if (normalizedBadge == "verified")
            user.VerifiedPublisher = value;
        else
            user.SponsoredOSS = value;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return new UserBadgeUpdateResult(true, null, new UserBadgeSummary(user.Id, user.Username, user.Email, user.VerifiedPublisher, user.SponsoredOSS));
    }
}
