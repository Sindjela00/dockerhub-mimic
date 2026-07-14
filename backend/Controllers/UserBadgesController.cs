using System.ComponentModel.DataAnnotations;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/admin/users")]
[Authorize(Roles = "Administrator,SuperAdmin")]
public class UserBadgesController : ControllerBase
{
    private readonly IAdminService _adminService;

    public UserBadgesController(IAdminService adminService)
    {
        _adminService = adminService;
    }

    [HttpGet]
    public async Task<IActionResult> SearchUsers(
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await _adminService.SearchUsersAsync(search, page, pageSize, cancellationToken);
        return Ok(new { users = result.Users, total = result.Total, page, pageSize });
    }

    [HttpPut("{id:int}/badges")]
    public async Task<IActionResult> SetUserBadge(int id, [FromBody] SetUserBadgeRequest request, CancellationToken cancellationToken)
    {
        var result = await _adminService.SetUserBadgeAsync(id, request.Badge, request.Value, cancellationToken);
        if (!result.Succeeded)
            return result.Message == "User not found." ? NotFound(new { message = result.Message }) : BadRequest(new { message = result.Message });

        return Ok(new { message = "User badge updated.", user = result.User });
    }

    public sealed record SetUserBadgeRequest(
        [param: Required] string Badge,
        [param: Required] bool Value);
}
