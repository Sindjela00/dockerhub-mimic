using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using backend.Data;
using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace backend.Controllers;

[ApiController]
[Route("api/repositories")]
public class RepositoriesController : ControllerBase
{
    private readonly HarborService _harborService;
    private readonly AppDbContext _dbContext;

    public RepositoriesController(HarborService harborService, AppDbContext dbContext)
    {
        _harborService = harborService;
        _dbContext = dbContext;
    }

    // ============ Endpoints ============

    /// <summary>
    /// Get all public repositories with optional search and pagination
    /// </summary>
    [HttpGet("explore")]
    public async Task<IActionResult> GetPublicRepositories(
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        (page, pageSize) = NormalizePaging(page, pageSize);

        var catalog = await _harborService.GetCatalogAsync(cancellationToken);
        var filteredRepositories = catalog
            .Where(name => string.IsNullOrWhiteSpace(search) || name.Contains(search, StringComparison.OrdinalIgnoreCase))
            .OrderBy(name => name)
            .ToList();

        var total = filteredRepositories.Count;
        var pageRepositories = filteredRepositories
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        var now = DateTime.UtcNow;
        var response = new RepositoryListResponse
        {
            Repositories = pageRepositories
                .Select(fullName => MapHarborRepositoryToResponse(fullName, "public", now, now, string.Empty))
                .ToList(),
            Total = total,
            Page = page,
            PageSize = pageSize
        };

        return Ok(response);
    }

    /// <summary>
    /// Get user's own repositories
    /// </summary>
    [HttpGet("my")]
    [Authorize]
    public async Task<IActionResult> GetMyRepositories(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var username = GetCurrentUsername();
        if (string.IsNullOrEmpty(username))
            return Unauthorized();

        // Fetch from DB (source of truth for visibility/description)
        var dbRepos = await _dbContext.Repositories
            .Include(r => r.Owner)
            .Where(r => r.Owner!.Username == username)
            .OrderByDescending(r => r.UpdatedAt)
            .ToListAsync(cancellationToken);

        // Fetch from Harbor (best-effort; repos pushed directly won't be in DB)
        var harborResult = await _harborService.GetRepositoriesAsync(username, cancellationToken: cancellationToken);
        var harborRepos = harborResult.Succeeded
            ? harborResult.Repositories
            : (IReadOnlyList<HarborRepositoryInfo>)Array.Empty<HarborRepositoryInfo>();

        var harborByName = harborRepos
            .ToDictionary(r => r.Name.ToLowerInvariant(), r => r, StringComparer.OrdinalIgnoreCase);

        var dbRepoNames = new HashSet<string>(dbRepos.Select(r => r.Name.ToLowerInvariant()));

        // DB repos enriched with Harbor metadata
        var now = DateTime.UtcNow;
        var merged = dbRepos
            .Select(r =>
            {
                harborByName.TryGetValue(r.Name.ToLowerInvariant(), out var hr);
                return MapDbRepositoryToResponse(r, hr);
            })
            .ToList();

        // Harbor-only repos (pushed directly, not created via our API)
        foreach (var hr in harborRepos)
        {
            if (!dbRepoNames.Contains(hr.Name.ToLowerInvariant()))
                merged.Add(MapHarborRepositoryToResponse(hr.FullName, "private", hr.UpdatedAt ?? now, hr.UpdatedAt ?? now, hr.Description));
        }

        var total = merged.Count;
        (page, pageSize) = NormalizePaging(page, pageSize);

        var response = new RepositoryListResponse
        {
            Repositories = merged.Skip((page - 1) * pageSize).Take(pageSize).ToList(),
            Total = total,
            Page = page,
            PageSize = pageSize
        };

        return Ok(response);
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
        var responseRepository = MapDbRepositoryToResponse(repo, null);
        return Ok(new { message = "Repository created successfully.", repository = responseRepository });
    }

