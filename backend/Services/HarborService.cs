using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;

namespace backend.Services;

public interface HarborService
{
    Task<HarborUserProvisioningResult> CreateUserAsync(string username, string email, string password, CancellationToken cancellationToken);
    Task<HarborRepositoryProvisioningResult> CreateRepositoryAsync(string projectName, string repositoryName, bool isPublic, int? userId = null, CancellationToken cancellationToken = default);
    Task<HarborRepositoryDeletionResult> DeleteRepositoryAsync(string projectName, string repositoryName, int? userId = null, CancellationToken cancellationToken = default);
    Task<HarborRepositoryQueryResult> GetRepositoriesAsync(string projectName, int? userId = null, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<string>> GetCatalogAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<string>> GetTagsAsync(string repositoryName, CancellationToken cancellationToken = default);
    Task<JsonElement> GetManifestAsync(string repositoryName, string reference, CancellationToken cancellationToken = default);
}

public sealed record HarborUserProvisioningResult(bool Succeeded, string? ErrorMessage = null, int? StatusCode = null);
public sealed record HarborRepositoryProvisioningResult(bool Succeeded, string? ErrorMessage = null, int? StatusCode = null);
public sealed record HarborRepositoryDeletionResult(bool Succeeded, string? ErrorMessage = null, int? StatusCode = null);
public sealed record HarborRepositoryInfo(string Name, string FullName, string Description, DateTime? UpdatedAt);
public sealed record HarborRepositoryQueryResult(bool Succeeded, IReadOnlyList<HarborRepositoryInfo> Repositories, string? ErrorMessage = null, int? StatusCode = null);

public sealed class HarborServiceImpl : HarborService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<HarborServiceImpl> _logger;
    private readonly IMemoryCache _cache;

