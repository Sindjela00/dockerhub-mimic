using System.ComponentModel.DataAnnotations;
using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json.Serialization;

namespace backend.Controllers;

[ApiController]
[Route("api/repositories")]
public class RepositoriesController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public RepositoriesController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    // ============ Endpoints ============

    /// <summary>
    /// Explore repositories with basic filters. Use mine=true for the current user's repositories.
    /// </summary>
    [HttpGet("explore")]
    public async Task<IActionResult> ExploreRepositories(
        [FromQuery] string? search,
        [FromQuery] string? owner,
        [FromQuery] string? visibility,
        [FromQuery] int? minStars,
        [FromQuery] string? sortBy,
        [FromQuery] string? sortDir,
        [FromQuery] bool mine = false,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        (page, pageSize) = NormalizePaging(page, pageSize);

        var currentUsername = GetCurrentUsername();
        var normalizedCurrentUsername = NormalizeIdentifier(currentUsername ?? string.Empty);

        var query = _dbContext.Repositories
            .Include(r => r.Owner)
            .Include(r => r.Tags)
            .AsQueryable();

        if (mine)
        {
            if (string.IsNullOrWhiteSpace(normalizedCurrentUsername))
            {
                return Unauthorized();
            }

            query = query.Where(r => r.Owner != null && r.Owner.Username == normalizedCurrentUsername);
        }
        else
        {
            // Default explore shows public repositories, plus the current user's private repositories if authenticated.
            var includeOwnPrivate = !string.IsNullOrWhiteSpace(normalizedCurrentUsername) && string.IsNullOrWhiteSpace(visibility);
            if (includeOwnPrivate)
            {
                query = query.Where(r => r.Visibility == "public"
                    || (r.Owner != null && r.Owner.Username == normalizedCurrentUsername));
            }
            else
            {
                query = query.Where(r => r.Visibility == "public");
            }
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var normalizedSearch = search.Trim().ToLowerInvariant();
            query = query.Where(r =>
                r.Name.ToLower().Contains(normalizedSearch)
                || r.Description.ToLower().Contains(normalizedSearch));
        }

        if (!string.IsNullOrWhiteSpace(owner))
        {
            var normalizedOwner = NormalizeIdentifier(owner);
            query = query.Where(r => r.Owner != null && r.Owner.Username == normalizedOwner);
        }

        if (!string.IsNullOrWhiteSpace(visibility))
        {
            var normalizedVisibility = visibility.Trim().ToLowerInvariant();
            if (!IsValidVisibility(normalizedVisibility))
            {
                return BadRequest(new { message = "Visibility filter must be 'public' or 'private'." });
            }

            if (!mine && normalizedVisibility == "private")
            {
                return BadRequest(new { message = "Private repositories can be explored only with mine=true." });
            }

            query = query.Where(r => r.Visibility == normalizedVisibility);
        }

        if (minStars.HasValue)
        {
            query = query.Where(r => r.StarCount >= minStars.Value);
        }

        query = ApplySorting(query, sortBy, sortDir);

        var total = await query.CountAsync(cancellationToken);
        var repos = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return Ok(new RepositoryListResponse
        {
            Repositories = repos.Select(MapDbRepositoryToResponse).ToList(),
            Total = total,
            Page = page,
            PageSize = pageSize
        });
    }

    /// <summary>
    /// Get a specific repository by id.
    /// </summary>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetRepository(int id, CancellationToken cancellationToken = default)
    {
        var repo = await _dbContext.Repositories
            .Include(r => r.Owner)
            .Include(r => r.Tags)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

        if (repo is null)
        {
            return NotFound(new { message = "Repository not found." });
        }

        if (repo.Visibility == "private" && !CanAccessPrivateRepository(repo))
        {
            return Forbid();
        }

        return Ok(MapDbRepositoryToResponse(repo));
    }

    /// <summary>
    /// Create a new repository
    /// </summary>
    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CreateRepository(
        [FromBody] CreateRepositoryRequest request,
        CancellationToken cancellationToken = default)
    {
        var username = GetCurrentUsername();
        if (string.IsNullOrEmpty(username))
            return Unauthorized();

        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { message = "Repository name is required." });

        if (request.Name.Length > 100)
            return BadRequest(new { message = "Repository name must not exceed 100 characters." });

        if (!IsValidVisibility(request.Visibility))
            return BadRequest(new { message = "Visibility must be 'public' or 'private'." });

        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Username == username, cancellationToken);
        if (user == null)
            return Unauthorized();

        var normalizedName = request.Name.Trim().ToLowerInvariant();

        var exists = await _dbContext.Repositories
            .AnyAsync(r => r.OwnerId == user.Id && r.Name == normalizedName, cancellationToken);
        if (exists)
            return Conflict(new { message = "Repository with this name already exists." });

        var now = DateTime.UtcNow;
        var repo = new Repository
        {
            Name = normalizedName,
            Description = request.Description ?? string.Empty,
            Visibility = request.Visibility,
            OwnerId = user.Id,
            CreatedAt = now,
            UpdatedAt = now
        };
        _dbContext.Repositories.Add(repo);
        await _dbContext.SaveChangesAsync(cancellationToken);

        repo.Owner = user;
        var responseRepository = MapDbRepositoryToResponse(repo);
        return StatusCode(201, new { message = "Repository created successfully.", repository = responseRepository });
    }

    /// <summary>
    /// Update repository details.
    /// </summary>
    [HttpPut("{id:int}")]
    [Authorize]
    public async Task<IActionResult> UpdateRepository(
        int id,
        [FromBody] UpdateRepositoryRequest request,
        CancellationToken cancellationToken = default)
    {
        var username = GetCurrentUsername();
        if (string.IsNullOrWhiteSpace(username))
        {
            return Unauthorized();
        }

        var repo = await _dbContext.Repositories
            .Include(r => r.Owner)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

        if (repo is null)
        {
            return NotFound(new { message = "Repository not found." });
        }

        if (!CanManageRepository(repo))
        {
            return Forbid();
        }

        if (!string.IsNullOrWhiteSpace(request.Name))
        {
            var normalizedName = request.Name.Trim().ToLowerInvariant();
            if (normalizedName.Length > 100)
            {
                return BadRequest(new { message = "Repository name must not exceed 100 characters." });
            }

            var nameTaken = await _dbContext.Repositories
                .AnyAsync(r => r.OwnerId == repo.OwnerId && r.Name == normalizedName && r.Id != repo.Id, cancellationToken);
            if (nameTaken)
            {
                return Conflict(new { message = "Repository with this name already exists." });
            }

            repo.Name = normalizedName;
        }

        if (request.Description is not null)
        {
            repo.Description = request.Description.Trim();
        }

        if (!string.IsNullOrWhiteSpace(request.Visibility))
        {
            var normalizedVisibility = request.Visibility.Trim().ToLowerInvariant();
            if (!IsValidVisibility(normalizedVisibility))
            {
                return BadRequest(new { message = "Visibility must be 'public' or 'private'." });
            }

            repo.Visibility = normalizedVisibility;
        }

        repo.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(new
        {
            message = "Repository updated successfully.",
            repository = MapDbRepositoryToResponse(repo)
        });
    }

    /// <summary>
    /// Delete repository.
    /// </summary>
    [HttpDelete("{id:int}")]
    [Authorize]
    public async Task<IActionResult> DeleteRepository(int id, CancellationToken cancellationToken = default)
    {
        var repo = await _dbContext.Repositories
            .Include(r => r.Owner)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

        if (repo is null)
        {
            return NotFound(new { message = "Repository not found." });
        }

        if (!CanManageRepository(repo))
        {
            return Forbid();
        }

        _dbContext.Repositories.Remove(repo);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    /// <summary>
    /// Receives Docker Registry notifications and syncs repositories into local DB.
    /// </summary>
    [HttpPost("/registry/events")]
    [AllowAnonymous]
    public async Task<IActionResult> HandleRegistryEvents(
        [FromBody] RegistryEventEnvelope? envelope,
        CancellationToken cancellationToken = default)
    {
        if (envelope?.Events is null || envelope.Events.Count == 0)
        {
            return Ok(new { message = "No events received." });
        }

        var now = DateTime.UtcNow;

        foreach (var ev in envelope.Events)
        {
            var action = (ev.Action ?? string.Empty).Trim().ToLowerInvariant();
            if (action != "push")
            {
                continue;
            }

            var repositoryPath = (ev.Target?.Repository ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(repositoryPath))
            {
                continue;
            }

            // Expected format: <namespace>/<repository>
            var slashIndex = repositoryPath.IndexOf('/');
            if (slashIndex <= 0 || slashIndex >= repositoryPath.Length - 1)
            {
                continue;
            }

            var namespacePart = NormalizeIdentifier(repositoryPath[..slashIndex]);
            var repoName = repositoryPath[(slashIndex + 1)..].Trim().ToLowerInvariant();
            if (string.IsNullOrWhiteSpace(namespacePart) || string.IsNullOrWhiteSpace(repoName))
            {
                continue;
            }

            var owner = await _dbContext.Users
                .FirstOrDefaultAsync(u => u.Username == namespacePart, cancellationToken);
            if (owner is null)
            {
                continue;
            }

            var existing = await _dbContext.Repositories
                .FirstOrDefaultAsync(r => r.OwnerId == owner.Id && r.Name == repoName, cancellationToken);

            int repoId;
            if (existing is null)
            {
                var newRepo = new Repository
                {
                    Name = repoName,
                    Description = "Synced from Docker Registry push event.",
                    Visibility = "private",
                    OwnerId = owner.Id,
                    CreatedAt = now,
                    UpdatedAt = now,
                    IsOfficial = false,
                    StarCount = 0
                };
                _dbContext.Repositories.Add(newRepo);
                await _dbContext.SaveChangesAsync(cancellationToken);
                repoId = newRepo.Id;
            }
            else
            {
                existing.UpdatedAt = now;
                await _dbContext.SaveChangesAsync(cancellationToken);
                repoId = existing.Id;
            }

            var tagName = (ev.Target?.Tag ?? string.Empty).Trim();
            if (!string.IsNullOrWhiteSpace(tagName))
            {
                var tagExists = await _dbContext.RepositoryTags
                    .AnyAsync(t => t.RepositoryId == repoId && t.Name == tagName, cancellationToken);
                if (!tagExists)
                {
                    _dbContext.RepositoryTags.Add(new RepositoryTag
                    {
                        RepositoryId = repoId,
                        Name = tagName,
                        CreatedAt = now
                    });
                    await _dbContext.SaveChangesAsync(cancellationToken);
                }
            }
        }

        return Ok(new { message = "Registry events processed." });
    }

    // ============ Helper Methods ============

    private string? GetCurrentUsername()
    {
        // .NET 8+ uses JsonWebTokenHandler which does not remap JWT claim names,
        // so "name" stays as "name" rather than ClaimTypes.Name.
        return User.FindFirst(ClaimTypes.Name)?.Value
            ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Name)?.Value;
    }

    private bool IsCurrentUserAdmin()
    {
        var role = User.FindFirst(ClaimTypes.Role)?.Value;
        return string.Equals(role, UserModelRoleAdmin, StringComparison.OrdinalIgnoreCase);
    }

    private bool CanManageRepository(Repository repo)
    {
        var currentUsername = NormalizeIdentifier(GetCurrentUsername() ?? string.Empty);
        if (string.IsNullOrWhiteSpace(currentUsername))
        {
            return false;
        }

        var ownerUsername = NormalizeIdentifier(repo.Owner?.Username ?? string.Empty);
        return currentUsername == ownerUsername || IsCurrentUserAdmin();
    }

    private bool CanAccessPrivateRepository(Repository repo)
    {
        if (repo.Visibility != "private")
        {
            return true;
        }

        return CanManageRepository(repo);
    }

    private static (int Page, int PageSize) NormalizePaging(int page, int pageSize)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 20;
        if (pageSize > 100) pageSize = 100;
        return (page, pageSize);
    }

    private static string NormalizeIdentifier(string identifier)
    {
        return identifier.Trim().ToLowerInvariant();
    }

    private static IQueryable<Repository> ApplySorting(IQueryable<Repository> query, string? sortBy, string? sortDir)
    {
        var normalizedSortBy = (sortBy ?? "updatedAt").Trim().ToLowerInvariant();
        var descending = !string.Equals(sortDir, "asc", StringComparison.OrdinalIgnoreCase);

        return normalizedSortBy switch
        {
            "name" => descending
                ? query.OrderByDescending(r => r.Name).ThenByDescending(r => r.CreatedAt)
                : query.OrderBy(r => r.Name).ThenBy(r => r.CreatedAt),
            "createdat" => descending
                ? query.OrderByDescending(r => r.CreatedAt)
                : query.OrderBy(r => r.CreatedAt),
            "stars" => descending
                ? query.OrderByDescending(r => r.StarCount).ThenByDescending(r => r.UpdatedAt)
                : query.OrderBy(r => r.StarCount).ThenBy(r => r.UpdatedAt),
            _ => descending
                ? query.OrderByDescending(r => r.UpdatedAt)
                : query.OrderBy(r => r.UpdatedAt)
        };
    }

    private const string UserModelRoleAdmin = "Administrator";

    private static RepositoryResponse MapDbRepositoryToResponse(Repository repo)
    {
        var fullName = repo.IsOfficial ? repo.Name : $"{repo.Owner?.Username ?? "user"}/{repo.Name}";
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
            Tags = repo.Tags.Select(t => t.Name).ToList()
        };
    }

    private bool IsValidVisibility(string visibility)
    {
        return visibility == "public" || visibility == "private";
    }

    // ============ DTOs ============

    public sealed record CreateRepositoryRequest(
        [param: Required, MaxLength(100)] string Name,
        [param: MaxLength(500)] string? Description,
        [param: Required] string Visibility);

    public sealed record UpdateRepositoryRequest(
        [param: MaxLength(100)] string? Name,
        [param: MaxLength(500)] string? Description,
        string? Visibility);

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
        public List<string> Tags { get; set; } = new();
    }

    public sealed record RepositoryListResponse
    {
        public List<RepositoryResponse> Repositories { get; set; } = new();
        public int Total { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
    }

    public sealed record RegistryEventEnvelope(
        [property: JsonPropertyName("events")] List<RegistryEvent> Events);

    public sealed record RegistryEvent(
        [property: JsonPropertyName("action")] string? Action,
        [property: JsonPropertyName("target")] RegistryEventTarget? Target);

    public sealed record RegistryEventTarget(
        [property: JsonPropertyName("repository")] string? Repository,
        [property: JsonPropertyName("tag")] string? Tag,
        [property: JsonPropertyName("digest")] string? Digest);
}