    /// <summary>
    /// Reads all tags for a repository from the self-hosted container registry.
    /// </summary>
    [HttpGet("tags/{*repositoryName}")]
    [Authorize]
    public async Task<IActionResult> GetRegistryTags(string repositoryName, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(repositoryName))
        {
            return BadRequest(new { message = "Repository name is required." });
        }

        return await ExecuteRegistryCallAsync(async () =>
        {
            var tags = await _harborService.GetTagsAsync(repositoryName, cancellationToken);
            return Ok(new RegistryTagsResponse(repositoryName, tags));
        });
    }

    /// <summary>
    /// Reads a manifest by tag or digest from the self-hosted container registry.
    /// </summary>
    [HttpGet("manifests/{*repositoryName}")]
    [Authorize]
    public async Task<IActionResult> GetRegistryManifest(string repositoryName, [FromQuery] string reference, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(repositoryName) || string.IsNullOrWhiteSpace(reference))
        {
            return BadRequest(new { message = "Repository name and reference are required." });
        }

        return await ExecuteRegistryCallAsync(async () =>
        {
            var manifest = await _harborService.GetManifestAsync(repositoryName, reference, cancellationToken);
            return Ok(new { repository = repositoryName, reference, manifest });
        });
    }

    // ============ Helper Methods ============

    private string? GetCurrentUsername()
    {
        // .NET 8+ uses JsonWebTokenHandler which does not remap JWT claim names,
        // so "name" stays as "name" rather than ClaimTypes.Name.
        return User.FindFirst(ClaimTypes.Name)?.Value
            ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Name)?.Value;
    }

    private static (int Page, int PageSize) NormalizePaging(int page, int pageSize)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 20;
        if (pageSize > 100) pageSize = 100;
        return (page, pageSize);
    }

    private async Task<IActionResult> ExecuteRegistryCallAsync(Func<Task<IActionResult>> action)
    {
        try
        {
            return await action();
        }
        catch (HttpRequestException ex)
        {
            return StatusCode(502, new { message = "Container registry is unavailable.", detail = ex.Message });
        }
    }

    private static RepositoryResponse MapDbRepositoryToResponse(Repository repo, HarborRepositoryInfo? harborRepo)
    {
        var fullName = repo.IsOfficial ? repo.Name : $"{repo.Owner?.Username ?? "user"}/{repo.Name}";
        return new RepositoryResponse
        {
            Id = repo.Id,
            Name = repo.Name,
            FullName = harborRepo?.FullName ?? fullName,
            Description = !string.IsNullOrWhiteSpace(repo.Description) ? repo.Description : (harborRepo?.Description ?? string.Empty),
            Visibility = repo.Visibility,
            OwnerEmail = repo.Owner?.Email ?? string.Empty,
            CreatedAt = repo.CreatedAt,
            UpdatedAt = harborRepo?.UpdatedAt ?? repo.UpdatedAt,
            IsOfficial = repo.IsOfficial,
            StarCount = repo.StarCount,
            Tags = new List<string>()
        };
    }

    private static RepositoryResponse MapHarborRepositoryToResponse(
        string fullName,
        string visibility,
        DateTime createdAt,
        DateTime updatedAt,
        string description)
    {
        var ownerAndName = fullName.Split('/');
        var repositoryName = ownerAndName.Length > 1 ? ownerAndName[^1] : fullName;

        return new RepositoryResponse
        {
            Id = 0,
            Name = repositoryName,
            FullName = fullName,
            Description = description,
            Visibility = visibility,
            OwnerEmail = string.Empty,
            CreatedAt = createdAt,
            UpdatedAt = updatedAt,
            IsOfficial = false,
            StarCount = 0,
            Tags = new List<string>()
        };
    }

    private bool IsValidVisibility(string visibility)
    {
        return visibility == "public" || visibility == "private";
    }

    // ============ DTOs ============

    public sealed record CreateRepositoryRequest(
        [param: Required, MaxLength(100)] string Name,
        [param: MaxLength(500)] string Description,
        [param: Required] string Visibility);

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

    public sealed record RegistryTagsResponse(string Repository, IReadOnlyList<string> Tags);

}
