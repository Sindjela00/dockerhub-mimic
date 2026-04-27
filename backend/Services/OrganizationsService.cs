using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public sealed record OrganizationsResult<T>(bool Succeeded, T? Data, string? ErrorMessage);

public sealed record OrganizationResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string OwnerUsername { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public int MemberCount { get; set; }
    public int RepositoryCount { get; set; }
    public string? CurrentUserRole { get; set; }
}

public sealed record OrganizationListResponse
{
    public List<OrganizationResponse> Organizations { get; set; } = new();
    public int Total { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}

public sealed record OrganizationMemberResponse
{
    public int UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public DateTime AddedAt { get; set; }
}

public sealed record OrganizationMemberListResponse
{
    public string OrganizationName { get; set; } = string.Empty;
    public List<OrganizationMemberResponse> Members { get; set; } = new();
    public int Total { get; set; }
}

public sealed record OrganizationTeamResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string OrganizationName { get; set; } = string.Empty;
    public int MemberCount { get; set; }
    public int RepositoryCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public sealed record OrganizationTeamListResponse
{
    public string OrganizationName { get; set; } = string.Empty;
    public List<OrganizationTeamResponse> Teams { get; set; } = new();
    public int Total { get; set; }
}

public sealed record OrganizationTeamMemberResponse
{
    public int UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public DateTime AddedAt { get; set; }
}

public sealed record OrganizationTeamMemberListResponse
{
    public string TeamName { get; set; } = string.Empty;
    public string OrganizationName { get; set; } = string.Empty;
    public List<OrganizationTeamMemberResponse> Members { get; set; } = new();
    public int Total { get; set; }
}

public sealed record OrganizationTeamRepositoryResponse
{
    public int RepositoryId { get; set; }
    public string RepositoryName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Permission { get; set; } = string.Empty;
}

public sealed record OrganizationTeamRepositoryListResponse
{
    public string TeamName { get; set; } = string.Empty;
    public string OrganizationName { get; set; } = string.Empty;
    public List<OrganizationTeamRepositoryResponse> Repositories { get; set; } = new();
    public int Total { get; set; }
}

public interface IOrganizationsService
{
    Task<OrganizationsResult<OrganizationListResponse>> ExploreOrganizationsAsync(string? search, int page, int pageSize, string? currentUsername, CancellationToken cancellationToken);
    Task<OrganizationsResult<OrganizationResponse>> GetOrganizationAsync(string name, string? currentUsername, CancellationToken cancellationToken);
    Task<OrganizationsResult<OrganizationResponse>> CreateOrganizationAsync(string name, string? displayName, string? description, string? avatarUrl, string? currentUsername, CancellationToken cancellationToken);
    Task<OrganizationsResult<OrganizationResponse>> UpdateOrganizationAsync(string name, string? displayName, string? description, string? avatarUrl, string? currentUsername, string? userRole, CancellationToken cancellationToken);
    Task<OrganizationsResult<string>> DeleteOrganizationAsync(string name, string? currentUsername, string? userRole, CancellationToken cancellationToken);
    Task<OrganizationsResult<OrganizationMemberListResponse>> GetOrganizationMembersAsync(string name, string? currentUsername, string? userRole, CancellationToken cancellationToken);
    Task<OrganizationsResult<OrganizationMemberResponse>> AddOrganizationMemberAsync(string name, string identifier, string? role, string? currentUsername, string? userRole, CancellationToken cancellationToken);
    Task<OrganizationsResult<string>> RemoveOrganizationMemberAsync(string name, int userId, string? currentUsername, string? userRole, CancellationToken cancellationToken);
    Task<OrganizationsResult<RepositoryListResponse>> GetOrganizationRepositoriesAsync(string name, string? search, string? visibility, int? minStars, string? sortBy, string? sortDir, int page, int pageSize, string? currentUsername, string? userRole, CancellationToken cancellationToken);
    Task<OrganizationsResult<RepositoryResponse>> CreateOrganizationRepositoryAsync(string name, string repositoryName, string? description, string visibility, string? currentUsername, string? userRole, CancellationToken cancellationToken);
    // Teams
    Task<OrganizationsResult<OrganizationTeamListResponse>> GetOrganizationTeamsAsync(string orgName, string? currentUsername, string? userRole, CancellationToken cancellationToken);
    Task<OrganizationsResult<OrganizationTeamResponse>> GetOrganizationTeamAsync(string orgName, string teamName, string? currentUsername, string? userRole, CancellationToken cancellationToken);
    Task<OrganizationsResult<OrganizationTeamResponse>> CreateOrganizationTeamAsync(string orgName, string teamName, string? description, string? currentUsername, string? userRole, CancellationToken cancellationToken);
    Task<OrganizationsResult<OrganizationTeamResponse>> UpdateOrganizationTeamAsync(string orgName, string teamName, string? newName, string? description, string? currentUsername, string? userRole, CancellationToken cancellationToken);
    Task<OrganizationsResult<string>> DeleteOrganizationTeamAsync(string orgName, string teamName, string? currentUsername, string? userRole, CancellationToken cancellationToken);
    Task<OrganizationsResult<OrganizationTeamMemberListResponse>> GetOrganizationTeamMembersAsync(string orgName, string teamName, string? currentUsername, string? userRole, CancellationToken cancellationToken);
    Task<OrganizationsResult<OrganizationTeamMemberResponse>> AddOrganizationTeamMemberAsync(string orgName, string teamName, int userId, string? currentUsername, string? userRole, CancellationToken cancellationToken);
    Task<OrganizationsResult<string>> RemoveOrganizationTeamMemberAsync(string orgName, string teamName, int userId, string? currentUsername, string? userRole, CancellationToken cancellationToken);
    Task<OrganizationsResult<OrganizationTeamRepositoryListResponse>> GetOrganizationTeamRepositoriesAsync(string orgName, string teamName, string? currentUsername, string? userRole, CancellationToken cancellationToken);
    Task<OrganizationsResult<OrganizationTeamRepositoryResponse>> SetOrganizationTeamRepositoryAsync(string orgName, string teamName, int repositoryId, string permission, string? currentUsername, string? userRole, CancellationToken cancellationToken);
    Task<OrganizationsResult<string>> RemoveOrganizationTeamRepositoryAsync(string orgName, string teamName, int repositoryId, string? currentUsername, string? userRole, CancellationToken cancellationToken);
}

public class OrganizationsService : IOrganizationsService
{
    private readonly AppDbContext _dbContext;

