using System.ComponentModel.DataAnnotations;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/organizations")]
public class OrganizationsController : ControllerBase
{
    private readonly IOrganizationsService _organizationsService;

    public OrganizationsController(IOrganizationsService organizationsService)
    {
        _organizationsService = organizationsService;
    }

    [HttpGet]
    public async Task<IActionResult> ExploreOrganizations(
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var currentUsername = GetCurrentUsername();
        var result = await _organizationsService.ExploreOrganizationsAsync(search, page, pageSize, currentUsername, cancellationToken);
        if (!result.Succeeded)
            return BadRequest(new { message = result.ErrorMessage });
        return Ok(result.Data);
    }

    [HttpGet("{name}")]
    public async Task<IActionResult> GetOrganization(string name, CancellationToken cancellationToken = default)
    {
        var currentUsername = GetCurrentUsername();
        var result = await _organizationsService.GetOrganizationAsync(name, currentUsername, cancellationToken);
        if (!result.Succeeded)
            return NotFound(new { message = result.ErrorMessage });
        return Ok(result.Data);
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CreateOrganization([FromBody] CreateOrganizationRequest request, CancellationToken cancellationToken = default)
    {
        var currentUsername = GetCurrentUsername();
        var result = await _organizationsService.CreateOrganizationAsync(request.Name, request.DisplayName, request.Description, request.AvatarUrl, currentUsername, cancellationToken);
        if (!result.Succeeded)
            return result.ErrorMessage switch
            {
                "Unauthorized" => Unauthorized(),
                "Organization with this name already exists." => Conflict(new { message = result.ErrorMessage }),
                _ => BadRequest(new { message = result.ErrorMessage })
            };

        return StatusCode(201, new { message = "Organization created successfully.", organization = result.Data });
    }

    [HttpPut("{name}")]
    [Authorize]
    public async Task<IActionResult> UpdateOrganization(string name, [FromBody] UpdateOrganizationRequest request, CancellationToken cancellationToken = default)
    {
        var currentUsername = GetCurrentUsername();
        var userRole = GetCurrentUserRole();
        var result = await _organizationsService.UpdateOrganizationAsync(name, request.DisplayName, request.Description, request.AvatarUrl, currentUsername, userRole, cancellationToken);
        if (!result.Succeeded)
            return result.ErrorMessage switch
            {
                "Organization not found." => NotFound(new { message = result.ErrorMessage }),
                "Forbidden" => Forbid(),
                _ => BadRequest(new { message = result.ErrorMessage })
            };

        return Ok(new { message = "Organization updated successfully.", organization = result.Data });
    }

    [HttpPost("{name}/avatar")]
    [Authorize]
    [RequestSizeLimit(5 * 1024 * 1024)]
    public async Task<IActionResult> UploadOrganizationAvatar(string name, IFormFile? file, CancellationToken cancellationToken = default)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { message = "An image file is required." });

        var currentUsername = GetCurrentUsername();
        var userRole = GetCurrentUserRole();

        await using var stream = file.OpenReadStream();
        var result = await _organizationsService.UploadOrganizationAvatarAsync(
            name, stream, file.ContentType, file.Length, currentUsername, userRole, cancellationToken);

        if (!result.Succeeded)
            return result.ErrorMessage switch
            {
                "Organization not found." => NotFound(new { message = result.ErrorMessage }),
                "Forbidden" => Forbid(),
                _ => BadRequest(new { message = result.ErrorMessage })
            };

