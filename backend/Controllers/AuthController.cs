using System.ComponentModel.DataAnnotations;
using System.Security.Cryptography;
using System.Text;
using backend.Data;
using backend.Models;
using backend.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly JwtTokenService _jwtTokenService;

    public AuthController(AppDbContext dbContext, JwtTokenService jwtTokenService)
    {
        _dbContext = dbContext;
        _jwtTokenService = jwtTokenService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request, CancellationToken cancellationToken)
    {
        if (!IsValidPassword(request.Password))
        {
            return BadRequest(new
            {
                message = "Password must be at least 8 characters long and include uppercase, lowercase letters, and numbers."
            });
        }

        var normalizedEmail = NormalizeEmail(request.Email);
            var passwordHash = Models.User.HashPassword(request.Password);
        var userExists = await _dbContext.Users
            .AnyAsync(user => user.Email == normalizedEmail, cancellationToken);
        if (userExists)
        {
            return Conflict(new { message = "User already exists." });
        }

        _dbContext.Users.Add(new User
        {
            Email = normalizedEmail,
            PasswordHash = passwordHash,
            Role = Models.User.RoleUser,
            CreatedAt = DateTime.UtcNow
        });

        await _dbContext.SaveChangesAsync(cancellationToken);

        var createdUser = await _dbContext.Users.FirstAsync(user => user.Email == normalizedEmail, cancellationToken);
        var token = _jwtTokenService.GenerateToken(createdUser);

        return Ok(new
        {
            message = "User registered successfully.",
            token,
            role = createdUser.Role
        });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken cancellationToken)
    {
        var normalizedEmail = NormalizeEmail(request.Email);
        var user = await _dbContext.Users
            .Where(user => user.Email == normalizedEmail)
            .FirstOrDefaultAsync(cancellationToken);
        var storedHash = user?.PasswordHash;
        if (string.IsNullOrWhiteSpace(storedHash) || !VerifyPassword(request.Password, storedHash))
        {
            return Unauthorized(new { message = "Invalid email or password." });
        }

        var token = _jwtTokenService.GenerateToken(user!);

        return Ok(new
        {
            message = "Login successful.",
            token,
            role = user!.Role
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
        [param: Required, EmailAddress] string Email,
        [param: Required] string Password);

    public sealed record LoginRequest(
        [param: Required, EmailAddress] string Email,
        [param: Required] string Password);

    public sealed record ChangePasswordRequest(
        [param: Required, EmailAddress] string Email,
        [param: Required] string OldPassword,
        [param: Required] string NewPassword);
}
