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
    private readonly AppDbContext _dbContext;
    private readonly HarborService _harborService;

    public RepositoriesController(AppDbContext dbContext, HarborService harborService)
    {
        _dbContext = dbContext;
        _harborService = harborService;
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
        var (currentUser, authError) = await RequireCurrentUserAsync(cancellationToken);
        if (authError != null)
            return authError;

        (page, pageSize) = NormalizePaging(page, pageSize);

        var projectName = !string.IsNullOrWhiteSpace(currentUser.Username)
            ? currentUser.Username
            : currentUser.Email.Split('@')[0];

        var harborRepositories = await _harborService.GetRepositoriesAsync(projectName, currentUser.Id, cancellationToken);
        if (!harborRepositories.Succeeded)
        {
            return StatusCode(StatusCodes.Status502BadGateway, new
            {
                message = harborRepositories.ErrorMessage ?? "Failed to get repositories from Harbor."
            });
        }

        var total = harborRepositories.Repositories.Count;
        var pageRepositories = harborRepositories.Repositories
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        var now = DateTime.UtcNow;
        var response = new RepositoryListResponse
        {
            Repositories = pageRepositories
                .Select(repo => MapHarborRepositoryToResponse(repo.FullName, "private", now, repo.UpdatedAt ?? now, repo.Description))
                .ToList(),
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
        var (currentUser, authError) = await RequireCurrentUserAsync(cancellationToken);
        if (authError != null)
            return authError;

        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { message = "Repository name is required." });

        if (request.Name.Length > 100)
            return BadRequest(new { message = "Repository name must not exceed 100 characters." });

        if (!IsValidVisibility(request.Visibility))
            return BadRequest(new { message = "Visibility must be 'public' or 'private'." });

        var projectName = !string.IsNullOrWhiteSpace(currentUser.Username)
            ? currentUser.Username
            : currentUser.Email.Split('@')[0];

        var harborRepositories = await _harborService.GetRepositoriesAsync(projectName, currentUser.Id, cancellationToken);
        if (harborRepositories.Succeeded && harborRepositories.Repositories.Any(repo => repo.Name.Equals(request.Name, StringComparison.OrdinalIgnoreCase)))
        {
            return Conflict(new { message = "Repository with this name already exists." });
        }

        var harborProvisioningResult = await _harborService
            .CreateRepositoryAsync(projectName, request.Name, request.Visibility == "public", currentUser.Id, cancellationToken);

        if (!harborProvisioningResult.Succeeded)
        {
            return StatusCode(StatusCodes.Status502BadGateway, new
            {
                message = harborProvisioningResult.ErrorMessage ?? "Failed to create repository in Harbor."
            });
        }

        var now = DateTime.UtcNow;
        var fullName = $"{projectName.ToLowerInvariant()}/{request.Name}";
        var responseRepository = MapHarborRepositoryToResponse(
            fullName,
            request.Visibility,
            now,
            now,
            request.Description ?? string.Empty);

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

    private async Task<User?> GetCurrentUserAsync(CancellationToken cancellationToken = default)
    {
        var userEmail = User.FindFirst(ClaimTypes.Email)?.Value;
        if (string.IsNullOrEmpty(userEmail))
            return null;

        return await _dbContext.Users.FirstOrDefaultAsync(u => u.Email == userEmail, cancellationToken);
    }

    private async Task<(User User, IActionResult? Error)> RequireCurrentUserAsync(CancellationToken cancellationToken)
    {
        var user = await GetCurrentUserAsync(cancellationToken);
        if (user == null)
        {
            return (null!, Unauthorized());
        }

        return (user, null);
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
