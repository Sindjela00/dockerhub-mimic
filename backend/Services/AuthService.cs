using System.ComponentModel.DataAnnotations;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.IdentityModel.Tokens;

namespace backend.Services;

public sealed record AuthResult(bool Succeeded, string Message, string? Token = null, string? Role = null);

public interface IAuthService
{
    Task<AuthResult> RegisterAsync(string username, string email, string password, CancellationToken cancellationToken);
    Task<AuthResult> LoginAsync(string identifier, string password, CancellationToken cancellationToken);
    Task<AuthResult> ChangePasswordAsync(string email, string oldPassword, string newPassword, CancellationToken cancellationToken);
    string GenerateToken(User user);
}

public class AuthService : IAuthService
{
    private readonly AppDbContext _dbContext;
    private readonly IConfiguration _configuration;
    private readonly IMemoryCache _cache;

    public AuthService(AppDbContext dbContext, IConfiguration configuration, IMemoryCache cache)
    {
        _dbContext = dbContext;
        _configuration = configuration;
        _cache = cache;
    }

    public async Task<AuthResult> RegisterAsync(string username, string email, string password, CancellationToken cancellationToken)
    {
        if (!IsValidUsername(username))
        {
            return new AuthResult(false, "Username must be 3-64 characters and contain only letters, numbers, dots, hyphens, or underscores.");
        }

        if (!IsValidPassword(password))
        {
            return new AuthResult(false, "Password must be at least 8 characters long and include uppercase, lowercase letters, and numbers.");
        }

        var normalizedEmail = NormalizeEmail(email);
        var normalizedUsername = NormalizeUsername(username);

        var userExists = await _dbContext.Users
            .AnyAsync(u => u.Email == normalizedEmail || u.Username == normalizedUsername, cancellationToken);

        if (userExists)
        {
            return new AuthResult(false, "User with this email or username already exists.");
        }

        _dbContext.Users.Add(new User
        {
            Email = normalizedEmail,
            Username = normalizedUsername,
            PasswordHash = User.HashPassword(password),
            Role = User.RoleUser,
            CreatedAt = DateTime.UtcNow
        });

        await _dbContext.SaveChangesAsync(cancellationToken);

        var createdUser = await _dbContext.Users.FirstAsync(u => u.Email == normalizedEmail, cancellationToken);
        var token = GenerateToken(createdUser);

        return new AuthResult(true, "User registered successfully.", token, createdUser.Role);
    }

    public async Task<AuthResult> LoginAsync(string identifier, string password, CancellationToken cancellationToken)
    {
        var normalizedIdentifier = NormalizeIdentifier(identifier);
        var user = await _dbContext.Users
            .Where(u => u.Email == normalizedIdentifier || u.Username == normalizedIdentifier)
            .FirstOrDefaultAsync(cancellationToken);

        var storedHash = user?.PasswordHash;
        if (string.IsNullOrWhiteSpace(storedHash) || !VerifyPassword(password, storedHash))
        {
            return new AuthResult(false, "Invalid username/email or password.");
        }

        var token = GenerateToken(user!);

        var cacheKey = $"registry_creds_{user!.Username}";
        var jwtExpiresMinutes = _configuration.GetValue<int?>("Jwt:ExpiresMinutes") ?? 60;
        _cache.Set(cacheKey, (user.Username, password), new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(jwtExpiresMinutes)
        });

        return new AuthResult(true, "Login successful.", token, user.Role);
    }

    public async Task<AuthResult> ChangePasswordAsync(string email, string oldPassword, string newPassword, CancellationToken cancellationToken)
    {
        var normalizedEmail = NormalizeEmail(email);
        var user = await _dbContext.Users
            .FirstOrDefaultAsync(u => u.Email == normalizedEmail, cancellationToken);

        var storedHash = user?.PasswordHash;
        if (string.IsNullOrWhiteSpace(storedHash) || !VerifyPassword(oldPassword, storedHash))
        {
            return new AuthResult(false, "Invalid email or password.");
        }

        if (!IsValidPassword(newPassword))
        {
            return new AuthResult(false, "New password must be at least 8 characters long and include uppercase, lowercase letters, and numbers.");
        }

        user!.PasswordHash = User.HashPassword(newPassword);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return new AuthResult(true, "Password changed successfully.");
    }

    public string GenerateToken(User user)
    {
        var key = _configuration.GetValue<string>("Jwt:Key")
            ?? "CHANGE_ME_TO_A_LONG_RANDOM_SECRET_KEY_12345";
        var issuer = _configuration.GetValue<string>("Jwt:Issuer")
            ?? "dockerhub-mimic";
        var audience = _configuration.GetValue<string>("Jwt:Audience")
            ?? "dockerhub-mimic-clients";
        var expiresMinutes = _configuration.GetValue<double?>("Jwt:ExpiresMinutes") ?? 60;

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Email),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(JwtRegisteredClaimNames.Name, user.Username ?? string.Empty),
            new(ClaimTypes.NameIdentifier, user.Email),
            new(ClaimTypes.Name, user.Username ?? string.Empty),
            new(ClaimTypes.Role, user.Role)
        };

        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
            SecurityAlgorithms.HmacSha256);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddMinutes(expiresMinutes),
            Issuer = issuer,
            Audience = audience,
            SigningCredentials = credentials
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    public static string NormalizeEmail(string email) => email.Trim().ToLowerInvariant();
    public static string NormalizeUsername(string username) => username.Trim().ToLowerInvariant();
    public static string NormalizeIdentifier(string identifier) => identifier.Trim().ToLowerInvariant();

    public static bool IsValidUsername(string username)
    {
        if (string.IsNullOrWhiteSpace(username)) return false;
        var trimmed = username.Trim();
        if (trimmed.Length < 3 || trimmed.Length > 64) return false;
        return trimmed.All(ch => char.IsLetterOrDigit(ch) || ch == '.' || ch == '-' || ch == '_');
    }

    public static bool IsValidPassword(string password)
    {
        if (string.IsNullOrWhiteSpace(password) || password.Length < 8) return false;
        return password.Any(char.IsUpper) && password.Any(char.IsLower) && password.Any(char.IsDigit);
    }

    public static bool VerifyPassword(string password, string storedHash)
    {
        var parts = storedHash.Split(':');
        if (parts.Length != 2) return false;

        var salt = parts[0];
        var expectedHash = parts[1];
        var computedHash = SHA256.HashData(Encoding.UTF8.GetBytes(salt + password));
        var computedHashBase64 = Convert.ToBase64String(computedHash);

        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(expectedHash),
            Encoding.UTF8.GetBytes(computedHashBase64));
    }
}
