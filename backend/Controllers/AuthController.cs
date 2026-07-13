using System.ComponentModel.DataAnnotations;
using backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request, CancellationToken cancellationToken)
    {
        var result = await _authService.RegisterAsync(request.Username, request.Email, request.Password, cancellationToken);
        if (!result.Succeeded)
        {
            return result.Message.Contains("already exists")
                ? Conflict(new { message = result.Message })
                : BadRequest(new { message = result.Message });
        }
        return Ok(new { message = result.Message, token = result.Token, role = result.Role, mustChangePassword = result.MustChangePassword });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken cancellationToken)
    {
        var result = await _authService.LoginAsync(request.Identifier, request.Password, cancellationToken);
        if (!result.Succeeded)
        {
            return Unauthorized(new { message = result.Message });
        }
        return Ok(new { message = result.Message, token = result.Token, role = result.Role, mustChangePassword = result.MustChangePassword });
    }

    [HttpPost("change_password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request, CancellationToken cancellationToken)
    {
        var result = await _authService.ChangePasswordAsync(request.Email, request.OldPassword, request.NewPassword, cancellationToken);
        if (!result.Succeeded)
        {
            return result.Message.Contains("Invalid")
                ? Unauthorized(new { message = result.Message })
                : BadRequest(new { message = result.Message });
        }
        return Ok(new { message = result.Message, token = result.Token, role = result.Role, mustChangePassword = result.MustChangePassword });
    }

    public sealed record RegisterRequest(
        [param: Required] string Username,
        [param: Required, EmailAddress] string Email,
        [param: Required] string Password);

    public sealed record LoginRequest(
        [param: Required] string Identifier,
        [param: Required] string Password);

    public sealed record ChangePasswordRequest(
        [param: Required, EmailAddress] string Email,
        [param: Required] string OldPassword,
        [param: Required] string NewPassword);
}
