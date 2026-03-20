using System.ComponentModel.DataAnnotations;
using System.Security.Cryptography;
using System.Text;
using backend.Data;
using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;

namespace backend.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly JwtTokenService _jwtTokenService;
    private readonly HarborService _harborService;
    private readonly IMemoryCache _cache;
    private readonly IConfiguration _configuration;

    public AuthController(
        AppDbContext dbContext,
        JwtTokenService jwtTokenService,
        HarborService harborService,
        IMemoryCache cache,
        IConfiguration configuration)
    {
        _dbContext = dbContext;
        _jwtTokenService = jwtTokenService;
        _harborService = harborService;
        _cache = cache;
        _configuration = configuration;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request, CancellationToken cancellationToken)
    {
        if (!IsValidUsername(request.Username))
        {
            return BadRequest(new
            {
                message = "Username must be 3-64 characters and contain only letters, numbers, dots, hyphens, or underscores."
            });
        }

        if (!IsValidPassword(request.Password))
        {
            return BadRequest(new
            {
                message = "Password must be at least 8 characters long and include uppercase, lowercase letters, and numbers."
            });
        }

        var normalizedEmail = NormalizeEmail(request.Email);
        var normalizedUsername = NormalizeUsername(request.Username);
        var passwordHash = Models.User.HashPassword(request.Password);
        var userExists = await _dbContext.Users
            .AnyAsync(user => user.Email == normalizedEmail || user.Username == normalizedUsername, cancellationToken);
        if (userExists)
        {
            return Conflict(new { message = "User with this email or username already exists." });
        }

        _dbContext.Users.Add(new User
        {
            Email = normalizedEmail,
            Username = normalizedUsername,
            PasswordHash = passwordHash,
            Role = Models.User.RoleUser,
            CreatedAt = DateTime.UtcNow
        });

        await _dbContext.SaveChangesAsync(cancellationToken);

        var createdUser = await _dbContext.Users.FirstAsync(user => user.Email == normalizedEmail, cancellationToken);
        var token = _jwtTokenService.GenerateToken(createdUser);

        var harborProvisioningResult = await _harborService
            .CreateUserAsync(normalizedUsername, normalizedEmail, request.Password, cancellationToken);

        bool harborProvisioned = harborProvisioningResult.Succeeded
            || harborProvisioningResult.StatusCode == StatusCodes.Status409Conflict;

        if (harborProvisioned)
        {
            var projectResult = await _harborService.CreateProjectAsync(
                normalizedUsername,
                isPublic: false,
                username: normalizedUsername,
                password: request.Password,
                cancellationToken: cancellationToken);
            if (!projectResult.Succeeded)
            {
                HttpContext.RequestServices
                    .GetRequiredService<ILogger<AuthController>>()
                    .LogWarning("Harbor project creation failed for {Username}: {Error}", normalizedUsername, projectResult.ErrorMessage);
            }
        }
        else
        {
            HttpContext.RequestServices
                .GetRequiredService<ILogger<AuthController>>()
                .LogWarning("Harbor provisioning failed for {Username}: {Error}", normalizedUsername, harborProvisioningResult.ErrorMessage);
        }

        return Ok(new
        {
            message = "User registered successfully.",
            token,
            role = createdUser.Role,
            harborProvisioned
        });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken cancellationToken)
    {
        var normalizedIdentifier = NormalizeIdentifier(request.Identifier);
        var user = await _dbContext.Users
            .Where(existingUser => existingUser.Email == normalizedIdentifier || existingUser.Username == normalizedIdentifier)
            .FirstOrDefaultAsync(cancellationToken);

        var storedHash = user?.PasswordHash;
        if (string.IsNullOrWhiteSpace(storedHash) || !VerifyPassword(request.Password, storedHash))
        {
            return Unauthorized(new { message = "Invalid username/email or password." });
        }

        var token = _jwtTokenService.GenerateToken(user!);

        var cacheKey = $"harbor_creds_{user!.Id}";
        var jwtExpiresMinutes = _configuration.GetValue<int?>("Jwt:ExpiresMinutes") ?? 60;
        var cacheOptions = new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(jwtExpiresMinutes)
        };
        _cache.Set(cacheKey, (user.Username, request.Password), cacheOptions);

        return Ok(new
        {
            message = "Login successful.",
            token,
            role = user.Role
        });
    }

    [HttpPost("change_password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request, CancellationToken cancellationToken)
    {
        var normalizedEmail = NormalizeEmail(request.Email);
        var user = await _dbContext.Users
            .FirstOrDefaultAsync(existingUser => existingUser.Email == normalizedEmail, cancellationToken);

        var storedHash = user?.PasswordHash;
        if (string.IsNullOrWhiteSpace(storedHash) || !VerifyPassword(request.OldPassword, storedHash))
        {
            return Unauthorized(new { message = "Invalid email or password." });
        }

        if (!IsValidPassword(request.NewPassword))
        {
            return BadRequest(new
            {
                message = "New password must be at least 8 characters long and include uppercase, lowercase letters, and numbers."
            });
        }

        if (user is null)
        {
            return Conflict(new { message = "Password could not be updated. Please try again." });
        }

        user.PasswordHash = Models.User.HashPassword(request.NewPassword);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(new { message = "Password changed successfully." });
    }

    private static string NormalizeEmail(string email)
    {
        return email.Trim().ToLowerInvariant();
    }

    private static string NormalizeUsername(string username)
    {
        return username.Trim().ToLowerInvariant();
    }

    private static string NormalizeIdentifier(string identifier)
    {
        return identifier.Trim().ToLowerInvariant();
    }

    private static bool IsValidUsername(string username)
    {
        if (string.IsNullOrWhiteSpace(username))
        {
            return false;
        }

        var trimmed = username.Trim();
        if (trimmed.Length < 3 || trimmed.Length > 64)
        {
            return false;
        }

        return trimmed.All(ch => char.IsLetterOrDigit(ch) || ch == '.' || ch == '-' || ch == '_');
    }

    private static bool IsValidPassword(string password)
    {
        if (string.IsNullOrWhiteSpace(password) || password.Length < 8)
        {
            return false;
        }

        var hasUpper = password.Any(char.IsUpper);
        var hasLower = password.Any(char.IsLower);
        var hasDigit = password.Any(char.IsDigit);

        return hasUpper && hasLower && hasDigit;
    }

    private static bool VerifyPassword(string password, string storedHash)
    {
        var parts = storedHash.Split(':');
        if (parts.Length != 2)
        {
            return false;
        }

        var salt = parts[0];
        var expectedHash = parts[1];

        var computedHash = SHA256.HashData(Encoding.UTF8.GetBytes(salt + password));
        var computedHashBase64 = Convert.ToBase64String(computedHash);

        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(expectedHash),
            Encoding.UTF8.GetBytes(computedHashBase64));
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
