using System.Security.Claims;
using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;

namespace backend.Services;

// --- Result types ---
public sealed record RepositoriesResult<T>(bool Succeeded, T? Data, string? ErrorMessage);

// --- DTOs (moved from controller) ---
public sealed record RepositoryOrganizationInfo
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
    public string? AvatarUrl { get; set; }
}

public sealed record RepositoryResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Visibility { get; set; } = string.Empty;
    public string OwnerEmail { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public bool IsOfficial { get; set; }
    public int StarCount { get; set; }
    public int PullCount { get; set; }
    public List<string> Tags { get; set; } = new();
    public bool? IsStarredByCurrentUser { get; set; }
    public RepositoryOrganizationInfo? Organization { get; set; }
}

public sealed record RepositoryListResponse
{
    public List<RepositoryResponse> Repositories { get; set; } = new();
    public int Total { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}

public sealed record RepositoryTagResponse
{
    public string Name { get; set; } = string.Empty;
    public string? Digest { get; set; }
    public string? Os { get; set; }
    public string? Architecture { get; set; }
    public long? CompressedSizeBytes { get; set; }
    public DateTime? LastPulledAt { get; set; }
    public DateTime? LastPushedAt { get; set; }
    public string? LastPushedBy { get; set; }
    public int PullCount { get; set; }
    public string? MediaType { get; set; }
    public DateTime CreatedAt { get; set; }
}

public sealed record RepositoryTagListResponse
{
    public int RepositoryId { get; set; }
    public string RepositoryFullName { get; set; } = string.Empty;
    public int PullCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public List<RepositoryTagResponse> Tags { get; set; } = new();
    public int Total { get; set; }
}

public sealed record RepositoryCollaboratorResponse
{
    public int UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public DateTime AddedAt { get; set; }
}

public sealed record RepositoryCollaboratorListResponse
{
    public int RepositoryId { get; set; }
    public string RepositoryFullName { get; set; } = string.Empty;
    public List<RepositoryCollaboratorResponse> Collaborators { get; set; } = new();
    public int Total { get; set; }
}

public sealed record RepositoryTeamAccessResponse
{
    public int TeamId { get; set; }
    public string TeamName { get; set; } = string.Empty;
    public string OrganizationName { get; set; } = string.Empty;
    public string Permission { get; set; } = string.Empty;
    public int MemberCount { get; set; }
}

public sealed record RepositoryTeamAccessListResponse
{
    public int RepositoryId { get; set; }
    public string RepositoryFullName { get; set; } = string.Empty;
    public List<RepositoryTeamAccessResponse> Teams { get; set; } = new();
    public int Total { get; set; }
}

// --- Interface ---
public interface IRepositoriesService
{
    Task<RepositoriesResult<RepositoryListResponse>> ExploreRepositoriesAsync(
        string? search, string? owner, string? visibility, int? minStars, string? sortBy, string? sortDir,
        bool mine, bool starred, int page, int pageSize, string? currentUsername, CancellationToken cancellationToken);

    Task<RepositoriesResult<RepositoryResponse>> GetRepositoryAsync(int id, string? currentUsername, string? userRole, CancellationToken cancellationToken);

    Task<RepositoriesResult<RepositoryResponse>> CreateRepositoryAsync(
        string name, string? description, string visibility, string username, CancellationToken cancellationToken);

    Task<RepositoriesResult<RepositoryResponse>> UpdateRepositoryAsync(
        int id, string? name, string? description, string? visibility, string? currentUsername, string? userRole, CancellationToken cancellationToken);

    Task<RepositoriesResult<string>> DeleteRepositoryAsync(int id, string? currentUsername, string? userRole, CancellationToken cancellationToken);

    Task<RepositoriesResult<RepositoryTagListResponse>> GetRepositoryTagsAsync(
        int id, string? search, string? sortBy, string? sortDir, int page, int pageSize, string? currentUsername, string? userRole, CancellationToken cancellationToken);

    Task<RepositoriesResult<RepositoryCollaboratorListResponse>> GetRepositoryCollaboratorsAsync(int id, string? currentUsername, string? userRole, CancellationToken cancellationToken);

    Task<RepositoriesResult<RepositoryCollaboratorResponse>> AddRepositoryCollaboratorAsync(
        int id, string identifier, string? role, string? currentUsername, string? userRole, CancellationToken cancellationToken);

    Task<RepositoriesResult<string>> RemoveRepositoryCollaboratorAsync(
        int id, int userId, string? currentUsername, string? userRole, CancellationToken cancellationToken);

    Task<RepositoriesResult<string>> DeleteRepositoryTagAsync(
        int id, string tagName, string? currentUsername, string? userRole, CancellationToken cancellationToken);

    Task<RepositoriesResult<RepositoryResponse>> StarRepositoryAsync(int id, string? currentUsername, CancellationToken cancellationToken);

    Task<RepositoriesResult<RepositoryResponse>> UnstarRepositoryAsync(int id, string? currentUsername, CancellationToken cancellationToken);

    Task<RepositoriesResult<RepositoryTeamAccessListResponse>> GetRepositoryTeamsAsync(int id, string? currentUsername, string? userRole, CancellationToken cancellationToken);