        return Ok(new { message = "Avatar uploaded successfully.", organization = result.Data });
    }

    [HttpDelete("{name}")]
    [Authorize]
    public async Task<IActionResult> DeleteOrganization(string name, CancellationToken cancellationToken = default)
    {
        var currentUsername = GetCurrentUsername();
        var userRole = GetCurrentUserRole();
        var result = await _organizationsService.DeleteOrganizationAsync(name, currentUsername, userRole, cancellationToken);
        if (!result.Succeeded)
            return result.ErrorMessage switch
            {
                "Organization not found." => NotFound(new { message = result.ErrorMessage }),
                "Forbidden" => Forbid(),
                _ => BadRequest(new { message = result.ErrorMessage })
            };

        return NoContent();
    }

    [HttpGet("{name}/members")]
    [Authorize]
    public async Task<IActionResult> GetOrganizationMembers(string name, CancellationToken cancellationToken = default)
    {
        var currentUsername = GetCurrentUsername();
        var userRole = GetCurrentUserRole();
        var result = await _organizationsService.GetOrganizationMembersAsync(name, currentUsername, userRole, cancellationToken);
        if (!result.Succeeded)
            return result.ErrorMessage switch
            {
                "Organization not found." => NotFound(new { message = result.ErrorMessage }),
                "Forbidden" => Forbid(),
                _ => BadRequest(new { message = result.ErrorMessage })
            };

        return Ok(result.Data);
    }

    [HttpPost("{name}/members")]
    [Authorize]
    public async Task<IActionResult> AddOrganizationMember(string name, [FromBody] AddOrganizationMemberRequest request, CancellationToken cancellationToken = default)
    {
        var currentUsername = GetCurrentUsername();
        var userRole = GetCurrentUserRole();
        var result = await _organizationsService.AddOrganizationMemberAsync(name, request.Identifier, request.Role, currentUsername, userRole, cancellationToken);
        if (!result.Succeeded)
            return result.ErrorMessage switch
            {
                "Organization not found." => NotFound(new { message = result.ErrorMessage }),
                "Forbidden" => Forbid(),
                "User not found." => NotFound(new { message = result.ErrorMessage }),
                _ => BadRequest(new { message = result.ErrorMessage })
            };

        return Ok(new { message = "Organization member saved successfully.", member = result.Data });
    }

    [HttpDelete("{name}/members/{userId:int}")]
    [Authorize]
    public async Task<IActionResult> RemoveOrganizationMember(string name, int userId, CancellationToken cancellationToken = default)
    {
        var currentUsername = GetCurrentUsername();
        var userRole = GetCurrentUserRole();
        var result = await _organizationsService.RemoveOrganizationMemberAsync(name, userId, currentUsername, userRole, cancellationToken);
        if (!result.Succeeded)
            return result.ErrorMessage switch
            {
                "Organization not found." => NotFound(new { message = result.ErrorMessage }),
                "Forbidden" => Forbid(),
                "Member not found." => NotFound(new { message = result.ErrorMessage }),
                _ => BadRequest(new { message = result.ErrorMessage })
            };

        return NoContent();
    }

    // ---- Invite endpoints ----

    [HttpPost("invites/accept")]
    [Authorize]
    public async Task<IActionResult> AcceptOrganizationInvite([FromBody] AcceptOrganizationInviteRequest request, CancellationToken cancellationToken = default)
    {
        var currentUsername = GetCurrentUsername();
        var result = await _organizationsService.AcceptOrganizationInviteAsync(request.Token, currentUsername, cancellationToken);
        if (!result.Succeeded)
            return result.ErrorMessage switch
            {
                "Forbidden" => Forbid(),
                "Invite not found or already used." or "Invite has expired." => NotFound(new { message = result.ErrorMessage }),
                _ => BadRequest(new { message = result.ErrorMessage })
            };
        return Ok(new { message = "Joined organization successfully.", member = result.Data });
    }

    [HttpPost("{name}/invites")]
    [Authorize]
    public async Task<IActionResult> SendOrganizationInvite(string name, [FromBody] SendOrganizationInviteRequest request, CancellationToken cancellationToken = default)
    {
        var currentUsername = GetCurrentUsername();
        var userRole = GetCurrentUserRole();
        var result = await _organizationsService.SendOrganizationInviteAsync(name, request.Email, request.Role, currentUsername, userRole, cancellationToken);
        if (!result.Succeeded)
            return result.ErrorMessage switch
            {
                "Organization not found." => NotFound(new { message = result.ErrorMessage }),
                "Forbidden" => Forbid(),
                _ => BadRequest(new { message = result.ErrorMessage })
            };
        return Ok(new { message = "Invitation sent.", invite = result.Data });
    }

    [HttpGet("{name}/invites")]
    [Authorize]
    public async Task<IActionResult> GetOrganizationInvites(string name, CancellationToken cancellationToken = default)
    {
        var currentUsername = GetCurrentUsername();
        var userRole = GetCurrentUserRole();
        var result = await _organizationsService.GetOrganizationInvitesAsync(name, currentUsername, userRole, cancellationToken);
        if (!result.Succeeded)
            return result.ErrorMessage switch
            {
                "Organization not found." => NotFound(new { message = result.ErrorMessage }),
                "Forbidden" => Forbid(),
                _ => BadRequest(new { message = result.ErrorMessage })
            };
        return Ok(result.Data);
    }

    [HttpDelete("{name}/invites/{inviteId:int}")]
    [Authorize]
    public async Task<IActionResult> CancelOrganizationInvite(string name, int inviteId, CancellationToken cancellationToken = default)
    {
        var currentUsername = GetCurrentUsername();
        var userRole = GetCurrentUserRole();
        var result = await _organizationsService.CancelOrganizationInviteAsync(name, inviteId, currentUsername, userRole, cancellationToken);
        if (!result.Succeeded)
            return result.ErrorMessage switch
            {
                "Organization not found." or "Invite not found." => NotFound(new { message = result.ErrorMessage }),
                "Forbidden" => Forbid(),
                _ => BadRequest(new { message = result.ErrorMessage })
            };
        return NoContent();
    }

    [HttpGet("{name}/repositories")]
    public async Task<IActionResult> GetOrganizationRepositories(
        string name,
        [FromQuery] string? search,
        [FromQuery] string? visibility,
        [FromQuery] int? minStars,
        [FromQuery] string? sortBy,
        [FromQuery] string? sortDir,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var currentUsername = GetCurrentUsername();
        var userRole = GetCurrentUserRole();
        var result = await _organizationsService.GetOrganizationRepositoriesAsync(
            name, search, visibility, minStars, sortBy, sortDir, page, pageSize, currentUsername, userRole, cancellationToken);

        if (!result.Succeeded)
            return result.ErrorMessage switch
            {
                "Organization not found." => NotFound(new { message = result.ErrorMessage }),
                _ => BadRequest(new { message = result.ErrorMessage })
            };

        return Ok(result.Data);
    }

    [HttpPost("{name}/repositories")]
    [Authorize]
    public async Task<IActionResult> CreateOrganizationRepository(
        string name,
        [FromBody] CreateOrganizationRepositoryRequest request,
        CancellationToken cancellationToken = default)
    {
        var currentUsername = GetCurrentUsername();
        var userRole = GetCurrentUserRole();
        var result = await _organizationsService.CreateOrganizationRepositoryAsync(
            name, request.Name, request.Description, request.Visibility, currentUsername, userRole, cancellationToken);

        if (!result.Succeeded)
            return result.ErrorMessage switch
            {
                "Organization not found." => NotFound(new { message = result.ErrorMessage }),
                "Forbidden" => Forbid(),
                "Repository with this name already exists in the organization." => Conflict(new { message = result.ErrorMessage }),
                _ => BadRequest(new { message = result.ErrorMessage })
            };

        return StatusCode(201, new { message = "Organization repository created successfully.", repository = result.Data });
    }

    private string? GetCurrentUsername()
    {
        return User.FindFirst(ClaimTypes.Name)?.Value ?? User.FindFirst(JwtRegisteredClaimNames.Name)?.Value;
    }

    private string? GetCurrentUserRole()
    {
        return User.FindFirst(ClaimTypes.Role)?.Value;
    }

    public sealed record CreateOrganizationRequest(
        [param: Required, MaxLength(64)] string Name,
        [param: MaxLength(128)] string? DisplayName,
        [param: MaxLength(500)] string? Description,
        [param: MaxLength(500)] string? AvatarUrl);

    public sealed record UpdateOrganizationRequest(
        [param: MaxLength(128)] string? DisplayName,
        [param: MaxLength(500)] string? Description,
        [param: MaxLength(500)] string? AvatarUrl);

    public sealed record AddOrganizationMemberRequest(
        [param: Required] string Identifier,
        string? Role);

    public sealed record CreateOrganizationRepositoryRequest(
        [param: Required, MaxLength(100)] string Name,
        [param: MaxLength(500)] string? Description,
        [param: Required] string Visibility);

    // ---- Teams endpoints ----

    [HttpGet("{name}/teams")]
    [Authorize]
    public async Task<IActionResult> GetOrganizationTeams(string name, CancellationToken cancellationToken = default)
    {
        var currentUsername = GetCurrentUsername();
        var userRole = GetCurrentUserRole();
        var result = await _organizationsService.GetOrganizationTeamsAsync(name, currentUsername, userRole, cancellationToken);
        if (!result.Succeeded)
            return result.ErrorMessage switch
            {
                "Organization not found." => NotFound(new { message = result.ErrorMessage }),
                "Forbidden" => Forbid(),
                _ => BadRequest(new { message = result.ErrorMessage })
            };
        return Ok(result.Data);
    }

    [HttpGet("{name}/teams/{teamName}")]
    [Authorize]
    public async Task<IActionResult> GetOrganizationTeam(string name, string teamName, CancellationToken cancellationToken = default)
    {
        var currentUsername = GetCurrentUsername();
        var userRole = GetCurrentUserRole();
        var result = await _organizationsService.GetOrganizationTeamAsync(name, teamName, currentUsername, userRole, cancellationToken);
        if (!result.Succeeded)
            return result.ErrorMessage switch
            {
                "Organization not found." or "Team not found." => NotFound(new { message = result.ErrorMessage }),
                "Forbidden" => Forbid(),
                _ => BadRequest(new { message = result.ErrorMessage })
            };
        return Ok(result.Data);
    }

    [HttpPost("{name}/teams")]
    [Authorize]
    public async Task<IActionResult> CreateOrganizationTeam(string name, [FromBody] CreateOrganizationTeamRequest request, CancellationToken cancellationToken = default)
    {
        var currentUsername = GetCurrentUsername();
        var userRole = GetCurrentUserRole();
        var result = await _organizationsService.CreateOrganizationTeamAsync(name, request.Name, request.Description, currentUsername, userRole, cancellationToken);
        if (!result.Succeeded)
            return result.ErrorMessage switch
            {
                "Organization not found." => NotFound(new { message = result.ErrorMessage }),
                "Forbidden" => Forbid(),
                "Team with this name already exists in the organization." => Conflict(new { message = result.ErrorMessage }),
                _ => BadRequest(new { message = result.ErrorMessage })
            };
        return StatusCode(201, new { message = "Team created successfully.", team = result.Data });
    }

    [HttpPut("{name}/teams/{teamName}")]
    [Authorize]
    public async Task<IActionResult> UpdateOrganizationTeam(string name, string teamName, [FromBody] UpdateOrganizationTeamRequest request, CancellationToken cancellationToken = default)
    {
        var currentUsername = GetCurrentUsername();
        var userRole = GetCurrentUserRole();
        var result = await _organizationsService.UpdateOrganizationTeamAsync(name, teamName, request.Name, request.Description, currentUsername, userRole, cancellationToken);
        if (!result.Succeeded)
            return result.ErrorMessage switch
            {
                "Organization not found." or "Team not found." => NotFound(new { message = result.ErrorMessage }),
                "Forbidden" => Forbid(),
                _ => BadRequest(new { message = result.ErrorMessage })
            };
        return Ok(new { message = "Team updated successfully.", team = result.Data });
    }

    [HttpDelete("{name}/teams/{teamName}")]
    [Authorize]
    public async Task<IActionResult> DeleteOrganizationTeam(string name, string teamName, CancellationToken cancellationToken = default)
    {
        var currentUsername = GetCurrentUsername();
        var userRole = GetCurrentUserRole();
        var result = await _organizationsService.DeleteOrganizationTeamAsync(name, teamName, currentUsername, userRole, cancellationToken);
        if (!result.Succeeded)
            return result.ErrorMessage switch
            {
                "Organization not found." or "Team not found." => NotFound(new { message = result.ErrorMessage }),
                "Forbidden" => Forbid(),
                _ => BadRequest(new { message = result.ErrorMessage })
            };
        return NoContent();
    }

    [HttpGet("{name}/teams/{teamName}/members")]
    [Authorize]
    public async Task<IActionResult> GetOrganizationTeamMembers(string name, string teamName, CancellationToken cancellationToken = default)
    {
        var currentUsername = GetCurrentUsername();
        var userRole = GetCurrentUserRole();
        var result = await _organizationsService.GetOrganizationTeamMembersAsync(name, teamName, currentUsername, userRole, cancellationToken);
        if (!result.Succeeded)
            return result.ErrorMessage switch
            {
                "Organization not found." or "Team not found." => NotFound(new { message = result.ErrorMessage }),
                "Forbidden" => Forbid(),
                _ => BadRequest(new { message = result.ErrorMessage })
            };
        return Ok(result.Data);
    }

    [HttpPost("{name}/teams/{teamName}/members")]
    [Authorize]
    public async Task<IActionResult> AddOrganizationTeamMember(string name, string teamName, [FromBody] AddOrganizationTeamMemberRequest request, CancellationToken cancellationToken = default)
    {
        var currentUsername = GetCurrentUsername();
        var userRole = GetCurrentUserRole();
        var result = await _organizationsService.AddOrganizationTeamMemberAsync(name, teamName, request.UserId, currentUsername, userRole, cancellationToken);
        if (!result.Succeeded)
            return result.ErrorMessage switch
            {
                "Organization not found." or "Team not found." or "User not found." => NotFound(new { message = result.ErrorMessage }),
                "Forbidden" => Forbid(),
                _ => BadRequest(new { message = result.ErrorMessage })
            };
        return Ok(new { message = "Team member added successfully.", member = result.Data });
    }

    [HttpDelete("{name}/teams/{teamName}/members/{userId:int}")]
    [Authorize]
    public async Task<IActionResult> RemoveOrganizationTeamMember(string name, string teamName, int userId, CancellationToken cancellationToken = default)
    {
        var currentUsername = GetCurrentUsername();
        var userRole = GetCurrentUserRole();
        var result = await _organizationsService.RemoveOrganizationTeamMemberAsync(name, teamName, userId, currentUsername, userRole, cancellationToken);
        if (!result.Succeeded)
            return result.ErrorMessage switch
            {
                "Organization not found." or "Team not found." or "Team member not found." => NotFound(new { message = result.ErrorMessage }),
                "Forbidden" => Forbid(),
                _ => BadRequest(new { message = result.ErrorMessage })
            };
        return NoContent();
    }

    [HttpGet("{name}/teams/{teamName}/repositories")]
    [Authorize]
    public async Task<IActionResult> GetOrganizationTeamRepositories(string name, string teamName, CancellationToken cancellationToken = default)
    {
        var currentUsername = GetCurrentUsername();
        var userRole = GetCurrentUserRole();
        var result = await _organizationsService.GetOrganizationTeamRepositoriesAsync(name, teamName, currentUsername, userRole, cancellationToken);
        if (!result.Succeeded)
            return result.ErrorMessage switch
            {
                "Organization not found." or "Team not found." => NotFound(new { message = result.ErrorMessage }),
                "Forbidden" => Forbid(),
                _ => BadRequest(new { message = result.ErrorMessage })
            };
        return Ok(result.Data);
    }

    [HttpPost("{name}/teams/{teamName}/repositories")]
    [Authorize]
    public async Task<IActionResult> SetOrganizationTeamRepository(string name, string teamName, [FromBody] SetOrganizationTeamRepositoryRequest request, CancellationToken cancellationToken = default)
    {
        var currentUsername = GetCurrentUsername();
        var userRole = GetCurrentUserRole();
        var result = await _organizationsService.SetOrganizationTeamRepositoryAsync(name, teamName, request.RepositoryId, request.Permission, currentUsername, userRole, cancellationToken);
        if (!result.Succeeded)
            return result.ErrorMessage switch
            {
                "Organization not found." or "Team not found." or "Repository not found in this organization." => NotFound(new { message = result.ErrorMessage }),
                "Forbidden" => Forbid(),
                _ => BadRequest(new { message = result.ErrorMessage })
            };
        return Ok(new { message = "Team repository permissions set successfully.", teamRepository = result.Data });
    }

    [HttpDelete("{name}/teams/{teamName}/repositories/{repositoryId:int}")]
    [Authorize]
    public async Task<IActionResult> RemoveOrganizationTeamRepository(string name, string teamName, int repositoryId, CancellationToken cancellationToken = default)
    {
        var currentUsername = GetCurrentUsername();
        var userRole = GetCurrentUserRole();
        var result = await _organizationsService.RemoveOrganizationTeamRepositoryAsync(name, teamName, repositoryId, currentUsername, userRole, cancellationToken);
        if (!result.Succeeded)
            return result.ErrorMessage switch
            {
                "Organization not found." or "Team not found." or "Repository not assigned to this team." => NotFound(new { message = result.ErrorMessage }),
                "Forbidden" => Forbid(),
                _ => BadRequest(new { message = result.ErrorMessage })
            };
        return NoContent();
    }

    public sealed record CreateOrganizationTeamRequest(
        [param: Required, MaxLength(64)] string Name,
        [param: MaxLength(500)] string? Description);

    public sealed record UpdateOrganizationTeamRequest(
        [param: MaxLength(64)] string? Name,
        [param: MaxLength(500)] string? Description);

    public sealed record AddOrganizationTeamMemberRequest(
        [param: Required] int UserId);

    public sealed record SetOrganizationTeamRepositoryRequest(
        [param: Required] int RepositoryId,
        [param: Required] string Permission);

    public sealed record SendOrganizationInviteRequest(
        [param: Required, EmailAddress, MaxLength(256)] string Email,
        [param: MaxLength(32)] string? Role);

    public sealed record AcceptOrganizationInviteRequest(
        [param: Required] string Token);
}