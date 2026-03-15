namespace AfroMarket.MerchantService.Services;

public interface IKeycloakAdminService
{
    /// <summary>
    /// Creates a new user in Keycloak, sets their password, and assigns an initial realm role.
    /// </summary>
    /// <param name="email">User email (also used as username)</param>
    /// <param name="password">Plain-text password (not logged)</param>
    /// <param name="firstName">First name</param>
    /// <param name="lastName">Last name</param>
    /// <param name="realmRole">Realm role to assign ("merchant"). Null = no custom role (regular user).</param>
    /// <param name="attributes">Optional user attributes to store in Keycloak (e.g. phone)</param>
    /// <returns>The Keycloak user ID (UUID)</returns>
    /// <exception cref="KeycloakUserExistsException">Thrown when email is already registered</exception>
    /// <exception cref="KeycloakAdminException">Thrown on unexpected Keycloak errors</exception>
    Task<string> CreateUserAsync(
        string email,
        string password,
        string firstName,
        string lastName,
        string? realmRole,
        Dictionary<string, string>? attributes = null,
        CancellationToken cancellationToken = default);
}

public class KeycloakUserExistsException : Exception
{
    public KeycloakUserExistsException() : base("A user with this email already exists.") { }
}

public class KeycloakAdminException : Exception
{
    public int StatusCode { get; }
    public KeycloakAdminException(string message, int statusCode) : base(message)
    {
        StatusCode = statusCode;
    }
}
