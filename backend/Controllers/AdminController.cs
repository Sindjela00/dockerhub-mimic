using System.ComponentModel.DataAnnotations;
using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = backend.Models.User.RoleSuperAdmin)]
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;

    public AdminController(IAdminService adminService)
    {
        _adminService = adminService;
    }

    [HttpPost("administrators")]
    public async Task<IActionResult> CreateAdministrator([FromBody] CreateAdministratorRequest request, CancellationToken cancellationToken)
    {
        var result = await _adminService.CreateAdministratorAsync(request.Username, request.Email, cancellationToken);
        if (!result.Succeeded)
        {
            return result.Message.Contains("already exists")
                ? Conflict(new { message = result.Message })
                : BadRequest(new { message = result.Message });
        }

        return Ok(new
        {
            message = result.Message,
            username = result.Username,
            email = result.Email,
            temporaryPassword = result.TemporaryPassword
        });
    }

    [HttpGet("administrators")]
    public async Task<IActionResult> ListAdministrators(CancellationToken cancellationToken)
    {
        var admins = await _adminService.ListAdministratorsAsync(cancellationToken);
        return Ok(admins);
    }

    public sealed record CreateAdministratorRequest(
        [param: Required] string Username,
        [param: Required, EmailAddress] string Email);
}