    public HarborServiceImpl(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<HarborServiceImpl> logger,
        IMemoryCache cache)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
        _cache = cache;
    }

    public async Task<HarborUserProvisioningResult> CreateUserAsync(string username, string email, string password, CancellationToken cancellationToken)
    {
        var apiBaseUrl = _configuration["Harbor:ApiBaseUrl"]?.TrimEnd('/') ?? "http://harbor:8080";
        var adminUsername = _configuration["Harbor:AdminUsername"];
        var adminPassword = _configuration["Harbor:AdminPassword"];

        if (string.IsNullOrWhiteSpace(adminUsername) || string.IsNullOrWhiteSpace(adminPassword))
        {
            return new HarborUserProvisioningResult(false, "Harbor admin credentials are not configured.");
        }

        var harborUsername = BuildHarborUsername(username);
        var payload = new
        {
            username = harborUsername,
            email,
            password,
            realname = harborUsername,
            comment = "Provisioned by dockerhub-mimic"
        };

        var client = _httpClientFactory.CreateClient();
        var request = BuildAuthenticatedRequest(HttpMethod.Post, $"{apiBaseUrl}/api/v2.0/users", adminUsername, adminPassword);
        request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

        try
        {
            using var response = await client.SendAsync(request, cancellationToken);
            if (response.IsSuccessStatusCode)
            {
                return new HarborUserProvisioningResult(true);
            }

            var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogWarning("Failed to create Harbor user {Email}. Status: {StatusCode}, Body: {Body}", email, (int)response.StatusCode, responseBody);

            if (response.StatusCode == System.Net.HttpStatusCode.Conflict)
            {
                return new HarborUserProvisioningResult(false, "Harbor user already exists.", (int)response.StatusCode);
            }

            return new HarborUserProvisioningResult(false, $"Harbor user creation failed. Status code: {(int)response.StatusCode}", (int)response.StatusCode);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error while creating Harbor user for {Email}", email);
            return new HarborUserProvisioningResult(false, "Could not connect to Harbor user API.");
        }
    }

    public async Task<HarborRepositoryProvisioningResult> CreateRepositoryAsync(string projectName, string repositoryName, bool isPublic, int? userId = null, CancellationToken cancellationToken = default)
    {
        var apiBaseUrl = _configuration["Harbor:ApiBaseUrl"]?.TrimEnd('/') ?? "http://harbor:8080";
        var credentials = userId.HasValue ? TryGetCachedCredentials(userId.Value) : null;

        var username = credentials?.username ?? _configuration["Harbor:AdminUsername"];
        var password = credentials?.password ?? _configuration["Harbor:AdminPassword"];

        if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
        {
            return new HarborRepositoryProvisioningResult(false, "Harbor credentials are not configured or cached for user.");
        }

        var harborProjectName = BuildHarborProjectName(projectName);
        var harborRepositoryName = BuildHarborRepositoryName(repositoryName);
        var client = _httpClientFactory.CreateClient();

        try
        {
            var projectRequest = BuildAuthenticatedRequest(
                HttpMethod.Get,
                $"{apiBaseUrl}/api/v2.0/projects/{Uri.EscapeDataString(harborProjectName)}",
                username,
                password);
            using var projectResponse = await client.SendAsync(projectRequest, cancellationToken);

            if (projectResponse.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                var createProjectPayload = new
                {
                    project_name = harborProjectName,
                    metadata = new Dictionary<string, string>
                    {
                        ["public"] = isPublic ? "true" : "false"
                    }
                };

                var createProjectRequest = BuildAuthenticatedRequest(HttpMethod.Post, $"{apiBaseUrl}/api/v2.0/projects", username, password);
                createProjectRequest.Content = new StringContent(JsonSerializer.Serialize(createProjectPayload), Encoding.UTF8, "application/json");

                using var createProjectResponse = await client.SendAsync(createProjectRequest, cancellationToken);
                if (!createProjectResponse.IsSuccessStatusCode && createProjectResponse.StatusCode != System.Net.HttpStatusCode.Conflict)
                {
                    var body = await createProjectResponse.Content.ReadAsStringAsync(cancellationToken);
                    _logger.LogWarning("Failed to create Harbor project {Project}. Status: {StatusCode}, Body: {Body}", harborProjectName, (int)createProjectResponse.StatusCode, body);
                    return new HarborRepositoryProvisioningResult(false, $"Failed to create Harbor project '{harborProjectName}'.", (int)createProjectResponse.StatusCode);
                }
            }
            else if (!projectResponse.IsSuccessStatusCode)
            {
                var body = await projectResponse.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogWarning("Failed to check Harbor project {Project}. Status: {StatusCode}, Body: {Body}", harborProjectName, (int)projectResponse.StatusCode, body);
                return new HarborRepositoryProvisioningResult(false, $"Failed to access Harbor project '{harborProjectName}'.", (int)projectResponse.StatusCode);
            }

            var repositoryProbeRequest = BuildAuthenticatedRequest(
                HttpMethod.Get,
                $"{apiBaseUrl}/api/v2.0/projects/{Uri.EscapeDataString(harborProjectName)}/repositories/{Uri.EscapeDataString(harborRepositoryName)}",
                username,
                password);
            using var repositoryProbeResponse = await client.SendAsync(repositoryProbeRequest, cancellationToken);

            if (repositoryProbeResponse.IsSuccessStatusCode || repositoryProbeResponse.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                return new HarborRepositoryProvisioningResult(true);
            }

            var responseBody = await repositoryProbeResponse.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogWarning("Failed Harbor repository request for {Project}/{Repository}. Status: {StatusCode}, Body: {Body}", harborProjectName, harborRepositoryName, (int)repositoryProbeResponse.StatusCode, responseBody);
            return new HarborRepositoryProvisioningResult(false, "Harbor repository provisioning request failed.", (int)repositoryProbeResponse.StatusCode);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error while provisioning Harbor repository {Project}/{Repository}", harborProjectName, harborRepositoryName);
            return new HarborRepositoryProvisioningResult(false, "Could not connect to Harbor repository API.");
        }
    }

    public async Task<HarborRepositoryDeletionResult> DeleteRepositoryAsync(string projectName, string repositoryName, int? userId = null, CancellationToken cancellationToken = default)
    {
        var apiBaseUrl = _configuration["Harbor:ApiBaseUrl"]?.TrimEnd('/') ?? "http://harbor:8080";
        var credentials = userId.HasValue ? TryGetCachedCredentials(userId.Value) : null;

        var username = credentials?.username ?? _configuration["Harbor:AdminUsername"];
        var password = credentials?.password ?? _configuration["Harbor:AdminPassword"];

        if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
        {
            return new HarborRepositoryDeletionResult(false, "Harbor credentials are not configured or cached for user.");
        }

        var harborProjectName = BuildHarborProjectName(projectName);
        var harborRepositoryName = BuildHarborRepositoryName(repositoryName);
        var client = _httpClientFactory.CreateClient();

        try
        {
            var deleteRequest = BuildAuthenticatedRequest(
                HttpMethod.Delete,
                $"{apiBaseUrl}/api/v2.0/projects/{Uri.EscapeDataString(harborProjectName)}/repositories/{Uri.EscapeDataString(harborRepositoryName)}",
                username,
                password);

            using var deleteResponse = await client.SendAsync(deleteRequest, cancellationToken);
            if (deleteResponse.IsSuccessStatusCode || deleteResponse.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                return new HarborRepositoryDeletionResult(true);
            }

            var body = await deleteResponse.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogWarning(
                "Failed to delete Harbor repository {Project}/{Repository}. Status: {StatusCode}, Body: {Body}",
                harborProjectName,
                harborRepositoryName,
                (int)deleteResponse.StatusCode,
                body);

            return new HarborRepositoryDeletionResult(false, "Failed to delete repository in Harbor.", (int)deleteResponse.StatusCode);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error while deleting Harbor repository {Project}/{Repository}", harborProjectName, harborRepositoryName);
            return new HarborRepositoryDeletionResult(false, "Could not connect to Harbor repository API.");
        }
    }

    public async Task<HarborRepositoryQueryResult> GetRepositoriesAsync(string projectName, int? userId = null, CancellationToken cancellationToken = default)
    {
        var apiBaseUrl = _configuration["Harbor:ApiBaseUrl"]?.TrimEnd('/') ?? "http://harbor:8080";
        var credentials = userId.HasValue ? TryGetCachedCredentials(userId.Value) : null;

        var username = credentials?.username ?? _configuration["Harbor:AdminUsername"];
        var password = credentials?.password ?? _configuration["Harbor:AdminPassword"];

        if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
        {
            return new HarborRepositoryQueryResult(false, Array.Empty<HarborRepositoryInfo>(), "Harbor credentials are not configured or cached for user.");
        }

        var harborProjectName = BuildHarborProjectName(projectName);
        var client = _httpClientFactory.CreateClient();

        try
        {
            var request = BuildAuthenticatedRequest(
                HttpMethod.Get,
                $"{apiBaseUrl}/api/v2.0/projects/{Uri.EscapeDataString(harborProjectName)}/repositories?page=1&page_size=100",
                username,
                password);

            using var response = await client.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogWarning("Failed to list Harbor repositories for {Project}. Status: {StatusCode}, Body: {Body}", harborProjectName, (int)response.StatusCode, body);
                return new HarborRepositoryQueryResult(false, Array.Empty<HarborRepositoryInfo>(), "Failed to fetch repositories from Harbor.", (int)response.StatusCode);
            }

            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            using var document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
            if (document.RootElement.ValueKind != JsonValueKind.Array)
            {
                return new HarborRepositoryQueryResult(true, Array.Empty<HarborRepositoryInfo>());
            }

            var repositories = document.RootElement
                .EnumerateArray()
                .Select(item =>
                {
                    var fullName = item.TryGetProperty("name", out var nameProp)
                        ? nameProp.GetString() ?? string.Empty
                        : string.Empty;

                    var repoName = fullName.Contains('/')
                        ? fullName.Split('/').Last()
                        : fullName;

                    var description = item.TryGetProperty("description", out var descriptionProp)
                        ? descriptionProp.GetString() ?? string.Empty
                        : string.Empty;

                    DateTime? updatedAt = null;
                    if (item.TryGetProperty("update_time", out var updatedProp)
                        && DateTime.TryParse(updatedProp.GetString(), out var parsedUpdatedAt))
                    {
                        updatedAt = parsedUpdatedAt;
                    }

                    return new HarborRepositoryInfo(repoName, fullName, description, updatedAt);
                })
                .Where(repo => !string.IsNullOrWhiteSpace(repo.Name))
                .ToList();

            return new HarborRepositoryQueryResult(true, repositories);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error while listing Harbor repositories for {Project}", harborProjectName);
            return new HarborRepositoryQueryResult(false, Array.Empty<HarborRepositoryInfo>(), "Could not connect to Harbor repository API.");
        }
    }

    public async Task<IReadOnlyList<string>> GetCatalogAsync(CancellationToken cancellationToken = default)
    {
        var apiBaseUrl = _configuration["Harbor:ApiBaseUrl"]?.TrimEnd('/') ?? "http://harbor:8080";
        var adminUsername = _configuration["Harbor:AdminUsername"];
        var adminPassword = _configuration["Harbor:AdminPassword"];
        var defaultProject = _configuration["Registry:DefaultProject"] ?? "library";

        if (string.IsNullOrWhiteSpace(adminUsername) || string.IsNullOrWhiteSpace(adminPassword))
        {
            return Array.Empty<string>();
        }

        var client = _httpClientFactory.CreateClient();
        var request = BuildAuthenticatedRequest(
            HttpMethod.Get,
            $"{apiBaseUrl}/api/v2.0/projects/{Uri.EscapeDataString(defaultProject)}/repositories?page=1&page_size=100",
            adminUsername,
            adminPassword);

        try
        {
            using var response = await client.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                return Array.Empty<string>();
            }

            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            using var document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
            if (document.RootElement.ValueKind != JsonValueKind.Array)
            {
                return Array.Empty<string>();
            }

            return document.RootElement
                .EnumerateArray()
                .Select(item => item.TryGetProperty("name", out var nameProp) ? nameProp.GetString() : null)
                .Where(name => !string.IsNullOrWhiteSpace(name))
                .Cast<string>()
                .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching Harbor catalog for project {Project}", defaultProject);
            return Array.Empty<string>();
        }
    }

    public async Task<IReadOnlyList<string>> GetTagsAsync(string repositoryName, CancellationToken cancellationToken = default)
    {
        var registryBaseUrl = (_configuration["Registry:BaseUrl"] ?? "http://harbor:5000").TrimEnd('/');
        var normalizedRepository = NormalizeRepositoryName(repositoryName);
        var client = _httpClientFactory.CreateClient();

        var request = new HttpRequestMessage(HttpMethod.Get, $"{registryBaseUrl}/v2/{normalizedRepository}/tags/list");
        ApplyRegistryAuth(request);

        try
        {
            using var response = await client.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                return Array.Empty<string>();
            }

            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            using var document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
            if (document.RootElement.TryGetProperty("tags", out var tags) && tags.ValueKind == JsonValueKind.Array)
            {
                return tags
                    .EnumerateArray()
                    .Select(item => item.GetString())
                    .Where(tag => !string.IsNullOrWhiteSpace(tag))
                    .Cast<string>()
                    .ToList();
            }

            return Array.Empty<string>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching tags for {Repository}", repositoryName);
            throw new HttpRequestException($"Failed to fetch tags for {repositoryName}", ex);
        }
    }

    public async Task<JsonElement> GetManifestAsync(string repositoryName, string reference, CancellationToken cancellationToken = default)
    {
        var registryBaseUrl = (_configuration["Registry:BaseUrl"] ?? "http://harbor:5000").TrimEnd('/');
        var normalizedRepository = NormalizeRepositoryName(repositoryName);
        var client = _httpClientFactory.CreateClient();

        var request = new HttpRequestMessage(HttpMethod.Get, $"{registryBaseUrl}/v2/{normalizedRepository}/manifests/{reference}");
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/vnd.oci.image.manifest.v1+json"));
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/vnd.oci.image.index.v1+json"));
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/vnd.docker.distribution.manifest.v2+json"));
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/vnd.docker.distribution.manifest.list.v2+json"));
        ApplyRegistryAuth(request);

        try
        {
            using var response = await client.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync(cancellationToken);
                throw new HttpRequestException($"Registry manifest request failed ({(int)response.StatusCode}): {body}");
            }

            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            using var document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
            return document.RootElement.Clone();
        }
        catch (HttpRequestException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching manifest for {Repository}@{Reference}", repositoryName, reference);
            throw new HttpRequestException($"Failed to fetch manifest for {repositoryName}@{reference}", ex);
        }
    }

    private (string username, string password)? TryGetCachedCredentials(int userId)
    {
        var cacheKey = $"harbor_creds_{userId}";
        return _cache.TryGetValue(cacheKey, out (string username, string password) credentials)
            ? credentials
            : null;
    }

    private string NormalizeRepositoryName(string repositoryName)
    {
        var trimmed = repositoryName.Trim().Trim('/');
        if (trimmed.Contains('/'))
        {
            return trimmed;
        }

        var defaultProject = _configuration["Registry:DefaultProject"];
        return string.IsNullOrWhiteSpace(defaultProject)
            ? trimmed
            : $"{defaultProject}/{trimmed}";
    }

    private void ApplyRegistryAuth(HttpRequestMessage request)
    {
        var username = _configuration["Registry:Username"];
        var password = _configuration["Registry:Password"];
        if (!string.IsNullOrWhiteSpace(username) && !string.IsNullOrWhiteSpace(password))
        {
            var basicValue = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{username}:{password}"));
            request.Headers.Authorization = new AuthenticationHeaderValue("Basic", basicValue);
        }
    }

    private static string BuildHarborUsername(string username)
    {
        var sanitized = new string(username.Trim().ToLowerInvariant().Select(ch => char.IsLetterOrDigit(ch) || ch == '_' ? ch : '_').ToArray());
        return string.IsNullOrWhiteSpace(sanitized) ? "user" : sanitized;
    }

    private static string BuildHarborProjectName(string projectName)
    {
        var sanitized = new string(projectName.Trim().ToLowerInvariant().Select(ch => char.IsLetterOrDigit(ch) || ch == '_' || ch == '-' ? ch : '_').ToArray());
        return string.IsNullOrWhiteSpace(sanitized) ? "library" : sanitized;
    }

    private static string BuildHarborRepositoryName(string repositoryName)
    {
        var sanitized = new string(repositoryName.Trim().ToLowerInvariant().Select(ch => char.IsLetterOrDigit(ch) || ch == '_' || ch == '-' || ch == '.' ? ch : '-').ToArray());
        return string.IsNullOrWhiteSpace(sanitized) ? "repo" : sanitized;
    }

    private static HttpRequestMessage BuildAuthenticatedRequest(HttpMethod method, string url, string username, string password)
    {
        var request = new HttpRequestMessage(method, url);
        var basicAuth = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{username}:{password}"));
        request.Headers.Authorization = new AuthenticationHeaderValue("Basic", basicAuth);
        return request;
    }
}
