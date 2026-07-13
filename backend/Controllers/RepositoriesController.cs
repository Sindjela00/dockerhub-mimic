using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/repositories")]
public class RepositoriesController : ControllerBase
{
    private readonly IRepositoriesService _repositoriesService;

    public RepositoriesController(IRepositoriesService repositoriesService)
    {
        _repositoriesService = repositoriesService;
    }

    [HttpGet("stats")]
    [Authorize]
    public async Task<IActionResult> GetDashboardStats(CancellationToken cancellationToken = default)
    {
        var currentUsername = GetCurrentUsername();
        var result = await _repositoriesService.GetDashboardStatsAsync(currentUsername, cancellationToken);
        if (!result.Succeeded)
            return result.ErrorMessage == "Unauthorized" ? Unauthorized() : BadRequest(new { message = result.ErrorMessage });
        return Ok(result.Data);
    }

    [HttpGet("explore")]
    public async Task<IActionResult> ExploreRepositories(
        [FromQuery] string? search,
        [FromQuery] string? owner,
        [FromQuery] string? visibility,
        [FromQuery] int? minStars,
        [FromQuery] string? sortBy,
        [FromQuery] string? sortDir,
        [FromQuery] bool mine = false,
        [FromQuery] bool starred = false,
        [FromQuery] string? badges = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var currentUsername = GetCurrentUsername();
        var result = await _repositoriesService.ExploreRepositoriesAsync(
            search, owner, visibility, minStars, sortBy, sortDir, mine, starred, badges, page, pageSize, currentUsername, cancellationToken);
        if (!result.Succeeded)
            return result.ErrorMessage == "Unauthorized" ? Unauthorized() : BadRequest(new { message = result.ErrorMessage });
        return Ok(result.Data);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetRepository(int id, CancellationToken cancellationToken = default)
    {
        var currentUsername = GetCurrentUsername();
        var userRole = GetCurrentUserRole();
        var result = await _repositoriesService.GetRepositoryAsync(id, currentUsername, userRole, cancellationToken);
        if (!result.Succeeded)
            return result.ErrorMessage == "Repository not found." ? NotFound(new { message = result.ErrorMessage }) : Forbid();
        return Ok(result.Data);
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CreateRepository(
        [FromBody] CreateRepositoryRequest request,
        CancellationToken cancellationToken = default)
    {
        var username = GetCurrentUsername();
        var userRole = GetCurrentUserRole();
        if (string.IsNullOrEmpty(username))
            return Unauthorized();

        var result = await _repositoriesService.CreateRepositoryAsync(
            request.Name, request.Description, request.Visibility, request.IsOfficial, username, userRole, cancellationToken);
        if (!result.Succeeded)
            return result.ErrorMessage switch
            {
                "Repository with this name already exists." => Conflict(new { message = result.ErrorMessage }),
                "Only administrators can create official repositories." => Forbid(),
                _ => BadRequest(new { message = result.ErrorMessage })
            };
        return StatusCode(201, new { message = "Repository created successfully.", repository = result.Data });
    }

    [HttpPut("{id:int}")]
    [Authorize]
    public async Task<IActionResult> UpdateRepository(
        int id,
        [FromBody] UpdateRepositoryRequest request,
        CancellationToken cancellationToken = default)
    {
        var currentUsername = GetCurrentUsername();
        var userRole = GetCurrentUserRole();
        if (string.IsNullOrWhiteSpace(currentUsername))
            return Unauthorized();

        var result = await _repositoriesService.UpdateRepositoryAsync(id, request.Name, request.Description, request.Visibility, currentUsername, userRole, cancellationToken);
        if (!result.Succeeded)
            return result.ErrorMessage == "Repository not found." ? NotFound(new { message = result.ErrorMessage }) : result.ErrorMessage == "Forbidden" ? Forbid() : BadRequest(new { message = result.ErrorMessage });
        return Ok(new { message = "Repository updated successfully.", repository = result.Data });
    }

    [HttpDelete("{id:int}")]
    [Authorize]
    public async Task<IActionResult> DeleteRepository(int id, CancellationToken cancellationToken = default)
    {
        var currentUsername = GetCurrentUsername();
        var userRole = GetCurrentUserRole();
        var result = await _repositoriesService.DeleteRepositoryAsync(id, currentUsername, userRole, cancellationToken);
        if (!result.Succeeded)
            return result.ErrorMessage == "Repository not found." ? NotFound(new { message = result.ErrorMessage }) : Forbid();
        return NoContent();
    }

    [HttpGet("{id:int}/tags")]
    public async Task<IActionResult> GetRepositoryTags(
        int id,
        [FromQuery] string? search,
        [FromQuery] string? sortBy,
        [FromQuery] string? sortDir,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var currentUsername = GetCurrentUsername();
        var userRole = GetCurrentUserRole();
        var result = await _repositoriesService.GetRepositoryTagsAsync(id, search, sortBy, sortDir, page, pageSize, currentUsername, userRole, cancellationToken);
        if (!result.Succeeded)
            return result.ErrorMessage == "Repository not found." ? NotFound(new { message = result.ErrorMessage }) : Forbid();
        return Ok(result.Data);
    }

    [HttpDelete("{id:int}/tags/{tagName}")]
    [Authorize]
    public async Task<IActionResult> DeleteRepositoryTag(int id, string tagName, CancellationToken cancellationToken = default)
    {
        var currentUsername = GetCurrentUsername();
        var userRole = GetCurrentUserRole();
        var result = await _repositoriesService.DeleteRepositoryTagAsync(id, tagName, currentUsername, userRole, cancellationToken);
        if (!result.Succeeded)
            return result.ErrorMessage switch
            {
                "Repository not found." => NotFound(new { message = result.ErrorMessage }),
                "Forbidden" => Forbid(),
                "Tag not found." => NotFound(new { message = result.ErrorMessage }),
                _ => BadRequest(new { message = result.ErrorMessage })
            };
        return NoContent();
    }

    [HttpGet("{id:int}/collaborators")]
    public async Task<IActionResult> GetRepositoryCollaborators(int id, CancellationToken cancellationToken = default)
    {
        var currentUsername = GetCurrentUsername();
        var userRole = GetCurrentUserRole();
        var result = await _repositoriesService.GetRepositoryCollaboratorsAsync(id, currentUsername, userRole, cancellationToken);
        if (!result.Succeeded)
            return result.ErrorMessage == "Repository not found." ? NotFound(new { message = result.ErrorMessage }) : Forbid();
        return Ok(result.Data);
    }

    [HttpPost("{id:int}/collaborators")]
    [Authorize]
    public async Task<IActionResult> AddRepositoryCollaborator(
        int id,
        [FromBody] AddRepositoryCollaboratorRequest request,
        CancellationToken cancellationToken = default)
    {
        var currentUsername = GetCurrentUsername();
        var userRole = GetCurrentUserRole();
        var result = await _repositoriesService.AddRepositoryCollaboratorAsync(id, request.Identifier, request.Role, currentUsername, userRole, cancellationToken);
        if (!result.Succeeded)
            return result.ErrorMessage switch
            {
                "Repository not found." => NotFound(new { message = result.ErrorMessage }),
                "Forbidden" => Forbid(),
                "User not found." => NotFound(new { message = result.ErrorMessage }),
                _ => BadRequest(new { message = result.ErrorMessage })
            };
        return Ok(new { message = "Collaborator saved successfully.", collaborator = result.Data });
    }

    [HttpDelete("{id:int}/collaborators/{userId:int}")]
    [Authorize]
    public async Task<IActionResult> RemoveRepositoryCollaborator(
        int id,
        int userId,
        CancellationToken cancellationToken = default)
    {
        var currentUsername = GetCurrentUsername();
        var userRole = GetCurrentUserRole();
        var result = await _repositoriesService.RemoveRepositoryCollaboratorAsync(id, userId, currentUsername, userRole, cancellationToken);
        if (!result.Succeeded)
            return result.ErrorMessage switch
            {
                "Repository not found." => NotFound(new { message = result.ErrorMessage }),
                "Forbidden" => Forbid(),
                "Collaborator not found." => NotFound(new { message = result.ErrorMessage }),
                _ => BadRequest(new { message = result.ErrorMessage })
            };
        return NoContent();
    }

    [HttpPost("{id:int}/star")]
    [Authorize]
    public async Task<IActionResult> StarRepository(int id, CancellationToken cancellationToken = default)
    {
        var currentUsername = GetCurrentUsername();
        var result = await _repositoriesService.StarRepositoryAsync(id, currentUsername, cancellationToken);
        if (!result.Succeeded)
            return result.ErrorMessage switch
            {
                "Repository not found." => NotFound(new { message = result.ErrorMessage }),
                "Repository already starred." => Conflict(new { message = result.ErrorMessage }),
                _ => BadRequest(new { message = result.ErrorMessage })
            };
        return Ok(new { message = "Repository starred successfully.", repository = result.Data });
    }

    [HttpDelete("{id:int}/star")]
    [Authorize]
    public async Task<IActionResult> UnstarRepository(int id, CancellationToken cancellationToken = default)
    {
        var currentUsername = GetCurrentUsername();
        var result = await _repositoriesService.UnstarRepositoryAsync(id, currentUsername, cancellationToken);
        if (!result.Succeeded)
            return result.ErrorMessage switch
            {
                "Repository not found." => NotFound(new { message = result.ErrorMessage }),
                "Repository not starred." => NotFound(new { message = result.ErrorMessage }),
                _ => BadRequest(new { message = result.ErrorMessage })
            };
        return Ok(new { message = "Repository unstarred successfully.", repository = result.Data });
    }

    [HttpGet("{id:int}/teams")]
    [Authorize]
    public async Task<IActionResult> GetRepositoryTeams(int id, CancellationToken cancellationToken = default)
    {
        var currentUsername = GetCurrentUsername();
        var userRole = GetCurrentUserRole();
        var result = await _repositoriesService.GetRepositoryTeamsAsync(id, currentUsername, userRole, cancellationToken);
        if (!result.Succeeded)
            return result.ErrorMessage switch
            {
                "Repository not found." => NotFound(new { message = result.ErrorMessage }),
                "Forbidden" => Forbid(),
                _ => BadRequest(new { message = result.ErrorMessage })
            };
        return Ok(result.Data);
    }

    [HttpPost("{id:int}/teams")]
    [Authorize]
    public async Task<IActionResult> SetRepositoryTeamPermission(
        int id,
        [FromBody] SetRepositoryTeamPermissionRequest request,
        CancellationToken cancellationToken = default)
    {
        var currentUsername = GetCurrentUsername();
        var userRole = GetCurrentUserRole();
        var result = await _repositoriesService.SetRepositoryTeamPermissionAsync(id, request.TeamId, request.Permission, currentUsername, userRole, cancellationToken);
        if (!result.Succeeded)
            return result.ErrorMessage switch
            {
                "Repository not found." => NotFound(new { message = result.ErrorMessage }),
                "Team not found in this organization." => NotFound(new { message = result.ErrorMessage }),
                "Forbidden" => Forbid(),
                _ => BadRequest(new { message = result.ErrorMessage })
            };
        return Ok(new { message = "Team permission updated.", teamAccess = result.Data });
    }

    private string? GetCurrentUsername()
    {
        return User.FindFirst(ClaimTypes.Name)?.Value ?? User.FindFirst(JwtRegisteredClaimNames.Name)?.Value;
    }

    private string? GetCurrentUserRole()
    {
        return User.FindFirst(ClaimTypes.Role)?.Value;
    }

    public sealed record CreateRepositoryRequest(
        [param: Required, MaxLength(100)] string Name,
        [param: MaxLength(500)] string? Description,
        [param: Required] string Visibility,
        bool IsOfficial = false);

    public sealed record UpdateRepositoryRequest(
        [param: MaxLength(100)] string? Name,
        [param: MaxLength(500)] string? Description,
        string? Visibility);

    public sealed record AddRepositoryCollaboratorRequest(
        [param: Required] string Identifier,
        string? Role);

    public sealed record SetRepositoryTeamPermissionRequest(
        [param: Required] int TeamId,
        [param: Required] string Permission);
}
