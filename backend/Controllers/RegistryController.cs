using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("")]
public class RegistryController : ControllerBase
{
    private readonly IRegistryService _registryService;

    public RegistryController(IRegistryService registryService)
    {
        _registryService = registryService;
    }

    [HttpGet("auth/token")]
    public async Task<IActionResult> GetRegistryToken(
        [FromQuery] string? service,
        [FromQuery] string? account,
        [FromQuery] string? client_id,
        [FromQuery(Name = "scope")] string[]? scopes,
        CancellationToken cancellationToken)
    {
        var authHeader = Request.Headers.Authorization.ToString();
        var result = await _registryService.GetRegistryTokenAsync(authHeader, account, service, client_id, scopes, cancellationToken);
        if (!result.Succeeded)
            return Unauthorized(new { message = result.ErrorMessage });
        return Ok(new { token = result.Token, access_token = result.Token, expires_in = result.ExpiresIn, issued_at = DateTime.UtcNow.ToString("O") });
    }

    [HttpPost("registry/events")]
    [AllowAnonymous]
    public async Task<IActionResult> HandleRegistryEvents(
        [FromBody] RegistryEventEnvelope? envelope,
        CancellationToken cancellationToken = default)
    {
        var result = await _registryService.HandleRegistryEventsAsync(envelope, cancellationToken);
        return Ok(new { message = result.Message });
    }
}