    Task<RepositoriesResult<RepositoryTeamAccessResponse>> SetRepositoryTeamPermissionAsync(int id, int teamId, string permission, string? currentUsername, string? userRole, CancellationToken cancellationToken);

    Task<RepositoriesResult<string>> RemoveRepositoryTeamAsync(int id, int teamId, string? currentUsername, string? userRole, CancellationToken cancellationToken);
}

// --- Implementation ---
public class RepositoriesService : IRepositoriesService
{
    private readonly AppDbContext _dbContext;
    private const string UserModelRoleAdmin = "Administrator";

    public RepositoriesService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<RepositoriesResult<RepositoryListResponse>> ExploreRepositoriesAsync(
        string? search, string? owner, string? visibility, int? minStars, string? sortBy, string? sortDir,
        bool mine, bool starred, int page, int pageSize, string? currentUsername, CancellationToken cancellationToken)
    {
        (page, pageSize) = NormalizePaging(page, pageSize);
        var normalizedCurrentUsername = Normalize(currentUsername ?? string.Empty);

        // If starred=true, require authentication
        if (starred && string.IsNullOrWhiteSpace(normalizedCurrentUsername))
            return new RepositoriesResult<RepositoryListResponse>(false, null, "Unauthorized");

        var query = _dbContext.Repositories
            .Include(r => r.Owner)
            .Include(r => r.Organization)
            .ThenInclude(o => o!.Members)
            .ThenInclude(m => m.User)
            .Include(r => r.Tags)
            .Include(r => r.Collaborators).ThenInclude(c => c.User)
            .Include(r => r.Stars)
            .AsQueryable();

        if (starred)
        {
            // Get the current user's ID
            var currentUser = await _dbContext.Users
                .FirstOrDefaultAsync(u => u.Username == normalizedCurrentUsername, cancellationToken);
            
            if (currentUser is null)
                return new RepositoriesResult<RepositoryListResponse>(false, null, "User not found.");

            // Filter to only starred repositories
            query = query.Where(r => r.Stars.Any(s => s.UserId == currentUser.Id));
        }
        else if (mine)
        {
            if (string.IsNullOrWhiteSpace(normalizedCurrentUsername))
                return new RepositoriesResult<RepositoryListResponse>(false, null, "Unauthorized");

            query = query.Where(r => r.Owner != null && r.Owner.Username == normalizedCurrentUsername);
        }
        else
        {
            var normalizedVisibilityFilter = visibility?.Trim().ToLowerInvariant();
            var includeOwnPrivate = !string.IsNullOrWhiteSpace(normalizedCurrentUsername) &&
                (string.IsNullOrWhiteSpace(visibility) || normalizedVisibilityFilter == "private");
            if (includeOwnPrivate)
            {
                query = query.Where(r =>
                    r.Visibility == "public"
                    || (r.Owner != null && r.Owner.Username == normalizedCurrentUsername)
                    || (r.Organization != null && r.Organization.Members.Any(m => m.User != null && m.User.Username == normalizedCurrentUsername)));
            }
            else
            {
                query = query.Where(r => r.Visibility == "public");
            }
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var normalizedSearch = search.Trim().ToLowerInvariant();
            query = query.Where(r => r.Name.ToLower().Contains(normalizedSearch) || r.Description.ToLower().Contains(normalizedSearch));
        }

        if (!string.IsNullOrWhiteSpace(owner))
        {
            var normalizedOwner = Normalize(owner);
            query = query.Where(r =>
                (r.Owner != null && r.Owner.Username == normalizedOwner)
                || (r.Organization != null && r.Organization.Name == normalizedOwner));
        }

        if (!string.IsNullOrWhiteSpace(visibility))
        {
            var normalizedVisibility = visibility.Trim().ToLowerInvariant();
            if (!IsValidVisibility(normalizedVisibility))
                return new RepositoriesResult<RepositoryListResponse>(false, null, "Visibility filter must be 'public' or 'private'.");

            query = query.Where(r => r.Visibility == normalizedVisibility);
        }

        if (minStars.HasValue)
            query = query.Where(r => r.StarCount >= minStars.Value);

        query = ApplySorting(query, sortBy, sortDir);

        var total = await query.CountAsync(cancellationToken);
        var repos = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(cancellationToken);

        // Determine starred status for current user in one batch query
        HashSet<int>? starredIds = null;
        if (!string.IsNullOrWhiteSpace(normalizedCurrentUsername))
        {
            var currentUser = await _dbContext.Users
                .FirstOrDefaultAsync(u => u.Username == normalizedCurrentUsername, cancellationToken);
            if (currentUser is not null)
            {
                var repoIds = repos.Select(r => r.Id).ToList();
                starredIds = new HashSet<int>(await _dbContext.RepositoryStars
                    .Where(s => s.UserId == currentUser.Id && repoIds.Contains(s.RepositoryId))
                    .Select(s => s.RepositoryId)
                    .ToListAsync(cancellationToken));
            }
        }

        return new RepositoriesResult<RepositoryListResponse>(true, new RepositoryListResponse
        {
            Repositories = repos.Select(r => MapDbRepositoryToResponse(r, starredIds is not null ? starredIds.Contains(r.Id) : null)).ToList(),
            Total = total,
            Page = page,
            PageSize = pageSize
        }, null);
    }

