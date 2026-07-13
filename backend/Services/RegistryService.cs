using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.IdentityModel.Tokens;

namespace backend.Services;

// --- DTOs ---

public sealed record RegistryEventEnvelope(
    [property: JsonPropertyName("events")] List<RegistryEvent> Events);

public sealed record RegistryEvent(
    [property: JsonPropertyName("action")] string? Action,
    [property: JsonPropertyName("target")] RegistryEventTarget? Target,
    [property: JsonPropertyName("actor")] RegistryEventActor? Actor);

public sealed record RegistryEventActor(
    [property: JsonPropertyName("name")] string? Name);

public sealed record RegistryEventTarget(
    [property: JsonPropertyName("repository")] string? Repository,
    [property: JsonPropertyName("tag")] string? Tag,
    [property: JsonPropertyName("digest")] string? Digest,
    [property: JsonPropertyName("size")] long? Size,
    [property: JsonPropertyName("mediaType")] string? MediaType,
    [property: JsonPropertyName("platform")] RegistryEventPlatform? Platform);

public sealed record RegistryEventPlatform(
    [property: JsonPropertyName("os")] string? Os,
    [property: JsonPropertyName("architecture")] string? Architecture);

// --- Result types ---

public sealed record RegistryTokenResult(bool Succeeded, string? Token, int ExpiresIn, string? ErrorMessage);
public sealed record RegistryEventsResult(string Message);

// --- Interface ---

public interface IRegistryService
{
    Task<RegistryTokenResult> GetRegistryTokenAsync(string? authorizationHeader, string? account, string? service, string? clientId, string[]? scopes, CancellationToken cancellationToken);
    Task<RegistryEventsResult> HandleRegistryEventsAsync(RegistryEventEnvelope? envelope, CancellationToken cancellationToken);
}

// --- Implementation ---

public class RegistryService : IRegistryService
{
    private readonly AppDbContext _dbContext;
    private readonly IMemoryCache _cache;
    private readonly IConfiguration _configuration;

    public RegistryService(AppDbContext dbContext, IMemoryCache cache, IConfiguration configuration)
    {
        _dbContext = dbContext;
        _cache = cache;
        _configuration = configuration;
    }

    public async Task<RegistryTokenResult> GetRegistryTokenAsync(
        string? authorizationHeader,
        string? account,
        string? service,
        string? clientId,
        string[]? scopes,
        CancellationToken cancellationToken)
    {
        var username = Normalize(account ?? string.Empty);
        var password = string.Empty;

        if (TryParseBasicCredentials(authorizationHeader, out var basicUsername, out var basicPassword))
        {
            username = Normalize(basicUsername);
            password = basicPassword;
        }
        else if (!string.IsNullOrWhiteSpace(username)
                 && _cache.TryGetValue<(string Username, string Password)>($"registry_creds_{username}", out var cachedCreds))
        {
            password = cachedCreds.Password;
        }
        else
        {
            return new RegistryTokenResult(false, null, 0, "Missing or invalid credentials for registry token.");
        }

        var user = await _dbContext.Users
            .FirstOrDefaultAsync(u => u.Email == username || u.Username == username, cancellationToken);
        var storedHash = user?.PasswordHash;

        if (user is null || string.IsNullOrWhiteSpace(storedHash) || !VerifyPassword(password, storedHash))
        {
            return new RegistryTokenResult(false, null, 0, "Invalid username/email or password.");
        }

        var tokenService = string.IsNullOrWhiteSpace(service) ? "dockerhub-mimic-registry" : service.Trim();
        var requestedScopes = scopes ?? Array.Empty<string>();
        var access = await BuildRegistryAccessEntries(requestedScopes, user, cancellationToken);
        var (token, expiresIn) = GenerateRegistryJwt(user.Username, tokenService, access, clientId);

        return new RegistryTokenResult(true, token, expiresIn, null);
    }

