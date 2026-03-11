using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication;

namespace AfroMarket.MerchantService.Services;

/// <summary>
/// Maps Keycloak realm roles from the JWT (stored as "realm_access.roles" claims)
/// to standard ASP.NET Core ClaimTypes.Role claims so that [Authorize(Roles = "merchant")]
/// and policy.RequireRole("merchant") work correctly.
/// </summary>
public class KeycloakRoleClaimsTransformer : IClaimsTransformation
{
    public Task<ClaimsPrincipal> TransformAsync(ClaimsPrincipal principal)
    {
        if (principal.Identity is not ClaimsIdentity identity || !identity.IsAuthenticated)
            return Task.FromResult(principal);

        // The JWT middleware parses the nested realm_access.roles array into individual
        // claims with type "realm_access.roles". Copy each one to ClaimTypes.Role so that
        // ASP.NET Core authorization policies using RequireRole() work correctly.
        var realmRoles = principal
            .FindAll("realm_access.roles")
            .Select(c => c.Value)
            .ToList();

        // Fallback: if claims are not flattened, read from the raw "realm_access" JSON claim.
        if (realmRoles.Count == 0)
        {
            var realmAccessClaim = principal.FindFirst("realm_access");
            if (realmAccessClaim is not null)
            {
                try
                {
                    using var doc = JsonDocument.Parse(realmAccessClaim.Value);
                    if (doc.RootElement.TryGetProperty("roles", out var roles))
                    {
                        realmRoles = roles
                            .EnumerateArray()
                            .Select(r => r.GetString())
                            .Where(r => r is not null)
                            .ToList()!;
                    }
                }
                catch (JsonException)
                {
                    // Ignore malformed claim; authorization will simply fail.
                }
            }
        }

        foreach (var role in realmRoles)
        {
            if (!principal.HasClaim(ClaimTypes.Role, role))
                identity.AddClaim(new Claim(ClaimTypes.Role, role));
        }

        return Task.FromResult(principal);
    }
}
