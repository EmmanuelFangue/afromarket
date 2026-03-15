using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace AfroMarket.MerchantService.Services;

/// <summary>
/// Calls the Keycloak Admin REST API to manage users and role assignments.
/// Credentials (AdminUsername / AdminPassword) come from appsettings KeycloakAdmin section.
/// </summary>
public class KeycloakAdminService : IKeycloakAdminService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<KeycloakAdminService> _logger;

    private string AdminRealm => _configuration["KeycloakAdmin:AdminRealm"] ?? "master";
    private string AppRealm   => _configuration["KeycloakAdmin:Realm"]      ?? "afromarket";
    private string ServerUrl  => _configuration["KeycloakAdmin:ServerUrl"]  ?? "http://localhost:8080";

    public KeycloakAdminService(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<KeycloakAdminService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
    }

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------

    public async Task<string> CreateUserAsync(
        string email,
        string password,
        string firstName,
        string lastName,
        string? realmRole,
        Dictionary<string, string>? attributes = null,
        CancellationToken cancellationToken = default)
    {
        var adminToken = await GetAdminTokenAsync(cancellationToken);

        var userId = await CreateKeycloakUserAsync(adminToken, email, firstName, lastName, attributes, cancellationToken);

        await SetPasswordAsync(adminToken, userId, password, cancellationToken);

        if (!string.IsNullOrWhiteSpace(realmRole))
        {
            await AssignRealmRoleAsync(adminToken, userId, realmRole, cancellationToken);
        }

        return userId;
    }

    public async Task SetUserEnabledAsync(string userId, bool enabled, CancellationToken cancellationToken = default)
    {
        var adminToken = await GetAdminTokenAsync(cancellationToken);

        var url = $"{ServerUrl}/admin/realms/{AppRealm}/users/{userId}";
        var payload = JsonSerializer.Serialize(new { enabled });

        var client = _httpClientFactory.CreateClient("KeycloakAdmin");
        var request = new HttpRequestMessage(HttpMethod.Put, url)
        {
            Content = new StringContent(payload, Encoding.UTF8, "application/json"),
            Headers = { Authorization = new AuthenticationHeaderValue("Bearer", adminToken) }
        };

        var response = await client.SendAsync(request, cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogError("Keycloak set-enabled={Enabled} failed for user {UserId}. Status: {Status}, Body: {Body}",
                enabled, userId, response.StatusCode, body);
            throw new KeycloakAdminException($"Failed to {(enabled ? "enable" : "disable")} user in identity provider.", (int)response.StatusCode);
        }
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    /// <summary>Obtains a short-lived admin token from the master realm using password grant.</summary>
    private async Task<string> GetAdminTokenAsync(CancellationToken cancellationToken)
    {
        var username = _configuration["KeycloakAdmin:AdminUsername"] ?? "admin";
        var password = _configuration["KeycloakAdmin:AdminPassword"]
            ?? throw new KeycloakAdminException("Keycloak admin password is not configured.", 500);

        var tokenUrl = $"{ServerUrl}/realms/{AdminRealm}/protocol/openid-connect/token";

        var body = new FormUrlEncodedContent(new[]
        {
            new KeyValuePair<string, string>("grant_type", "password"),
            new KeyValuePair<string, string>("client_id",  "admin-cli"),
            new KeyValuePair<string, string>("username",   username),
            new KeyValuePair<string, string>("password",   password),
        });

        var client = _httpClientFactory.CreateClient("KeycloakAdmin");
        var response = await client.PostAsync(tokenUrl, body, cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("Failed to obtain Keycloak admin token. Status: {Status}", response.StatusCode);
            throw new KeycloakAdminException("Identity provider unavailable.", (int)response.StatusCode);
        }

        var json = await response.Content.ReadAsStringAsync(cancellationToken);
        using var doc = JsonDocument.Parse(json);
        return doc.RootElement.GetProperty("access_token").GetString()
               ?? throw new KeycloakAdminException("Empty admin token received.", 502);
    }

    /// <summary>Creates the user in Keycloak and returns the new user UUID.</summary>
    private async Task<string> CreateKeycloakUserAsync(
        string adminToken,
        string email,
        string firstName,
        string lastName,
        Dictionary<string, string>? attributes,
        CancellationToken cancellationToken)
    {
        var url = $"{ServerUrl}/admin/realms/{AppRealm}/users";

        // Build optional attributes dict for Keycloak (values must be string arrays)
        object? keycloakAttributes = null;
        if (attributes is { Count: > 0 })
        {
            keycloakAttributes = attributes.ToDictionary(
                kvp => kvp.Key,
                kvp => new[] { kvp.Value });
        }

        var payload = JsonSerializer.Serialize(new
        {
            username      = email,
            email         = email,
            firstName     = firstName,
            lastName      = lastName,
            enabled       = true,
            emailVerified = false,
            attributes    = keycloakAttributes
        });

        var client = _httpClientFactory.CreateClient("KeycloakAdmin");
        var request = new HttpRequestMessage(HttpMethod.Post, url)
        {
            Content = new StringContent(payload, Encoding.UTF8, "application/json"),
            Headers = { Authorization = new AuthenticationHeaderValue("Bearer", adminToken) }
        };

        var response = await client.SendAsync(request, cancellationToken);

        if (response.StatusCode == HttpStatusCode.Conflict)
            throw new KeycloakUserExistsException();

        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogError("Keycloak user creation failed. Status: {Status}, Body: {Body}", response.StatusCode, body);
            throw new KeycloakAdminException("Failed to create user in identity provider.", (int)response.StatusCode);
        }

        // Keycloak returns the user URL in the Location header: .../users/{id}
        var location = response.Headers.Location?.ToString()
            ?? throw new KeycloakAdminException("Keycloak did not return user location.", 502);

        return location.Split('/').Last();
    }

    /// <summary>Sets a permanent (non-temporary) password for a Keycloak user.</summary>
    private async Task SetPasswordAsync(
        string adminToken,
        string userId,
        string password,
        CancellationToken cancellationToken)
    {
        var url = $"{ServerUrl}/admin/realms/{AppRealm}/users/{userId}/reset-password";

        var payload = JsonSerializer.Serialize(new
        {
            type      = "password",
            value     = password,
            temporary = false
        });

        var client = _httpClientFactory.CreateClient("KeycloakAdmin");
        var request = new HttpRequestMessage(HttpMethod.Put, url)
        {
            Content = new StringContent(payload, Encoding.UTF8, "application/json"),
            Headers = { Authorization = new AuthenticationHeaderValue("Bearer", adminToken) }
        };

        var response = await client.SendAsync(request, cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogError("Keycloak password set failed for user {UserId}. Status: {Status}, Body: {Body}",
                userId, response.StatusCode, body);
            throw new KeycloakAdminException("Failed to set user password.", (int)response.StatusCode);
        }
    }

    /// <summary>Fetches the realm role representation and assigns it to the user.</summary>
    private async Task AssignRealmRoleAsync(
        string adminToken,
        string userId,
        string roleName,
        CancellationToken cancellationToken)
    {
        // 1. Get role representation
        var roleUrl = $"{ServerUrl}/admin/realms/{AppRealm}/roles/{Uri.EscapeDataString(roleName)}";
        var client = _httpClientFactory.CreateClient("KeycloakAdmin");

        var roleRequest = new HttpRequestMessage(HttpMethod.Get, roleUrl)
        {
            Headers = { Authorization = new AuthenticationHeaderValue("Bearer", adminToken) }
        };
        var roleResponse = await client.SendAsync(roleRequest, cancellationToken);

        if (!roleResponse.IsSuccessStatusCode)
        {
            _logger.LogError("Keycloak role '{Role}' not found. Status: {Status}", roleName, roleResponse.StatusCode);
            throw new KeycloakAdminException($"Realm role '{roleName}' does not exist.", (int)roleResponse.StatusCode);
        }

        var roleJson = await roleResponse.Content.ReadAsStringAsync(cancellationToken);

        // 2. Assign role to user
        var assignUrl = $"{ServerUrl}/admin/realms/{AppRealm}/users/{userId}/role-mappings/realm";
        var assignPayload = $"[{roleJson}]"; // wrap existing role object in an array

        var assignRequest = new HttpRequestMessage(HttpMethod.Post, assignUrl)
        {
            Content = new StringContent(assignPayload, Encoding.UTF8, "application/json"),
            Headers = { Authorization = new AuthenticationHeaderValue("Bearer", adminToken) }
        };

        var assignResponse = await client.SendAsync(assignRequest, cancellationToken);

        if (!assignResponse.IsSuccessStatusCode)
        {
            var body = await assignResponse.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogError("Keycloak role assignment failed for user {UserId}, role {Role}. Status: {Status}, Body: {Body}",
                userId, roleName, assignResponse.StatusCode, body);
            throw new KeycloakAdminException("Failed to assign role to user.", (int)assignResponse.StatusCode);
        }
    }
}