    public OrganizationsService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<OrganizationsResult<OrganizationListResponse>> ExploreOrganizationsAsync(string? search, int page, int pageSize, string? currentUsername, CancellationToken cancellationToken)
    {
        (page, pageSize) = NormalizePaging(page, pageSize);
        var normalizedCurrentUsername = Normalize(currentUsername ?? string.Empty);

        var query = _dbContext.Organizations
            .Include(o => o.Owner)
            .Include(o => o.Members)
            .Include(o => o.Repositories)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var normalizedSearch = search.Trim().ToLowerInvariant();
            query = query.Where(o =>
                o.Name.ToLower().Contains(normalizedSearch)
                || o.DisplayName.ToLower().Contains(normalizedSearch)
                || o.Description.ToLower().Contains(normalizedSearch));
        }

        var total = await query.CountAsync(cancellationToken);
        var organizations = await query
            .OrderBy(o => o.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var currentUser = string.IsNullOrWhiteSpace(normalizedCurrentUsername)
            ? null
            : await _dbContext.Users.FirstOrDefaultAsync(u => u.Username == normalizedCurrentUsername, cancellationToken);

        return new OrganizationsResult<OrganizationListResponse>(true, new OrganizationListResponse
        {
            Organizations = organizations.Select(o => MapOrganization(o, currentUser?.Id)).ToList(),
            Total = total,
            Page = page,
            PageSize = pageSize
        }, null);
    }

    public async Task<OrganizationsResult<OrganizationResponse>> GetOrganizationAsync(string name, string? currentUsername, CancellationToken cancellationToken)
    {
        var normalizedName = Normalize(name);
        var normalizedCurrentUsername = Normalize(currentUsername ?? string.Empty);

        var organization = await _dbContext.Organizations
            .Include(o => o.Owner)
            .Include(o => o.Members)
            .Include(o => o.Repositories)
            .FirstOrDefaultAsync(o => o.Name == normalizedName, cancellationToken);

        if (organization is null)
            return new OrganizationsResult<OrganizationResponse>(false, null, "Organization not found.");

        var currentUser = string.IsNullOrWhiteSpace(normalizedCurrentUsername)
            ? null
            : await _dbContext.Users.FirstOrDefaultAsync(u => u.Username == normalizedCurrentUsername, cancellationToken);

        return new OrganizationsResult<OrganizationResponse>(true, MapOrganization(organization, currentUser?.Id), null);
    }

    public async Task<OrganizationsResult<OrganizationResponse>> CreateOrganizationAsync(string name, string? displayName, string? description, string? avatarUrl, string? currentUsername, CancellationToken cancellationToken)
    {
        var normalizedCurrentUsername = Normalize(currentUsername ?? string.Empty);
        if (string.IsNullOrWhiteSpace(normalizedCurrentUsername))
            return new OrganizationsResult<OrganizationResponse>(false, null, "Unauthorized");

        var normalizedName = Normalize(name);
        if (string.IsNullOrWhiteSpace(normalizedName))
            return new OrganizationsResult<OrganizationResponse>(false, null, "Organization name is required.");

        if (normalizedName.Length > 64)
            return new OrganizationsResult<OrganizationResponse>(false, null, "Organization name cannot exceed 64 characters.");

        var currentUser = await _dbContext.Users
            .FirstOrDefaultAsync(u => u.Username == normalizedCurrentUsername, cancellationToken);
        if (currentUser is null)
            return new OrganizationsResult<OrganizationResponse>(false, null, "User not found.");

        var exists = await _dbContext.Organizations
            .AnyAsync(o => o.Name == normalizedName, cancellationToken);
        if (exists)
            return new OrganizationsResult<OrganizationResponse>(false, null, "Organization with this name already exists.");

        var now = DateTime.UtcNow;
        var organization = new Organization
        {
            Name = normalizedName,
            DisplayName = (displayName ?? string.Empty).Trim(),
            Description = (description ?? string.Empty).Trim(),
            AvatarUrl = string.IsNullOrWhiteSpace(avatarUrl) ? null : avatarUrl.Trim(),
            OwnerId = currentUser.Id,
            CreatedAt = now,
            UpdatedAt = now
        };

        _dbContext.Organizations.Add(organization);
        await _dbContext.SaveChangesAsync(cancellationToken);

        _dbContext.OrganizationMembers.Add(new OrganizationMember
        {
            OrganizationId = organization.Id,
            UserId = currentUser.Id,
            Role = OrganizationMember.RoleOwner,
            AddedAt = now
        });
        await _dbContext.SaveChangesAsync(cancellationToken);

        organization = await _dbContext.Organizations
            .Include(o => o.Owner)
            .Include(o => o.Members)
            .Include(o => o.Repositories)
            .FirstAsync(o => o.Id == organization.Id, cancellationToken);

        return new OrganizationsResult<OrganizationResponse>(true, MapOrganization(organization, currentUser.Id), null);
    }