    public async Task<RepositoriesResult<RepositoryResponse>> GetRepositoryAsync(int id, string? currentUsername, string? userRole, CancellationToken cancellationToken)
    {
        var repo = await _dbContext.Repositories
            .Include(r => r.Owner)
            .Include(r => r.Organization)
            .ThenInclude(o => o!.Members)
            .ThenInclude(m => m.User)
            .Include(r => r.Tags)
            .Include(r => r.Collaborators).ThenInclude(c => c.User)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

        if (repo is null)
            return new RepositoriesResult<RepositoryResponse>(false, null, "Repository not found.");

        if (repo.Visibility == "private" && !CanAccessPrivateRepository(repo, currentUsername, userRole))
            return new RepositoriesResult<RepositoryResponse>(false, null, "Forbidden");

        bool? isStarred = null;
        var normalizedUsername = Normalize(currentUsername ?? string.Empty);
        if (!string.IsNullOrWhiteSpace(normalizedUsername))
        {
            var currentUser = await _dbContext.Users
                .FirstOrDefaultAsync(u => u.Username == normalizedUsername, cancellationToken);
            if (currentUser is not null)
                isStarred = await _dbContext.RepositoryStars
                    .AnyAsync(s => s.RepositoryId == id && s.UserId == currentUser.Id, cancellationToken);
        }

        return new RepositoriesResult<RepositoryResponse>(true, MapDbRepositoryToResponse(repo, isStarred), null);
    }

    public async Task<RepositoriesResult<RepositoryResponse>> CreateRepositoryAsync(
        string name, string? description, string visibility, string username, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(name))
            return new RepositoriesResult<RepositoryResponse>(false, null, "Repository name is required.");

        if (name.Length > 100)
            return new RepositoriesResult<RepositoryResponse>(false, null, "Repository name must not exceed 100 characters.");

        if (!IsValidVisibility(visibility))
            return new RepositoriesResult<RepositoryResponse>(false, null, "Visibility must be 'public' or 'private'.");

        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Username == username, cancellationToken);
        if (user == null)
            return new RepositoriesResult<RepositoryResponse>(false, null, "User not found.");

        var normalizedName = name.Trim().ToLowerInvariant();
        var exists = await _dbContext.Repositories.AnyAsync(r => r.OwnerId == user.Id && r.Name == normalizedName, cancellationToken);
        if (exists)
            return new RepositoriesResult<RepositoryResponse>(false, null, "Repository with this name already exists.");

        var now = DateTime.UtcNow;
        var repo = new Repository
        {
            Name = normalizedName,
            Description = description ?? string.Empty,
            Visibility = visibility,
            OwnerId = user.Id,
            CreatedAt = now,
            UpdatedAt = now
        };
        _dbContext.Repositories.Add(repo);
        await _dbContext.SaveChangesAsync(cancellationToken);

