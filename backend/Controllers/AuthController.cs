using System.ComponentModel.DataAnnotations;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using backend.Data;
using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace backend.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly JwtTokenService _jwtTokenService;
    private readonly IMemoryCache _cache;
    private readonly IConfiguration _configuration;

    public AuthController(
        AppDbContext dbContext,
        JwtTokenService jwtTokenService,
        IMemoryCache cache,
        IConfiguration configuration)
    {
        _dbContext = dbContext;
        _jwtTokenService = jwtTokenService;
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

        var cacheKey = $"registry_creds_{user!.Username}";
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

    // Docker Registry token endpoint (called by registry and docker clients)
    [HttpGet("/auth/token")]
    public async Task<IActionResult> GetRegistryToken(
        [FromQuery] string? service,
        [FromQuery] string? account,
        [FromQuery] string? client_id,
        [FromQuery(Name = "scope")] string[]? scopes,
        CancellationToken cancellationToken)
    {
        var username = NormalizeIdentifier(account ?? string.Empty);
        var password = string.Empty;

        // Docker login/token flow uses Basic auth to authenticate user credentials.
        if (TryReadBasicCredentials(out var basicUsername, out var basicPassword))
        {
            username = NormalizeIdentifier(basicUsername);
            password = basicPassword;
        }
        else if (!string.IsNullOrWhiteSpace(username)
                 && _cache.TryGetValue<(string Username, string Password)>($"registry_creds_{username}", out var cachedCreds))
        {
            password = cachedCreds.Password;
        }
        else
        {
            return Unauthorized(new { message = "Missing or invalid credentials for registry token." });
        }

        var user = await _dbContext.Users
            .FirstOrDefaultAsync(existingUser => existingUser.Email == username || existingUser.Username == username, cancellationToken);
        var storedHash = user?.PasswordHash;

        if (user is null || string.IsNullOrWhiteSpace(storedHash) || !VerifyPassword(password, storedHash))
        {
            return Unauthorized(new { message = "Invalid username/email or password." });
        }

        var tokenService = string.IsNullOrWhiteSpace(service)
            ? "dockerhub-mimic-registry"
            : service.Trim();

        var requestedScopes = scopes ?? Array.Empty<string>();
        var access = BuildRegistryAccessEntries(requestedScopes);
        var (token, expiresIn) = GenerateRegistryJwt(user.Username, tokenService, access, client_id);

        return Ok(new
        {
            token,
            access_token = token,
            expires_in = expiresIn,
            issued_at = DateTime.UtcNow.ToString("O")
        });
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

    private bool TryReadBasicCredentials(out string username, out string password)
    {
        username = string.Empty;
        password = string.Empty;

        var authorization = Request.Headers.Authorization.ToString();
        if (string.IsNullOrWhiteSpace(authorization) || !authorization.StartsWith("Basic ", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        var encoded = authorization[6..].Trim();
        try
        {
            var bytes = Convert.FromBase64String(encoded);
            var decoded = Encoding.UTF8.GetString(bytes);
            var separatorIndex = decoded.IndexOf(':');
            if (separatorIndex <= 0)
            {
                return false;
            }

            username = decoded[..separatorIndex];
            password = decoded[(separatorIndex + 1)..];
            return !string.IsNullOrWhiteSpace(username);
        }
        catch (FormatException)
        {
            return false;
        }
    }

    private static List<object> BuildRegistryAccessEntries(IEnumerable<string> scopes)
    {
        var access = new List<object>();

        foreach (var rawScope in scopes)
        {
            if (string.IsNullOrWhiteSpace(rawScope))
            {
                continue;
            }

            var parts = rawScope.Split(':');
            if (parts.Length < 3)
            {
                continue;
            }

            var type = parts[0];
            var name = parts[1];
            var actions = parts[2]
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToArray();

            access.Add(new
            {
                type,
                name,
                actions
            });
        }

        return access;
    }

    private (string Token, int ExpiresIn) GenerateRegistryJwt(string username, string service, List<object> access, string? clientId)
    {
        var issuer = _configuration.GetValue<string>("REGISTRY_JWT_ISSUER")
            ?? _configuration.GetValue<string>("Registry:JwtIssuer")
            ?? "dockerhub-mimic-backend";
        var privateKeyPath = _configuration.GetValue<string>("REGISTRY_JWT_PRIVATE_KEY_PATH")
            ?? _configuration.GetValue<string>("Registry:JwtPrivateKeyPath")
            ?? "/app/registry-private.pem";
        var publicCertPath = _configuration.GetValue<string>("REGISTRY_JWT_PUBLIC_CERT_PATH")
            ?? _configuration.GetValue<string>("Registry:JwtPublicCertPath")
            ?? "/app/registry-public.crt";
        var expiresIn = _configuration.GetValue<int?>("REGISTRY_JWT_EXPIRES_SECONDS") ?? 3600;

        if (!System.IO.File.Exists(privateKeyPath))
        {
            throw new InvalidOperationException($"Registry private key not found at '{privateKeyPath}'.");
        }

        var pem = System.IO.File.ReadAllText(privateKeyPath);
        RSAParameters rsaParams;
        using (var tempRsa = RSA.Create())
        {
            tempRsa.ImportFromPem(pem);
            rsaParams = tempRsa.ExportParameters(includePrivateParameters: true);
        }

        var securityKey = new RsaSecurityKey(rsaParams);

        var now = DateTime.UtcNow;
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, username),
            new(JwtRegisteredClaimNames.Iat, EpochTime.GetIntDate(now).ToString(), ClaimValueTypes.Integer64),
            new("access", JsonSerializer.Serialize(access), JsonClaimValueTypes.JsonArray)
        };

        if (!string.IsNullOrWhiteSpace(clientId))
        {
            claims.Add(new Claim("client_id", clientId));
        }

        var signingCredentials = new SigningCredentials(securityKey, SecurityAlgorithms.RsaSha256);
        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: service,
            claims: claims,
            notBefore: now,
            expires: now.AddSeconds(expiresIn),
            signingCredentials: signingCredentials);

        var x5c = TryGetX5cFromPemCertificate(publicCertPath);
        if (!string.IsNullOrWhiteSpace(x5c))
        {
            token.Header[JwtHeaderParameterNames.X5c] = new[] { x5c };
        }

        var tokenHandler = new JwtSecurityTokenHandler();
        return (tokenHandler.WriteToken(token), expiresIn);
    }

    private static string? TryGetX5cFromPemCertificate(string certificatePath)
    {
        if (!System.IO.File.Exists(certificatePath))
        {
            return null;
        }

        var pem = System.IO.File.ReadAllText(certificatePath);
        const string begin = "-----BEGIN CERTIFICATE-----";
        const string end = "-----END CERTIFICATE-----";

        var start = pem.IndexOf(begin, StringComparison.Ordinal);
        var finish = pem.IndexOf(end, StringComparison.Ordinal);
        if (start < 0 || finish < 0 || finish <= start)
        {
            return null;
        }

        var base64Body = pem[(start + begin.Length)..finish]
            .Replace("\r", string.Empty, StringComparison.Ordinal)
            .Replace("\n", string.Empty, StringComparison.Ordinal)
            .Trim();

        return string.IsNullOrWhiteSpace(base64Body) ? null : base64Body;
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