    public async Task<OrganizationsResult<OrganizationResponse>> UpdateOrganizationAsync(string name, string? displayName, string? description, string? avatarUrl, string? currentUsername, string? userRole, CancellationToken cancellationToken)
    {
        var normalizedName = Normalize(name);
        var organization = await _dbContext.Organizations
            .Include(o => o.Owner)
            .Include(o => o.Members)
            .Include(o => o.Repositories)
            .FirstOrDefaultAsync(o => o.Name == normalizedName, cancellationToken);
        if (organization is null)
            return new OrganizationsResult<OrganizationResponse>(false, null, "Organization not found.");

        var currentUser = await ResolveCurrentUser(currentUsername, cancellationToken);
        var canManage = await CanManageOrganizationAsync(organization, currentUser, userRole, cancellationToken);
        if (!canManage)
            return new OrganizationsResult<OrganizationResponse>(false, null, "Forbidden");

        if (displayName is not null)
            organization.DisplayName = displayName.Trim();
        if (description is not null)
            organization.Description = description.Trim();
        if (avatarUrl is not null)
            organization.AvatarUrl = string.IsNullOrWhiteSpace(avatarUrl) ? null : avatarUrl.Trim();

        organization.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync(cancellationToken);

        return new OrganizationsResult<OrganizationResponse>(true, MapOrganization(organization, currentUser?.Id), null);
    }

    public async Task<OrganizationsResult<string>> DeleteOrganizationAsync(string name, string? currentUsername, string? userRole, CancellationToken cancellationToken)
    {
        var normalizedName = Normalize(name);
        var organization = await _dbContext.Organizations
            .Include(o => o.Members)
            .FirstOrDefaultAsync(o => o.Name == normalizedName, cancellationToken);
        if (organization is null)
            return new OrganizationsResult<string>(false, null, "Organization not found.");

        var currentUser = await ResolveCurrentUser(currentUsername, cancellationToken);
        var canManage = await CanManageOrganizationAsync(organization, currentUser, userRole, cancellationToken);
        if (!canManage)
            return new OrganizationsResult<string>(false, null, "Forbidden");

        _dbContext.Organizations.Remove(organization);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return new OrganizationsResult<string>(true, "Organization deleted successfully.", null);
    }

    public async Task<OrganizationsResult<OrganizationMemberListResponse>> GetOrganizationMembersAsync(string name, string? currentUsername, string? userRole, CancellationToken cancellationToken)
    {
        var normalizedName = Normalize(name);
        var organization = await _dbContext.Organizations
            .Include(o => o.Members).ThenInclude(m => m.User)
            .FirstOrDefaultAsync(o => o.Name == normalizedName, cancellationToken);

        if (organization is null)
            return new OrganizationsResult<OrganizationMemberListResponse>(false, null, "Organization not found.");

        var currentUser = await ResolveCurrentUser(currentUsername, cancellationToken);
        var isMember = currentUser is not null && organization.Members.Any(m => m.UserId == currentUser.Id);
        var isAdmin = string.Equals(userRole, User.RoleAdministrator, StringComparison.OrdinalIgnoreCase);
        if (!isMember && !isAdmin)
            return new OrganizationsResult<OrganizationMemberListResponse>(false, null, "Forbidden");

        var members = organization.Members
            .OrderBy(m => m.User!.Username)
            .Select(m => new OrganizationMemberResponse
            {
                UserId = m.UserId,
                Username = m.User?.Username ?? string.Empty,
                Email = m.User?.Email ?? string.Empty,
                Role = m.Role,
                AddedAt = m.AddedAt
            })
            .ToList();

        return new OrganizationsResult<OrganizationMemberListResponse>(true, new OrganizationMemberListResponse
        {
            OrganizationName = organization.Name,
            Members = members,
            Total = members.Count
        }, null);
    }