        repo.Owner = user;
        return new RepositoriesResult<RepositoryResponse>(true, MapDbRepositoryToResponse(repo), null);
    }

    public async Task<RepositoriesResult<RepositoryResponse>> UpdateRepositoryAsync(
        int id, string? name, string? description, string? visibility, string? currentUsername, string? userRole, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(currentUsername))
            return new RepositoriesResult<RepositoryResponse>(false, null, "Unauthorized");

        var repo = await _dbContext.Repositories
            .Include(r => r.Owner)
            .Include(r => r.Organization)
            .ThenInclude(o => o!.Members)
            .ThenInclude(m => m.User)
            .Include(r => r.Collaborators)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

        if (repo is null)
            return new RepositoriesResult<RepositoryResponse>(false, null, "Repository not found.");

        if (!CanManageRepository(repo, currentUsername, userRole))
            return new RepositoriesResult<RepositoryResponse>(false, null, "Forbidden");

        if (!string.IsNullOrWhiteSpace(name))
        {
            var normalizedName = name.Trim().ToLowerInvariant();
            if (normalizedName.Length > 100)
                return new RepositoriesResult<RepositoryResponse>(false, null, "Repository name must not exceed 100 characters.");

            var nameTaken = await _dbContext.Repositories.AnyAsync(
                r => r.Id != repo.Id
                    && r.Name == normalizedName
                    && ((repo.OrganizationId == null && r.OrganizationId == null && r.OwnerId == repo.OwnerId)
                        || (repo.OrganizationId != null && r.OrganizationId == repo.OrganizationId)),
                cancellationToken);
            if (nameTaken)
                return new RepositoriesResult<RepositoryResponse>(false, null, "Repository with this name already exists.");

            repo.Name = normalizedName;
        }

        if (description is not null)
            repo.Description = description.Trim();

        if (!string.IsNullOrWhiteSpace(visibility))
        {
            var normalizedVisibility = visibility.Trim().ToLowerInvariant();
            if (!IsValidVisibility(normalizedVisibility))
                return new RepositoriesResult<RepositoryResponse>(false, null, "Visibility must be 'public' or 'private'.");

            if (normalizedVisibility == "private" && repo.Collaborators.Count > 0)
                _dbContext.RepositoryCollaborators.RemoveRange(repo.Collaborators);

            repo.Visibility = normalizedVisibility;
        }

        repo.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync(cancellationToken);

        return new RepositoriesResult<RepositoryResponse>(true, MapDbRepositoryToResponse(repo), null);
    }

    public async Task<RepositoriesResult<string>> DeleteRepositoryAsync(int id, string? currentUsername, string? userRole, CancellationToken cancellationToken)
    {
        var repo = await _dbContext.Repositories
            .Include(r => r.Owner)
            .Include(r => r.Organization)
            .ThenInclude(o => o!.Members)
            .ThenInclude(m => m.User)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

        if (repo is null)
            return new RepositoriesResult<string>(false, null, "Repository not found.");

        if (!CanManageRepository(repo, currentUsername, userRole))
            return new RepositoriesResult<string>(false, null, "Forbidden");

        _dbContext.Repositories.Remove(repo);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return new RepositoriesResult<string>(true, "Repository deleted successfully.", null);
    }

    public async Task<RepositoriesResult<RepositoryTagListResponse>> GetRepositoryTagsAsync(
        int id, string? search, string? sortBy, string? sortDir, int page, int pageSize, string? currentUsername, string? userRole, CancellationToken cancellationToken)
    {
        (page, pageSize) = NormalizePaging(page, pageSize);

        var repo = await _dbContext.Repositories
            .Include(r => r.Owner)
            .Include(r => r.Organization)
            .ThenInclude(o => o!.Members)
            .ThenInclude(m => m.User)
            .Include(r => r.Collaborators).ThenInclude(c => c.User)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

        if (repo is null)
            return new RepositoriesResult<RepositoryTagListResponse>(false, null, "Repository not found.");

        if (repo.Visibility == "private" && !CanAccessPrivateRepository(repo, currentUsername, userRole))
            return new RepositoriesResult<RepositoryTagListResponse>(false, null, "Forbidden");

        var tagsQuery = _dbContext.RepositoryTags
            .Where(t => t.RepositoryId == id);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var normalizedSearch = search.Trim().ToLowerInvariant();
            tagsQuery = tagsQuery.Where(t => t.Name.ToLower().Contains(normalizedSearch));
        }

        var total = await tagsQuery.CountAsync(cancellationToken);

        var tags = await ApplyTagSorting(tagsQuery, sortBy, sortDir)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var fullName = repo.IsOfficial ? repo.Name : $"{repo.Organization?.Name ?? repo.Owner?.Username ?? "user"}/{repo.Name}";
        return new RepositoriesResult<RepositoryTagListResponse>(true, new RepositoryTagListResponse
        {
            RepositoryId = repo.Id,
            RepositoryFullName = fullName,
            PullCount = repo.PullCount,
            Page = page,
            PageSize = pageSize,
            Tags = tags.Select(MapTagToResponse).ToList(),
            Total = total
        }, null);
    }

    public async Task<RepositoriesResult<RepositoryCollaboratorListResponse>> GetRepositoryCollaboratorsAsync(int id, string? currentUsername, string? userRole, CancellationToken cancellationToken)
    {
        var repo = await _dbContext.Repositories
            .Include(r => r.Owner)
            .Include(r => r.Organization)
            .ThenInclude(o => o!.Members)
            .ThenInclude(m => m.User)
            .Include(r => r.Collaborators).ThenInclude(c => c.User)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

        if (repo is null)
            return new RepositoriesResult<RepositoryCollaboratorListResponse>(false, null, "Repository not found.");

        if (repo.Visibility == "private" && !CanAccessPrivateRepository(repo, currentUsername, userRole))
            return new RepositoriesResult<RepositoryCollaboratorListResponse>(false, null, "Forbidden");

        var fullName = repo.IsOfficial ? repo.Name : $"{repo.Organization?.Name ?? repo.Owner?.Username ?? "user"}/{repo.Name}";
        var collaborators = repo.Collaborators.OrderBy(c => c.User?.Username).Select(MapCollaboratorToResponse).ToList();

        return new RepositoriesResult<RepositoryCollaboratorListResponse>(true, new RepositoryCollaboratorListResponse
        {
            RepositoryId = repo.Id,
            RepositoryFullName = fullName,
            Collaborators = collaborators,
            Total = collaborators.Count
        }, null);
    }

    public async Task<RepositoriesResult<RepositoryCollaboratorResponse>> AddRepositoryCollaboratorAsync(
        int id, string identifier, string? role, string? currentUsername, string? userRole, CancellationToken cancellationToken)
    {
        var repo = await _dbContext.Repositories
            .Include(r => r.Owner)
            .Include(r => r.Organization)
            .ThenInclude(o => o!.Members)
            .ThenInclude(m => m.User)
            .Include(r => r.Collaborators)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

        if (repo is null)
            return new RepositoriesResult<RepositoryCollaboratorResponse>(false, null, "Repository not found.");

        if (!CanManageRepository(repo, currentUsername, userRole))
            return new RepositoriesResult<RepositoryCollaboratorResponse>(false, null, "Forbidden");

        if (repo.Visibility != "public")
            return new RepositoriesResult<RepositoryCollaboratorResponse>(false, null, "Collaborators can be managed only on public repositories.");

        var normalizedId = Normalize(identifier);
        if (string.IsNullOrWhiteSpace(normalizedId))
            return new RepositoriesResult<RepositoryCollaboratorResponse>(false, null, "Collaborator identifier is required.");

        var collabRole = string.IsNullOrWhiteSpace(role) ? "write" : role.Trim().ToLowerInvariant();
        if (!IsValidCollaboratorRole(collabRole))
            return new RepositoriesResult<RepositoryCollaboratorResponse>(false, null, "Collaborator role must be 'read', 'write', or 'admin'.");

        var user = await _dbContext.Users.FirstOrDefaultAsync(
            u => u.Username == normalizedId || u.Email == normalizedId, cancellationToken);
        if (user is null)
            return new RepositoriesResult<RepositoryCollaboratorResponse>(false, null, "User not found.");

        if (user.Id == repo.OwnerId)
            return new RepositoriesResult<RepositoryCollaboratorResponse>(false, null, "Repository owner is already an implicit collaborator.");

        var existing = await _dbContext.RepositoryCollaborators
            .Include(c => c.User)
            .FirstOrDefaultAsync(c => c.RepositoryId == repo.Id && c.UserId == user.Id, cancellationToken);

        var now = DateTime.UtcNow;
        if (existing is null)
        {
            existing = new RepositoryCollaborator { RepositoryId = repo.Id, UserId = user.Id, Role = collabRole, AddedAt = now, User = user };
            _dbContext.RepositoryCollaborators.Add(existing);
        }
        else
        {
            existing.Role = collabRole;
        }

        repo.UpdatedAt = now;
        await _dbContext.SaveChangesAsync(cancellationToken);

        return new RepositoriesResult<RepositoryCollaboratorResponse>(true, MapCollaboratorToResponse(existing), null);
    }

    public async Task<RepositoriesResult<string>> RemoveRepositoryCollaboratorAsync(
        int id, int userId, string? currentUsername, string? userRole, CancellationToken cancellationToken)
    {
        var repo = await _dbContext.Repositories
            .Include(r => r.Owner)
            .Include(r => r.Organization)
            .ThenInclude(o => o!.Members)
            .ThenInclude(m => m.User)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

        if (repo is null)
            return new RepositoriesResult<string>(false, null, "Repository not found.");

        if (!CanManageRepository(repo, currentUsername, userRole))
            return new RepositoriesResult<string>(false, null, "Forbidden");

        if (repo.OwnerId == userId)
            return new RepositoriesResult<string>(false, null, "Repository owner cannot be removed from collaborators.");

        var collaborator = await _dbContext.RepositoryCollaborators
            .FirstOrDefaultAsync(c => c.RepositoryId == id && c.UserId == userId, cancellationToken);
        if (collaborator is null)
            return new RepositoriesResult<string>(false, null, "Collaborator not found.");

        _dbContext.RepositoryCollaborators.Remove(collaborator);
        repo.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync(cancellationToken);

        return new RepositoriesResult<string>(true, "Collaborator removed successfully.", null);
    }

    public async Task<RepositoriesResult<RepositoryTeamAccessListResponse>> GetRepositoryTeamsAsync(int id, string? currentUsername, string? userRole, CancellationToken cancellationToken)
    {
        var repo = await _dbContext.Repositories
            .Include(r => r.Owner)
            .Include(r => r.Organization)
            .ThenInclude(o => o!.Members)
            .ThenInclude(m => m.User)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

        if (repo is null)
            return new RepositoriesResult<RepositoryTeamAccessListResponse>(false, null, "Repository not found.");

        if (repo.OrganizationId is null)
            return new RepositoriesResult<RepositoryTeamAccessListResponse>(false, null, "Repository does not belong to an organization.");

        // Viewing team access is restricted to org members and system admins
        var normalized = Normalize(currentUsername ?? string.Empty);
        var isSystemAdmin = string.Equals(userRole, UserModelRoleAdmin, StringComparison.OrdinalIgnoreCase);
        var isMember = !string.IsNullOrWhiteSpace(normalized)
            && repo.Organization!.Members.Any(m => Normalize(m.User?.Username ?? string.Empty) == normalized);
        if (!isMember && !isSystemAdmin)
            return new RepositoriesResult<RepositoryTeamAccessListResponse>(false, null, "Forbidden");

        var teamAccess = await _dbContext.OrganizationTeamRepositories
            .Include(tr => tr.Team)
            .ThenInclude(t => t!.TeamMembers)
            .Where(tr => tr.RepositoryId == id)
            .OrderBy(tr => tr.Team!.Name)
            .ToListAsync(cancellationToken);

        var orgName = repo.Organization!.Name;
        var fullName = repo.IsOfficial ? repo.Name : $"{orgName}/{repo.Name}";

        var teams = teamAccess.Select(tr => new RepositoryTeamAccessResponse
        {
            TeamId = tr.TeamId,
            TeamName = tr.Team?.Name ?? string.Empty,
            OrganizationName = orgName,
            Permission = tr.Permission,
            MemberCount = tr.Team?.TeamMembers.Count ?? 0
        }).ToList();

        return new RepositoriesResult<RepositoryTeamAccessListResponse>(true, new RepositoryTeamAccessListResponse
        {
            RepositoryId = repo.Id,
            RepositoryFullName = fullName,
            Teams = teams,
            Total = teams.Count
        }, null);
    }

    public async Task<RepositoriesResult<RepositoryTeamAccessResponse>> SetRepositoryTeamPermissionAsync(int id, int teamId, string permission, string? currentUsername, string? userRole, CancellationToken cancellationToken)
    {
        var repo = await _dbContext.Repositories
            .Include(r => r.Owner)
            .Include(r => r.Organization)
            .ThenInclude(o => o!.Members)
            .ThenInclude(m => m.User)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

        if (repo is null)
            return new RepositoriesResult<RepositoryTeamAccessResponse>(false, null, "Repository not found.");

        if (repo.OrganizationId is null)
            return new RepositoriesResult<RepositoryTeamAccessResponse>(false, null, "Repository does not belong to an organization.");

        if (!CanManageRepository(repo, currentUsername, userRole))
            return new RepositoriesResult<RepositoryTeamAccessResponse>(false, null, "Forbidden");

        var normalizedPermission = Normalize(permission);
        if (!IsValidTeamPermission(normalizedPermission))
            return new RepositoriesResult<RepositoryTeamAccessResponse>(false, null, "Permission must be 'read-only', 'read+write', or 'admin'.");

        var team = await _dbContext.OrganizationTeams
            .Include(t => t.TeamMembers)
            .FirstOrDefaultAsync(t => t.Id == teamId && t.OrganizationId == repo.OrganizationId, cancellationToken);
        if (team is null)
            return new RepositoriesResult<RepositoryTeamAccessResponse>(false, null, "Team not found in this organization.");

        var existing = await _dbContext.OrganizationTeamRepositories
            .FirstOrDefaultAsync(tr => tr.TeamId == teamId && tr.RepositoryId == id, cancellationToken);

        if (existing is null)
        {
            existing = new OrganizationTeamRepository { TeamId = teamId, RepositoryId = id, Permission = normalizedPermission };
            _dbContext.OrganizationTeamRepositories.Add(existing);
        }
        else
        {
            existing.Permission = normalizedPermission;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        return new RepositoriesResult<RepositoryTeamAccessResponse>(true, new RepositoryTeamAccessResponse
        {
            TeamId = team.Id,
            TeamName = team.Name,
            OrganizationName = repo.Organization!.Name,
            Permission = existing.Permission,
            MemberCount = team.TeamMembers.Count
        }, null);
    }

    public async Task<RepositoriesResult<string>> RemoveRepositoryTeamAsync(int id, int teamId, string? currentUsername, string? userRole, CancellationToken cancellationToken)
    {
        var repo = await _dbContext.Repositories
            .Include(r => r.Owner)
            .Include(r => r.Organization)
            .ThenInclude(o => o!.Members)
            .ThenInclude(m => m.User)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

        if (repo is null)
            return new RepositoriesResult<string>(false, null, "Repository not found.");

        if (repo.OrganizationId is null)
            return new RepositoriesResult<string>(false, null, "Repository does not belong to an organization.");

        if (!CanManageRepository(repo, currentUsername, userRole))
            return new RepositoriesResult<string>(false, null, "Forbidden");

        var entry = await _dbContext.OrganizationTeamRepositories
            .FirstOrDefaultAsync(tr => tr.TeamId == teamId && tr.RepositoryId == id, cancellationToken);
        if (entry is null)
            return new RepositoriesResult<string>(false, null, "Team not assigned to this repository.");

        _dbContext.OrganizationTeamRepositories.Remove(entry);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return new RepositoriesResult<string>(true, "Team removed from repository.", null);
    }

    // --- Helpers ---
    private bool CanManageRepository(Repository repo, string? currentUsername, string? userRole)
    {
        var normalized = Normalize(currentUsername ?? string.Empty);
        if (string.IsNullOrWhiteSpace(normalized)) return false;

        var isAdmin = string.Equals(userRole, UserModelRoleAdmin, StringComparison.OrdinalIgnoreCase);
        if (isAdmin)
            return true;

        if (repo.OrganizationId is not null)
        {
            var membership = repo.Organization?.Members.FirstOrDefault(m => Normalize(m.User?.Username ?? string.Empty) == normalized);
            var role = Normalize(membership?.Role ?? string.Empty);
            return role == OrganizationMember.RoleOwner || role == OrganizationMember.RoleAdmin;
        }

        var ownerUsername = Normalize(repo.Owner?.Username ?? string.Empty);
        return normalized == ownerUsername;
    }

    private bool CanAccessPrivateRepository(Repository repo, string? currentUsername, string? userRole = null)
    {
        if (repo.Visibility != "private") return true;
        if (CanManageRepository(repo, currentUsername, userRole))
            return true;

        if (repo.OrganizationId is not null)
        {
            var normalized = Normalize(currentUsername ?? string.Empty);
            if (string.IsNullOrWhiteSpace(normalized))
                return false;

            return repo.Organization?.Members.Any(m => Normalize(m.User?.Username ?? string.Empty) == normalized) == true;
        }

        return false;
    }

    private static (int Page, int PageSize) NormalizePaging(int page, int pageSize)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 20;
        if (pageSize > 100) pageSize = 100;
        return (page, pageSize);
    }

    private static string Normalize(string identifier) => identifier.Trim().ToLowerInvariant();

    private static IQueryable<Repository> ApplySorting(IQueryable<Repository> query, string? sortBy, string? sortDir)
    {
        var normalizedSortBy = (sortBy ?? "updatedAt").Trim().ToLowerInvariant();
        var descending = !string.Equals(sortDir, "asc", StringComparison.OrdinalIgnoreCase);

        return normalizedSortBy switch
        {
            "name" => descending ? query.OrderByDescending(r => r.Name).ThenByDescending(r => r.CreatedAt) : query.OrderBy(r => r.Name).ThenBy(r => r.CreatedAt),
            "createdat" => descending ? query.OrderByDescending(r => r.CreatedAt) : query.OrderBy(r => r.CreatedAt),
            "stars" => descending ? query.OrderByDescending(r => r.StarCount).ThenByDescending(r => r.UpdatedAt) : query.OrderBy(r => r.StarCount).ThenBy(r => r.UpdatedAt),
            "pulls" or "pullcount" => descending ? query.OrderByDescending(r => r.PullCount).ThenByDescending(r => r.UpdatedAt) : query.OrderBy(r => r.PullCount).ThenBy(r => r.UpdatedAt),
            _ => descending ? query.OrderByDescending(r => r.UpdatedAt) : query.OrderBy(r => r.UpdatedAt)
        };
    }

    private static IQueryable<RepositoryTag> ApplyTagSorting(IQueryable<RepositoryTag> query, string? sortBy, string? sortDir)
    {
        var normalizedSortBy = (sortBy ?? "pushedAt").Trim().ToLowerInvariant();
        var descending = !string.Equals(sortDir, "asc", StringComparison.OrdinalIgnoreCase);

        return normalizedSortBy switch
        {
            "name" => descending ? query.OrderByDescending(t => t.Name).ThenByDescending(t => t.CreatedAt) : query.OrderBy(t => t.Name).ThenBy(t => t.CreatedAt),
            "createdat" => descending ? query.OrderByDescending(t => t.CreatedAt) : query.OrderBy(t => t.CreatedAt),
            "pushedat" => descending ? query.OrderByDescending(t => t.LastPushedAt ?? t.CreatedAt).ThenBy(t => t.Name) : query.OrderBy(t => t.LastPushedAt ?? t.CreatedAt).ThenBy(t => t.Name),
            "pulledat" => descending ? query.OrderByDescending(t => t.LastPulledAt ?? DateTime.MinValue).ThenBy(t => t.Name) : query.OrderBy(t => t.LastPulledAt ?? DateTime.MinValue).ThenBy(t => t.Name),
            "pulls" or "pullcount" => descending ? query.OrderByDescending(t => t.PullCount).ThenBy(t => t.Name) : query.OrderBy(t => t.PullCount).ThenBy(t => t.Name),
            "size" => descending ? query.OrderByDescending(t => t.CompressedSizeBytes ?? 0).ThenBy(t => t.Name) : query.OrderBy(t => t.CompressedSizeBytes ?? 0).ThenBy(t => t.Name),
            _ => descending ? query.OrderByDescending(t => t.LastPushedAt ?? t.CreatedAt).ThenBy(t => t.Name) : query.OrderBy(t => t.LastPushedAt ?? t.CreatedAt).ThenBy(t => t.Name)
        };
    }

    private static RepositoryResponse MapDbRepositoryToResponse(Repository repo, bool? isStarredByCurrentUser = null)
    {
        var fullName = repo.IsOfficial ? repo.Name : $"{repo.Organization?.Name ?? repo.Owner?.Username ?? "user"}/{repo.Name}";
        return new RepositoryResponse
        {
            Id = repo.Id,
            Name = repo.Name,
            FullName = fullName,
            Description = repo.Description,
            Visibility = repo.Visibility,
            OwnerEmail = repo.Owner?.Email ?? string.Empty,
            CreatedAt = repo.CreatedAt,
            UpdatedAt = repo.UpdatedAt,
            IsOfficial = repo.IsOfficial,
            StarCount = repo.StarCount,
            PullCount = repo.PullCount,
            Tags = repo.Tags.Select(t => t.Name).ToList(),
            IsStarredByCurrentUser = isStarredByCurrentUser,
            Organization = repo.Organization is not null ? new RepositoryOrganizationInfo
            {
                Id = repo.Organization.Id,
                Name = repo.Organization.Name,
                DisplayName = string.IsNullOrWhiteSpace(repo.Organization.DisplayName) ? null : repo.Organization.DisplayName,
                AvatarUrl = repo.Organization.AvatarUrl
            } : null
        };
    }

    private static RepositoryTagResponse MapTagToResponse(RepositoryTag tag)
    {
        return new RepositoryTagResponse
        {
            Name = tag.Name,
            Digest = tag.Digest,
            Os = tag.Os,
            Architecture = tag.Architecture,
            CompressedSizeBytes = tag.CompressedSizeBytes,
            LastPulledAt = tag.LastPulledAt,
            LastPushedAt = tag.LastPushedAt,
            LastPushedBy = tag.LastPushedBy,
            PullCount = tag.PullCount,
            MediaType = tag.MediaType,
            CreatedAt = tag.CreatedAt
        };
    }

    private static RepositoryCollaboratorResponse MapCollaboratorToResponse(RepositoryCollaborator collaborator)
    {
        return new RepositoryCollaboratorResponse
        {
            UserId = collaborator.UserId,
            Username = collaborator.User?.Username ?? string.Empty,
            Email = collaborator.User?.Email ?? string.Empty,
            Role = collaborator.Role,
            AddedAt = collaborator.AddedAt
        };
    }

    public async Task<RepositoriesResult<string>> DeleteRepositoryTagAsync(
        int id, string tagName, string? currentUsername, string? userRole, CancellationToken cancellationToken)
    {
        var repo = await _dbContext.Repositories
            .Include(r => r.Owner)
            .Include(r => r.Organization)
            .ThenInclude(o => o!.Members)
            .ThenInclude(m => m.User)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

        if (repo is null)
            return new RepositoriesResult<string>(false, null, "Repository not found.");

        if (!CanManageRepository(repo, currentUsername, userRole))
            return new RepositoriesResult<string>(false, null, "Forbidden");

        var normalizedTagName = tagName.Trim().ToLowerInvariant();
        var tag = await _dbContext.RepositoryTags
            .FirstOrDefaultAsync(t => t.RepositoryId == id && t.Name == normalizedTagName, cancellationToken);

        if (tag is null)
            return new RepositoriesResult<string>(false, null, "Tag not found.");

        _dbContext.RepositoryTags.Remove(tag);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return new RepositoriesResult<string>(true, "Tag deleted successfully.", null);
    }

    public async Task<RepositoriesResult<RepositoryResponse>> StarRepositoryAsync(int id, string? currentUsername, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(currentUsername))
            return new RepositoriesResult<RepositoryResponse>(false, null, "Unauthorized");

        var repo = await _dbContext.Repositories
            .Include(r => r.Owner)
            .Include(r => r.Organization)
            .ThenInclude(o => o!.Members)
            .ThenInclude(m => m.User)
            .Include(r => r.Tags)
            .Include(r => r.Collaborators).ThenInclude(c => c.User)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

        if (repo is not null && repo.Visibility == "private" && !CanAccessPrivateRepository(repo, currentUsername, null))
            return new RepositoriesResult<RepositoryResponse>(false, null, "Forbidden");

        if (repo is null)
            return new RepositoriesResult<RepositoryResponse>(false, null, "Repository not found.");

        var normalizedUsername = Normalize(currentUsername);
        var user = await _dbContext.Users
            .FirstOrDefaultAsync(u => u.Username == normalizedUsername, cancellationToken);

        if (user is null)
            return new RepositoriesResult<RepositoryResponse>(false, null, "User not found.");

        // Check if already starred
        var alreadyStarred = await _dbContext.RepositoryStars
            .AnyAsync(s => s.RepositoryId == id && s.UserId == user.Id, cancellationToken);

        if (alreadyStarred)
            return new RepositoriesResult<RepositoryResponse>(false, null, "Repository already starred.");

        var star = new RepositoryStar
        {
            RepositoryId = id,
            UserId = user.Id,
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.RepositoryStars.Add(star);
        repo.StarCount++;
        await _dbContext.SaveChangesAsync(cancellationToken);

        return new RepositoriesResult<RepositoryResponse>(true, MapDbRepositoryToResponse(repo), null);
    }

    public async Task<RepositoriesResult<RepositoryResponse>> UnstarRepositoryAsync(int id, string? currentUsername, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(currentUsername))
            return new RepositoriesResult<RepositoryResponse>(false, null, "Unauthorized");

        var repo = await _dbContext.Repositories
            .Include(r => r.Owner)
            .Include(r => r.Organization)
            .ThenInclude(o => o!.Members)
            .ThenInclude(m => m.User)
            .Include(r => r.Tags)
            .Include(r => r.Collaborators).ThenInclude(c => c.User)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

        if (repo is not null && repo.Visibility == "private" && !CanAccessPrivateRepository(repo, currentUsername, null))
            return new RepositoriesResult<RepositoryResponse>(false, null, "Forbidden");

        if (repo is null)
            return new RepositoriesResult<RepositoryResponse>(false, null, "Repository not found.");

        var normalizedUsername = Normalize(currentUsername);
        var user = await _dbContext.Users
            .FirstOrDefaultAsync(u => u.Username == normalizedUsername, cancellationToken);

        if (user is null)
            return new RepositoriesResult<RepositoryResponse>(false, null, "User not found.");

        var star = await _dbContext.RepositoryStars
            .FirstOrDefaultAsync(s => s.RepositoryId == id && s.UserId == user.Id, cancellationToken);

        if (star is null)
            return new RepositoriesResult<RepositoryResponse>(false, null, "Repository not starred.");

        _dbContext.RepositoryStars.Remove(star);
        repo.StarCount = Math.Max(0, repo.StarCount - 1);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return new RepositoriesResult<RepositoryResponse>(true, MapDbRepositoryToResponse(repo), null);
    }

    private static bool IsValidVisibility(string visibility) => visibility == "public" || visibility == "private";
    private static bool IsValidCollaboratorRole(string role) => role == "read" || role == "write" || role == "admin";
    private static bool IsValidTeamPermission(string permission) =>
        permission == OrganizationTeamRepository.PermissionReadOnly
        || permission == OrganizationTeamRepository.PermissionReadWrite
        || permission == OrganizationTeamRepository.PermissionAdmin;
}
