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
        var currentUsername = GetCurrentUsername();
        var result = await _repositoriesService.ExploreRepositoriesAsync(
            search, owner, visibility, minStars, sortBy, sortDir, mine, page, pageSize, currentUsername, cancellationToken);
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
        if (string.IsNullOrEmpty(username))
            return Unauthorized();

        var result = await _repositoriesService.CreateRepositoryAsync(request.Name, request.Description, request.Visibility, username, cancellationToken);
        if (!result.Succeeded)
            return result.ErrorMessage == "Repository with this name already exists."
                ? Conflict(new { message = result.ErrorMessage })
                : BadRequest(new { message = result.ErrorMessage });
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
        [FromQuery] string? sortBy,
        [FromQuery] string? sortDir,
        CancellationToken cancellationToken = default)
    {
        var currentUsername = GetCurrentUsername();
        var userRole = GetCurrentUserRole();
        var result = await _repositoriesService.GetRepositoryTagsAsync(id, sortBy, sortDir, currentUsername, userRole, cancellationToken);
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
        [param: Required] string Visibility);

    public sealed record UpdateRepositoryRequest(
        [param: MaxLength(100)] string? Name,
        [param: MaxLength(500)] string? Description,
        string? Visibility);

    public sealed record AddRepositoryCollaboratorRequest(
        [param: Required] string Identifier,
        string? Role);
}