    public async Task<OrganizationsResult<OrganizationMemberResponse>> AddOrganizationMemberAsync(string name, string identifier, string? role, string? currentUsername, string? userRole, CancellationToken cancellationToken)
    {
        var normalizedName = Normalize(name);
        var normalizedRole = Normalize(role ?? OrganizationMember.RoleMember);
        if (!IsValidMemberRole(normalizedRole))
            return new OrganizationsResult<OrganizationMemberResponse>(false, null, "Organization role must be 'owner', 'admin', or 'member'.");

        var organization = await _dbContext.Organizations
            .Include(o => o.Members)
            .FirstOrDefaultAsync(o => o.Name == normalizedName, cancellationToken);
        if (organization is null)
            return new OrganizationsResult<OrganizationMemberResponse>(false, null, "Organization not found.");

        var currentUser = await ResolveCurrentUser(currentUsername, cancellationToken);
        var canManage = await CanManageOrganizationAsync(organization, currentUser, userRole, cancellationToken);
        if (!canManage)
            return new OrganizationsResult<OrganizationMemberResponse>(false, null, "Forbidden");

        var normalizedIdentifier = Normalize(identifier);
        var user = await _dbContext.Users
            .FirstOrDefaultAsync(u => u.Username == normalizedIdentifier || u.Email == normalizedIdentifier, cancellationToken);
        if (user is null)
            return new OrganizationsResult<OrganizationMemberResponse>(false, null, "User not found.");

        var existing = await _dbContext.OrganizationMembers
            .FirstOrDefaultAsync(m => m.OrganizationId == organization.Id && m.UserId == user.Id, cancellationToken);

        if (existing is null)
        {
            existing = new OrganizationMember
            {
                OrganizationId = organization.Id,
                UserId = user.Id,
                Role = normalizedRole,
                AddedAt = DateTime.UtcNow
            };
            _dbContext.OrganizationMembers.Add(existing);
        }
        else
        {
            existing.Role = normalizedRole;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return new OrganizationsResult<OrganizationMemberResponse>(true, new OrganizationMemberResponse
        {
            UserId = user.Id,
            Username = user.Username,
            Email = user.Email,
            Role = existing.Role,
            AddedAt = existing.AddedAt
        }, null);
    }

    public async Task<OrganizationsResult<string>> RemoveOrganizationMemberAsync(string name, int userId, string? currentUsername, string? userRole, CancellationToken cancellationToken)
    {
        var normalizedName = Normalize(name);
        var organization = await _dbContext.Organizations
            .Include(o => o.Members)
            .FirstOrDefaultAsync(o => o.Name == normalizedName, cancellationToken);
        if (organization is null)
            return new OrganizationsResult<string>(false, null, "Organization not found.");

        var currentUser = await ResolveCurrentUser(currentUsername, cancellationToken);
        var canManage = await CanManageOrganizationAsync(organization, currentUser, userRole, cancellationToken);
        if (!canManage)
            return new OrganizationsResult<string>(false, null, "Forbidden");

        if (organization.OwnerId == userId)
            return new OrganizationsResult<string>(false, null, "Organization owner cannot be removed.");

        var membership = await _dbContext.OrganizationMembers
            .FirstOrDefaultAsync(m => m.OrganizationId == organization.Id && m.UserId == userId, cancellationToken);
        if (membership is null)
            return new OrganizationsResult<string>(false, null, "Member not found.");

        _dbContext.OrganizationMembers.Remove(membership);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return new OrganizationsResult<string>(true, "Member removed successfully.", null);
    }

    public async Task<OrganizationsResult<RepositoryListResponse>> GetOrganizationRepositoriesAsync(string name, string? search, string? visibility, int? minStars, string? sortBy, string? sortDir, int page, int pageSize, string? currentUsername, string? userRole, CancellationToken cancellationToken)
    {
        (page, pageSize) = NormalizePaging(page, pageSize);
        var normalizedName = Normalize(name);

        var organization = await _dbContext.Organizations
            .Include(o => o.Members)
            .FirstOrDefaultAsync(o => o.Name == normalizedName, cancellationToken);
        if (organization is null)
            return new OrganizationsResult<RepositoryListResponse>(false, null, "Organization not found.");

        var currentUser = await ResolveCurrentUser(currentUsername, cancellationToken);
        var isAdmin = string.Equals(userRole, User.RoleAdministrator, StringComparison.OrdinalIgnoreCase);
        var isMember = currentUser is not null && organization.Members.Any(m => m.UserId == currentUser.Id);

        var query = _dbContext.Repositories
            .Include(r => r.Owner)
            .Include(r => r.Organization)
            .Include(r => r.Tags)
            .Where(r => r.OrganizationId == organization.Id)
            .AsQueryable();

        if (!isMember && !isAdmin)
            query = query.Where(r => r.Visibility == "public");

        if (!string.IsNullOrWhiteSpace(search))
        {
            var normalizedSearch = search.Trim().ToLowerInvariant();
            query = query.Where(r => r.Name.ToLower().Contains(normalizedSearch) || r.Description.ToLower().Contains(normalizedSearch));
        }

        if (!string.IsNullOrWhiteSpace(visibility))
        {
            var normalizedVisibility = visibility.Trim().ToLowerInvariant();
            if (normalizedVisibility != "public" && normalizedVisibility != "private")
                return new OrganizationsResult<RepositoryListResponse>(false, null, "Visibility filter must be 'public' or 'private'.");
            query = query.Where(r => r.Visibility == normalizedVisibility);
        }

        if (minStars.HasValue)
            query = query.Where(r => r.StarCount >= minStars.Value);

        query = ApplyRepositorySorting(query, sortBy, sortDir);

        var total = await query.CountAsync(cancellationToken);
        var repos = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(cancellationToken);

        HashSet<int>? starredIds = null;
        if (currentUser is not null)
        {
            var repoIds = repos.Select(r => r.Id).ToList();
            starredIds = new HashSet<int>(await _dbContext.RepositoryStars
                .Where(s => s.UserId == currentUser.Id && repoIds.Contains(s.RepositoryId))
                .Select(s => s.RepositoryId)
                .ToListAsync(cancellationToken));
        }

        return new OrganizationsResult<RepositoryListResponse>(true, new RepositoryListResponse
        {
            Repositories = repos.Select(r => MapRepository(r, starredIds is not null ? starredIds.Contains(r.Id) : null)).ToList(),
            Total = total,
            Page = page,
            PageSize = pageSize
        }, null);
    }

    public async Task<OrganizationsResult<RepositoryResponse>> CreateOrganizationRepositoryAsync(string name, string repositoryName, string? description, string visibility, string? currentUsername, string? userRole, CancellationToken cancellationToken)
    {
        var normalizedName = Normalize(name);
        var normalizedRepoName = Normalize(repositoryName);
        var normalizedVisibility = Normalize(visibility);

        if (string.IsNullOrWhiteSpace(normalizedRepoName))
            return new OrganizationsResult<RepositoryResponse>(false, null, "Repository name is required.");
        if (normalizedRepoName.Length > 100)
            return new OrganizationsResult<RepositoryResponse>(false, null, "Repository name cannot exceed 100 characters.");
        if (normalizedVisibility != "public" && normalizedVisibility != "private")
            return new OrganizationsResult<RepositoryResponse>(false, null, "Visibility must be 'public' or 'private'.");

        var organization = await _dbContext.Organizations
            .Include(o => o.Members)
            .FirstOrDefaultAsync(o => o.Name == normalizedName, cancellationToken);
        if (organization is null)
            return new OrganizationsResult<RepositoryResponse>(false, null, "Organization not found.");

        var currentUser = await ResolveCurrentUser(currentUsername, cancellationToken);
        var isMember = currentUser is not null && organization.Members.Any(m => m.UserId == currentUser.Id);
        var isSystemAdmin = string.Equals(userRole, User.RoleAdministrator, StringComparison.OrdinalIgnoreCase);
        if (!isMember && !isSystemAdmin)
            return new OrganizationsResult<RepositoryResponse>(false, null, "Forbidden");

        var exists = await _dbContext.Repositories
            .AnyAsync(r => r.OrganizationId == organization.Id && r.Name == normalizedRepoName, cancellationToken);
        if (exists)
            return new OrganizationsResult<RepositoryResponse>(false, null, "Repository with this name already exists in the organization.");

        var now = DateTime.UtcNow;
        var repo = new Repository
        {
            Name = normalizedRepoName,
            Description = (description ?? string.Empty).Trim(),
            Visibility = normalizedVisibility,
            OwnerId = organization.OwnerId,
            OrganizationId = organization.Id,
            CreatedAt = now,
            UpdatedAt = now,
            StarCount = 0,
            PullCount = 0,
            IsOfficial = false
        };

        _dbContext.Repositories.Add(repo);
        await _dbContext.SaveChangesAsync(cancellationToken);

        repo = await _dbContext.Repositories
            .Include(r => r.Owner)
            .Include(r => r.Organization)
            .Include(r => r.Tags)
            .FirstAsync(r => r.Id == repo.Id, cancellationToken);

        return new OrganizationsResult<RepositoryResponse>(true, MapRepository(repo, false), null);
    }

    private static OrganizationResponse MapOrganization(Organization organization, int? currentUserId)
    {
        var currentUserRole = currentUserId is null
            ? null
            : organization.Members.FirstOrDefault(m => m.UserId == currentUserId)?.Role;

        return new OrganizationResponse
        {
            Id = organization.Id,
            Name = organization.Name,
            DisplayName = organization.DisplayName,
            Description = organization.Description,
            AvatarUrl = organization.AvatarUrl,
            OwnerUsername = organization.Owner?.Username ?? string.Empty,
            CreatedAt = organization.CreatedAt,
            UpdatedAt = organization.UpdatedAt,
            MemberCount = organization.Members.Count,
            RepositoryCount = organization.Repositories.Count,
            CurrentUserRole = currentUserRole
        };
    }

    private static RepositoryResponse MapRepository(Repository repository, bool? isStarredByCurrentUser)
    {
        var fullName = repository.IsOfficial
            ? repository.Name
            : $"{repository.Organization?.Name ?? repository.Owner?.Username ?? "user"}/{repository.Name}";

        return new RepositoryResponse
        {
            Id = repository.Id,
            Name = repository.Name,
            FullName = fullName,
            Description = repository.Description,
            Visibility = repository.Visibility,
            OwnerEmail = repository.Owner?.Email ?? string.Empty,
            CreatedAt = repository.CreatedAt,
            UpdatedAt = repository.UpdatedAt,
            IsOfficial = repository.IsOfficial,
            StarCount = repository.StarCount,
            PullCount = repository.PullCount,
            Tags = repository.Tags.Select(t => t.Name).ToList(),
            IsStarredByCurrentUser = isStarredByCurrentUser,
            Organization = repository.Organization is not null ? new RepositoryOrganizationInfo
            {
                Id = repository.Organization.Id,
                Name = repository.Organization.Name,
                DisplayName = string.IsNullOrWhiteSpace(repository.Organization.DisplayName) ? null : repository.Organization.DisplayName,
                AvatarUrl = repository.Organization.AvatarUrl
            } : null
        };
    }

    // ---- Teams ----

    public async Task<OrganizationsResult<OrganizationTeamListResponse>> GetOrganizationTeamsAsync(string orgName, string? currentUsername, string? userRole, CancellationToken cancellationToken)
    {
        var org = await LoadOrgWithMembersAsync(orgName, cancellationToken);
        if (org is null)
            return new OrganizationsResult<OrganizationTeamListResponse>(false, null, "Organization not found.");

        var currentUser = await ResolveCurrentUser(currentUsername, cancellationToken);
        var isMember = currentUser is not null && org.Members.Any(m => m.UserId == currentUser.Id);
        var isAdmin = string.Equals(userRole, User.RoleAdministrator, StringComparison.OrdinalIgnoreCase);
        if (!isMember && !isAdmin)
            return new OrganizationsResult<OrganizationTeamListResponse>(false, null, "Forbidden");

        var teams = await _dbContext.OrganizationTeams
            .Include(t => t.TeamMembers)
            .Include(t => t.TeamRepositories)
            .Where(t => t.OrganizationId == org.Id)
            .OrderBy(t => t.Name)
            .ToListAsync(cancellationToken);

        return new OrganizationsResult<OrganizationTeamListResponse>(true, new OrganizationTeamListResponse
        {
            OrganizationName = org.Name,
            Teams = teams.Select(t => MapTeam(t, org.Name)).ToList(),
            Total = teams.Count
        }, null);
    }

    public async Task<OrganizationsResult<OrganizationTeamResponse>> GetOrganizationTeamAsync(string orgName, string teamName, string? currentUsername, string? userRole, CancellationToken cancellationToken)
    {
        var (org, team) = await LoadOrgAndTeamAsync(orgName, teamName, cancellationToken);
        if (org is null)
            return new OrganizationsResult<OrganizationTeamResponse>(false, null, "Organization not found.");
        if (team is null)
            return new OrganizationsResult<OrganizationTeamResponse>(false, null, "Team not found.");

        var currentUser = await ResolveCurrentUser(currentUsername, cancellationToken);
        var isMember = currentUser is not null && org.Members.Any(m => m.UserId == currentUser.Id);
        var isAdmin = string.Equals(userRole, User.RoleAdministrator, StringComparison.OrdinalIgnoreCase);
        if (!isMember && !isAdmin)
            return new OrganizationsResult<OrganizationTeamResponse>(false, null, "Forbidden");

        return new OrganizationsResult<OrganizationTeamResponse>(true, MapTeam(team, org.Name), null);
    }

    public async Task<OrganizationsResult<OrganizationTeamResponse>> CreateOrganizationTeamAsync(string orgName, string teamName, string? description, string? currentUsername, string? userRole, CancellationToken cancellationToken)
    {
        var org = await LoadOrgWithMembersAsync(orgName, cancellationToken);
        if (org is null)
            return new OrganizationsResult<OrganizationTeamResponse>(false, null, "Organization not found.");

        var currentUser = await ResolveCurrentUser(currentUsername, cancellationToken);
        if (!await CanManageOrganizationAsync(org, currentUser, userRole, cancellationToken))
            return new OrganizationsResult<OrganizationTeamResponse>(false, null, "Forbidden");

        var normalizedTeamName = Normalize(teamName);
        if (string.IsNullOrWhiteSpace(normalizedTeamName) || normalizedTeamName.Length > 64)
            return new OrganizationsResult<OrganizationTeamResponse>(false, null, "Team name is required and cannot exceed 64 characters.");

        var exists = await _dbContext.OrganizationTeams
            .AnyAsync(t => t.OrganizationId == org.Id && t.Name == normalizedTeamName, cancellationToken);
        if (exists)
            return new OrganizationsResult<OrganizationTeamResponse>(false, null, "Team with this name already exists in the organization.");

        var now = DateTime.UtcNow;
        var team = new OrganizationTeam
        {
            OrganizationId = org.Id,
            Name = normalizedTeamName,
            Description = (description ?? string.Empty).Trim(),
            CreatedAt = now,
            UpdatedAt = now
        };
        _dbContext.OrganizationTeams.Add(team);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return new OrganizationsResult<OrganizationTeamResponse>(true, MapTeam(team, org.Name), null);
    }

    public async Task<OrganizationsResult<OrganizationTeamResponse>> UpdateOrganizationTeamAsync(string orgName, string teamName, string? newName, string? description, string? currentUsername, string? userRole, CancellationToken cancellationToken)
    {
        var (org, team) = await LoadOrgAndTeamAsync(orgName, teamName, cancellationToken);
        if (org is null)
            return new OrganizationsResult<OrganizationTeamResponse>(false, null, "Organization not found.");
        if (team is null)
            return new OrganizationsResult<OrganizationTeamResponse>(false, null, "Team not found.");

        var currentUser = await ResolveCurrentUser(currentUsername, cancellationToken);
        if (!await CanManageOrganizationAsync(org, currentUser, userRole, cancellationToken))
            return new OrganizationsResult<OrganizationTeamResponse>(false, null, "Forbidden");

        if (newName is not null)
        {
            var normalizedNewName = Normalize(newName);
            if (string.IsNullOrWhiteSpace(normalizedNewName) || normalizedNewName.Length > 64)
                return new OrganizationsResult<OrganizationTeamResponse>(false, null, "Team name is required and cannot exceed 64 characters.");

            if (normalizedNewName != team.Name)
            {
                var exists = await _dbContext.OrganizationTeams
                    .AnyAsync(t => t.OrganizationId == org.Id && t.Name == normalizedNewName, cancellationToken);
                if (exists)
                    return new OrganizationsResult<OrganizationTeamResponse>(false, null, "Team with this name already exists in the organization.");
                team.Name = normalizedNewName;
            }
        }

        if (description is not null)
            team.Description = description.Trim();

        team.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync(cancellationToken);

        return new OrganizationsResult<OrganizationTeamResponse>(true, MapTeam(team, org.Name), null);
    }

    public async Task<OrganizationsResult<string>> DeleteOrganizationTeamAsync(string orgName, string teamName, string? currentUsername, string? userRole, CancellationToken cancellationToken)
    {
        var (org, team) = await LoadOrgAndTeamAsync(orgName, teamName, cancellationToken);
        if (org is null)
            return new OrganizationsResult<string>(false, null, "Organization not found.");
        if (team is null)
            return new OrganizationsResult<string>(false, null, "Team not found.");

        var currentUser = await ResolveCurrentUser(currentUsername, cancellationToken);
        if (!await CanManageOrganizationAsync(org, currentUser, userRole, cancellationToken))
            return new OrganizationsResult<string>(false, null, "Forbidden");

        _dbContext.OrganizationTeams.Remove(team);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return new OrganizationsResult<string>(true, "Team deleted successfully.", null);
    }

    public async Task<OrganizationsResult<OrganizationTeamMemberListResponse>> GetOrganizationTeamMembersAsync(string orgName, string teamName, string? currentUsername, string? userRole, CancellationToken cancellationToken)
    {
        var (org, team) = await LoadOrgAndTeamWithMembersAsync(orgName, teamName, cancellationToken);
        if (org is null)
            return new OrganizationsResult<OrganizationTeamMemberListResponse>(false, null, "Organization not found.");
        if (team is null)
            return new OrganizationsResult<OrganizationTeamMemberListResponse>(false, null, "Team not found.");

        var currentUser = await ResolveCurrentUser(currentUsername, cancellationToken);
        var isMember = currentUser is not null && org.Members.Any(m => m.UserId == currentUser.Id);
        var isAdmin = string.Equals(userRole, User.RoleAdministrator, StringComparison.OrdinalIgnoreCase);
        if (!isMember && !isAdmin)
            return new OrganizationsResult<OrganizationTeamMemberListResponse>(false, null, "Forbidden");

        var members = team.TeamMembers
            .OrderBy(m => m.User!.Username)
            .Select(m => new OrganizationTeamMemberResponse
            {
                UserId = m.UserId,
                Username = m.User?.Username ?? string.Empty,
                Email = m.User?.Email ?? string.Empty,
                AddedAt = m.AddedAt
            })
            .ToList();

        return new OrganizationsResult<OrganizationTeamMemberListResponse>(true, new OrganizationTeamMemberListResponse
        {
            TeamName = team.Name,
            OrganizationName = org.Name,
            Members = members,
            Total = members.Count
        }, null);
    }

    public async Task<OrganizationsResult<OrganizationTeamMemberResponse>> AddOrganizationTeamMemberAsync(string orgName, string teamName, int userId, string? currentUsername, string? userRole, CancellationToken cancellationToken)
    {
        var (org, team) = await LoadOrgAndTeamAsync(orgName, teamName, cancellationToken);
        if (org is null)
            return new OrganizationsResult<OrganizationTeamMemberResponse>(false, null, "Organization not found.");
        if (team is null)
            return new OrganizationsResult<OrganizationTeamMemberResponse>(false, null, "Team not found.");

        var currentUser = await ResolveCurrentUser(currentUsername, cancellationToken);
        if (!await CanManageOrganizationAsync(org, currentUser, userRole, cancellationToken))
            return new OrganizationsResult<OrganizationTeamMemberResponse>(false, null, "Forbidden");

        var isMemberOfOrg = org.Members.Any(m => m.UserId == userId);
        if (!isMemberOfOrg)
            return new OrganizationsResult<OrganizationTeamMemberResponse>(false, null, "User is not a member of the organization.");

        var targetUser = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
        if (targetUser is null)
            return new OrganizationsResult<OrganizationTeamMemberResponse>(false, null, "User not found.");

        var existing = await _dbContext.OrganizationTeamMembers
            .FirstOrDefaultAsync(tm => tm.TeamId == team.Id && tm.UserId == userId, cancellationToken);

        if (existing is null)
        {
            existing = new OrganizationTeamMember { TeamId = team.Id, UserId = userId, AddedAt = DateTime.UtcNow };
            _dbContext.OrganizationTeamMembers.Add(existing);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        return new OrganizationsResult<OrganizationTeamMemberResponse>(true, new OrganizationTeamMemberResponse
        {
            UserId = targetUser.Id,
            Username = targetUser.Username,
            Email = targetUser.Email,
            AddedAt = existing.AddedAt
        }, null);
    }

    public async Task<OrganizationsResult<string>> RemoveOrganizationTeamMemberAsync(string orgName, string teamName, int userId, string? currentUsername, string? userRole, CancellationToken cancellationToken)
    {
        var (org, team) = await LoadOrgAndTeamAsync(orgName, teamName, cancellationToken);
        if (org is null)
            return new OrganizationsResult<string>(false, null, "Organization not found.");
        if (team is null)
            return new OrganizationsResult<string>(false, null, "Team not found.");

        var currentUser = await ResolveCurrentUser(currentUsername, cancellationToken);
        if (!await CanManageOrganizationAsync(org, currentUser, userRole, cancellationToken))
            return new OrganizationsResult<string>(false, null, "Forbidden");

        var membership = await _dbContext.OrganizationTeamMembers
            .FirstOrDefaultAsync(tm => tm.TeamId == team.Id && tm.UserId == userId, cancellationToken);
        if (membership is null)
            return new OrganizationsResult<string>(false, null, "Team member not found.");

        _dbContext.OrganizationTeamMembers.Remove(membership);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return new OrganizationsResult<string>(true, "Team member removed successfully.", null);
    }

    public async Task<OrganizationsResult<OrganizationTeamRepositoryListResponse>> GetOrganizationTeamRepositoriesAsync(string orgName, string teamName, string? currentUsername, string? userRole, CancellationToken cancellationToken)
    {
        var (org, team) = await LoadOrgAndTeamAsync(orgName, teamName, cancellationToken);
        if (org is null)
            return new OrganizationsResult<OrganizationTeamRepositoryListResponse>(false, null, "Organization not found.");
        if (team is null)
            return new OrganizationsResult<OrganizationTeamRepositoryListResponse>(false, null, "Team not found.");

        var currentUser = await ResolveCurrentUser(currentUsername, cancellationToken);
        var isMember = currentUser is not null && org.Members.Any(m => m.UserId == currentUser.Id);
        var isAdmin = string.Equals(userRole, User.RoleAdministrator, StringComparison.OrdinalIgnoreCase);
        if (!isMember && !isAdmin)
            return new OrganizationsResult<OrganizationTeamRepositoryListResponse>(false, null, "Forbidden");

        var teamRepos = await _dbContext.OrganizationTeamRepositories
            .Include(tr => tr.Repository)
            .Where(tr => tr.TeamId == team.Id)
            .OrderBy(tr => tr.Repository!.Name)
            .ToListAsync(cancellationToken);

        var response = teamRepos.Select(tr => new OrganizationTeamRepositoryResponse
        {
            RepositoryId = tr.RepositoryId,
            RepositoryName = tr.Repository?.Name ?? string.Empty,
            FullName = tr.Repository is null ? string.Empty : $"{org.Name}/{tr.Repository.Name}",
            Permission = tr.Permission
        }).ToList();

        return new OrganizationsResult<OrganizationTeamRepositoryListResponse>(true, new OrganizationTeamRepositoryListResponse
        {
            TeamName = team.Name,
            OrganizationName = org.Name,
            Repositories = response,
            Total = response.Count
        }, null);
    }

    public async Task<OrganizationsResult<OrganizationTeamRepositoryResponse>> SetOrganizationTeamRepositoryAsync(string orgName, string teamName, int repositoryId, string permission, string? currentUsername, string? userRole, CancellationToken cancellationToken)
    {
        var (org, team) = await LoadOrgAndTeamAsync(orgName, teamName, cancellationToken);
        if (org is null)
            return new OrganizationsResult<OrganizationTeamRepositoryResponse>(false, null, "Organization not found.");
        if (team is null)
            return new OrganizationsResult<OrganizationTeamRepositoryResponse>(false, null, "Team not found.");

        var currentUser = await ResolveCurrentUser(currentUsername, cancellationToken);
        if (!await CanManageOrganizationAsync(org, currentUser, userRole, cancellationToken))
            return new OrganizationsResult<OrganizationTeamRepositoryResponse>(false, null, "Forbidden");

        var normalizedPermission = Normalize(permission);
        if (!IsValidTeamPermission(normalizedPermission))
            return new OrganizationsResult<OrganizationTeamRepositoryResponse>(false, null, "Permission must be 'read-only', 'read+write', or 'admin'.");

        var repo = await _dbContext.Repositories
            .FirstOrDefaultAsync(r => r.Id == repositoryId && r.OrganizationId == org.Id, cancellationToken);
        if (repo is null)
            return new OrganizationsResult<OrganizationTeamRepositoryResponse>(false, null, "Repository not found in this organization.");

        var existing = await _dbContext.OrganizationTeamRepositories
            .FirstOrDefaultAsync(tr => tr.TeamId == team.Id && tr.RepositoryId == repositoryId, cancellationToken);

        if (existing is null)
        {
            existing = new OrganizationTeamRepository { TeamId = team.Id, RepositoryId = repositoryId, Permission = normalizedPermission };
            _dbContext.OrganizationTeamRepositories.Add(existing);
        }
        else
        {
            existing.Permission = normalizedPermission;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        return new OrganizationsResult<OrganizationTeamRepositoryResponse>(true, new OrganizationTeamRepositoryResponse
        {
            RepositoryId = repo.Id,
            RepositoryName = repo.Name,
            FullName = $"{org.Name}/{repo.Name}",
            Permission = existing.Permission
        }, null);
    }

    public async Task<OrganizationsResult<string>> RemoveOrganizationTeamRepositoryAsync(string orgName, string teamName, int repositoryId, string? currentUsername, string? userRole, CancellationToken cancellationToken)
    {
        var (org, team) = await LoadOrgAndTeamAsync(orgName, teamName, cancellationToken);
        if (org is null)
            return new OrganizationsResult<string>(false, null, "Organization not found.");
        if (team is null)
            return new OrganizationsResult<string>(false, null, "Team not found.");

        var currentUser = await ResolveCurrentUser(currentUsername, cancellationToken);
        if (!await CanManageOrganizationAsync(org, currentUser, userRole, cancellationToken))
            return new OrganizationsResult<string>(false, null, "Forbidden");

        var entry = await _dbContext.OrganizationTeamRepositories
            .FirstOrDefaultAsync(tr => tr.TeamId == team.Id && tr.RepositoryId == repositoryId, cancellationToken);
        if (entry is null)
            return new OrganizationsResult<string>(false, null, "Repository not assigned to this team.");

        _dbContext.OrganizationTeamRepositories.Remove(entry);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return new OrganizationsResult<string>(true, "Repository removed from team successfully.", null);
    }

    // ---- Private helpers ----

    private async Task<Organization?> LoadOrgWithMembersAsync(string orgName, CancellationToken cancellationToken)
        => await _dbContext.Organizations
            .Include(o => o.Owner)
            .Include(o => o.Members)
            .Include(o => o.Repositories)
            .FirstOrDefaultAsync(o => o.Name == Normalize(orgName), cancellationToken);

    private async Task<(Organization? Org, OrganizationTeam? Team)> LoadOrgAndTeamAsync(string orgName, string teamName, CancellationToken cancellationToken)
    {
        var org = await _dbContext.Organizations
            .Include(o => o.Owner)
            .Include(o => o.Members)
            .FirstOrDefaultAsync(o => o.Name == Normalize(orgName), cancellationToken);
        if (org is null) return (null, null);

        var team = await _dbContext.OrganizationTeams
            .Include(t => t.TeamMembers)
            .Include(t => t.TeamRepositories)
            .FirstOrDefaultAsync(t => t.OrganizationId == org.Id && t.Name == Normalize(teamName), cancellationToken);
        return (org, team);
    }

    private async Task<(Organization? Org, OrganizationTeam? Team)> LoadOrgAndTeamWithMembersAsync(string orgName, string teamName, CancellationToken cancellationToken)
    {
        var org = await _dbContext.Organizations
            .Include(o => o.Owner)
            .Include(o => o.Members)
            .FirstOrDefaultAsync(o => o.Name == Normalize(orgName), cancellationToken);
        if (org is null) return (null, null);

        var team = await _dbContext.OrganizationTeams
            .Include(t => t.TeamMembers).ThenInclude(tm => tm.User)
            .Include(t => t.TeamRepositories)
            .FirstOrDefaultAsync(t => t.OrganizationId == org.Id && t.Name == Normalize(teamName), cancellationToken);
        return (org, team);
    }

    private static OrganizationTeamResponse MapTeam(OrganizationTeam team, string orgName)
        => new()
        {
            Id = team.Id,
            Name = team.Name,
            Description = team.Description,
            OrganizationName = orgName,
            MemberCount = team.TeamMembers.Count,
            RepositoryCount = team.TeamRepositories.Count,
            CreatedAt = team.CreatedAt,
            UpdatedAt = team.UpdatedAt
        };

    private static bool IsValidTeamPermission(string permission)
        => permission == OrganizationTeamRepository.PermissionReadOnly
           || permission == OrganizationTeamRepository.PermissionReadWrite
           || permission == OrganizationTeamRepository.PermissionAdmin;

    private async Task<User?> ResolveCurrentUser(string? currentUsername, CancellationToken cancellationToken)    {
        var normalized = Normalize(currentUsername ?? string.Empty);
        if (string.IsNullOrWhiteSpace(normalized))
            return null;

        return await _dbContext.Users.FirstOrDefaultAsync(u => u.Username == normalized, cancellationToken);
    }

    private async Task<bool> CanManageOrganizationAsync(Organization organization, User? currentUser, string? currentUserRole, CancellationToken cancellationToken)
    {
        if (currentUser is null)
            return false;

        if (string.Equals(currentUserRole, User.RoleAdministrator, StringComparison.OrdinalIgnoreCase))
            return true;

        var member = await _dbContext.OrganizationMembers
            .FirstOrDefaultAsync(m => m.OrganizationId == organization.Id && m.UserId == currentUser.Id, cancellationToken);
        if (member is null)
            return false;

        var normalizedRole = Normalize(member.Role);
        return normalizedRole == OrganizationMember.RoleOwner || normalizedRole == OrganizationMember.RoleAdmin;
    }

    private static bool IsValidMemberRole(string role)
        => role == OrganizationMember.RoleOwner || role == OrganizationMember.RoleAdmin || role == OrganizationMember.RoleMember;

    private static IQueryable<Repository> ApplyRepositorySorting(IQueryable<Repository> query, string? sortBy, string? sortDir)
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

    private static (int Page, int PageSize) NormalizePaging(int page, int pageSize)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 20;
        if (pageSize > 100) pageSize = 100;
        return (page, pageSize);
    }

    private static string Normalize(string input) => input.Trim().ToLowerInvariant();
}