    public async Task<RegistryEventsResult> HandleRegistryEventsAsync(
        RegistryEventEnvelope? envelope,
        CancellationToken cancellationToken)
    {
        if (envelope?.Events is null || envelope.Events.Count == 0)
        {
            return new RegistryEventsResult("No events received.");
        }

        var now = DateTime.UtcNow;

        foreach (var ev in envelope.Events)
        {
            var action = (ev.Action ?? string.Empty).Trim().ToLowerInvariant();
            if (action != "push" && action != "pull") continue;

            var repositoryPath = (ev.Target?.Repository ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(repositoryPath)) continue;

            var slashIndex = repositoryPath.IndexOf('/');
            if (slashIndex <= 0 || slashIndex >= repositoryPath.Length - 1) continue;

            var namespacePart = Normalize(repositoryPath[..slashIndex]);
            var repoName = repositoryPath[(slashIndex + 1)..].Trim().ToLowerInvariant();
            if (string.IsNullOrWhiteSpace(namespacePart) || string.IsNullOrWhiteSpace(repoName)) continue;

            var owner = await _dbContext.Users.FirstOrDefaultAsync(u => u.Username == namespacePart, cancellationToken);
            var organization = owner is null
                ? await _dbContext.Organizations.FirstOrDefaultAsync(o => o.Name == namespacePart, cancellationToken)
                : null;

            if (owner is null && organization is null)
                continue;

            var existing = organization is null
                ? await _dbContext.Repositories.FirstOrDefaultAsync(r => r.OrganizationId == null && r.OwnerId == owner!.Id && r.Name == repoName, cancellationToken)
                : await _dbContext.Repositories.FirstOrDefaultAsync(r => r.OrganizationId == organization.Id && r.Name == repoName, cancellationToken);

            Repository repo;
            if (existing is null)
            {
                repo = new Repository
                {
                    Name = repoName,
                    Description = "Synced from Docker Registry push event.",
                    Visibility = "private",
                    OwnerId = organization?.OwnerId ?? owner!.Id,
                    OrganizationId = organization?.Id,
                    CreatedAt = now,
                    UpdatedAt = now,
                    IsOfficial = false,
                    StarCount = 0,
                    PullCount = 0
                };
                _dbContext.Repositories.Add(repo);
            }
            else
            {
                repo = existing;
                existing.UpdatedAt = now;
            }

            var tagName = (ev.Target?.Tag ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(tagName)) continue;

            await _dbContext.SaveChangesAsync(cancellationToken);

            var normalizedTagName = tagName.ToLowerInvariant();
            var existingTag = await _dbContext.RepositoryTags
                .FirstOrDefaultAsync(t => t.RepositoryId == repo.Id && t.Name == normalizedTagName, cancellationToken);

            if (existingTag is null)
            {
                existingTag = new RepositoryTag { RepositoryId = repo.Id, Name = normalizedTagName, CreatedAt = now };
                _dbContext.RepositoryTags.Add(existingTag);
            }

            if (action == "push")
            {
                existingTag.Digest = NullableString(ev.Target?.Digest);
                existingTag.MediaType = NullableString(ev.Target?.MediaType);
                existingTag.CompressedSizeBytes = ev.Target?.Size;
                existingTag.LastPushedAt = now;
                existingTag.LastPushedBy = NullableString(ev.Actor?.Name) ?? namespacePart;
                existingTag.Os = NullableString(ev.Target?.Platform?.Os);
                existingTag.Architecture = NullableString(ev.Target?.Platform?.Architecture);
            }
            else if (action == "pull")
            {
                existingTag.LastPulledAt = now;
                existingTag.PullCount += 1;
                repo.PullCount += 1;
            }

            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        return new RegistryEventsResult("Registry events processed.");
    }

    private async Task<List<object>> BuildRegistryAccessEntries(IEnumerable<string> scopes, User user, CancellationToken cancellationToken)
    {
        var access = new List<object>();
        var normalizedScopes = scopes
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .Distinct(StringComparer.OrdinalIgnoreCase);

        foreach (var rawScope in normalizedScopes)
        {
            var parts = rawScope.Split(':');
            if (parts.Length < 3) continue;

            var type = parts[0];
            var name = parts[1];
            var requestedActions = parts[2]
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToArray();

            if (!string.Equals(type, "repository", StringComparison.OrdinalIgnoreCase) || requestedActions.Length == 0)
                continue;

            var grantedActions = await GetGrantedRepositoryActions(name, requestedActions, user, cancellationToken);
            if (grantedActions.Length == 0) continue;

            access.Add(new { type, name, actions = grantedActions });
        }

        return access;
    }

    private async Task<string[]> GetGrantedRepositoryActions(
        string repositoryName,
        IReadOnlyCollection<string> requestedActions,
        User user,
        CancellationToken cancellationToken)
    {
        var normalized = Normalize(repositoryName);
        if (string.IsNullOrWhiteSpace(normalized)) return Array.Empty<string>();

        var slashIndex = normalized.IndexOf('/');
        string repoName;
        string? namespaceSegment = null;
        if (slashIndex > 0 && slashIndex < normalized.Length - 1)
        {
            namespaceSegment = normalized[..slashIndex];
            repoName = normalized[(slashIndex + 1)..];
        }
        else
        {
            repoName = normalized;
        }

        // Base query with all necessary includes for permission evaluation
        var baseQuery = _dbContext.Repositories
            .Include(r => r.Owner)
            .Include(r => r.Collaborators)
            .Include(r => r.Organization)
            .ThenInclude(o => o!.Members)
            .Include(r => r.TeamRepositories)
            .ThenInclude(tr => tr.Team)
            .ThenInclude(t => t!.TeamMembers)
            .AsQueryable();

        Repository? repository;
        if (!string.IsNullOrWhiteSpace(namespaceSegment))
        {
            // Resolve namespace to org ID first to avoid navigation-property access in WHERE
            var orgId = await _dbContext.Organizations
                .Where(o => o.Name == namespaceSegment)
                .Select(o => (int?)o.Id)
                .FirstOrDefaultAsync(cancellationToken);

            repository = orgId.HasValue
                ? await baseQuery.FirstOrDefaultAsync(r => r.Name == repoName && r.OrganizationId == orgId.Value, cancellationToken)
                : await baseQuery.FirstOrDefaultAsync(r => r.Name == repoName && r.OrganizationId == null && r.Owner != null && r.Owner.Username == namespaceSegment, cancellationToken);
        }
        else
        {
            repository = await baseQuery.FirstOrDefaultAsync(r => r.IsOfficial && r.Name == repoName, cancellationToken);
        }

        if (repository is null) return Array.Empty<string>();

        var isAdmin = User.IsAdminRole(user.Role);
        var isOwner = repository.OwnerId == user.Id;
        var collaborator = repository.Collaborators.FirstOrDefault(c => c.UserId == user.Id);
        var collaboratorRole = Normalize(collaborator?.Role ?? string.Empty);
        // Collaborators only apply to personal (non-org) repos; org repos use team-based permissions
        var canPushAsCollaborator = repository.OrganizationId == null
            && repository.Visibility == "public"
            && (collaboratorRole == "write" || collaboratorRole == "admin");

        var organizationMembership = repository.Organization?.Members.FirstOrDefault(m => m.UserId == user.Id);
        var organizationRole = Normalize(organizationMembership?.Role ?? string.Empty);
        var isOrganizationMember = organizationMembership is not null;
        var canPushAsOrganizationMember = organizationRole == OrganizationMember.RoleOwner || organizationRole == OrganizationMember.RoleAdmin;

        // Check team-based permissions for this specific repository
        var teamPermission = repository.TeamRepositories
            .Where(tr => tr.Team != null && tr.Team.TeamMembers.Any(tm => tm.UserId == user.Id))
            .Select(tr => tr.Permission)
            .FirstOrDefault();
        var canPushViaTeam = teamPermission == OrganizationTeamRepository.PermissionReadWrite
                             || teamPermission == OrganizationTeamRepository.PermissionAdmin;
        var canPullViaTeam = teamPermission is not null;

        var canPull = repository.Visibility == "public" || isOwner || isAdmin || isOrganizationMember || canPullViaTeam;
        var canPush = isOwner || isAdmin || canPushAsCollaborator || canPushAsOrganizationMember || canPushViaTeam;

        return requestedActions
            .Select(Normalize)
            .Where(a => a == "pull" || a == "push")
            .Where(a => (a == "pull" && canPull) || (a == "push" && canPush))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();
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
            throw new InvalidOperationException($"Registry private key not found at '{privateKeyPath}'.");

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
            claims.Add(new Claim("client_id", clientId));

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
            token.Header[JwtHeaderParameterNames.X5c] = new[] { x5c };

        return (new JwtSecurityTokenHandler().WriteToken(token), expiresIn);
    }

    private static bool TryParseBasicCredentials(string? authorization, out string username, out string password)
    {
        username = string.Empty;
        password = string.Empty;

        if (string.IsNullOrWhiteSpace(authorization) || !authorization.StartsWith("Basic ", StringComparison.OrdinalIgnoreCase))
            return false;

        var encoded = authorization[6..].Trim();
        try
        {
            var decoded = Encoding.UTF8.GetString(Convert.FromBase64String(encoded));
            var sep = decoded.IndexOf(':');
            if (sep <= 0) return false;
            username = decoded[..sep];
            password = decoded[(sep + 1)..];
            return !string.IsNullOrWhiteSpace(username);
        }
        catch (FormatException)
        {
            return false;
        }
    }

    private static string? TryGetX5cFromPemCertificate(string certificatePath)
    {
        if (!System.IO.File.Exists(certificatePath)) return null;

        var pem = System.IO.File.ReadAllText(certificatePath);
        const string begin = "-----BEGIN CERTIFICATE-----";
        const string end = "-----END CERTIFICATE-----";

        var start = pem.IndexOf(begin, StringComparison.Ordinal);
        var finish = pem.IndexOf(end, StringComparison.Ordinal);
        if (start < 0 || finish < 0 || finish <= start) return null;

        var base64Body = pem[(start + begin.Length)..finish]
            .Replace("\r", string.Empty, StringComparison.Ordinal)
            .Replace("\n", string.Empty, StringComparison.Ordinal)
            .Trim();

        return string.IsNullOrWhiteSpace(base64Body) ? null : base64Body;
    }

    private static bool VerifyPassword(string password, string storedHash)
    {
        var parts = storedHash.Split(':');
        if (parts.Length != 2) return false;

        var computedHash = SHA256.HashData(Encoding.UTF8.GetBytes(parts[0] + password));
        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(parts[1]),
            Encoding.UTF8.GetBytes(Convert.ToBase64String(computedHash)));
    }

    private static string Normalize(string value) => value.Trim().ToLowerInvariant();
    private static string? NullableString(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
