using AfroMarket.MerchantService.Data;
using AfroMarket.MerchantService.Models.Entities;
using AfroMarket.MerchantService.Models.Enums;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace AfroMarket.MerchantService.Services;

public interface IUserSyncService
{
    Task<User> SyncUserFromClaimsAsync(ClaimsPrincipal claimsPrincipal);
}

public class UserSyncService : IUserSyncService
{
    private readonly MerchantDbContext _context;
    private readonly ILogger<UserSyncService> _logger;

    public UserSyncService(MerchantDbContext context, ILogger<UserSyncService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<User> SyncUserFromClaimsAsync(ClaimsPrincipal claimsPrincipal)
    {
        // Extract claims from JWT
        var userIdClaim = claimsPrincipal.FindFirst(ClaimTypes.NameIdentifier)
                          ?? claimsPrincipal.FindFirst("sub");
        var emailClaim = claimsPrincipal.FindFirst(ClaimTypes.Email)
                         ?? claimsPrincipal.FindFirst("email");
        var firstNameClaim = claimsPrincipal.FindFirst(ClaimTypes.GivenName)
                             ?? claimsPrincipal.FindFirst("given_name");
        var lastNameClaim = claimsPrincipal.FindFirst(ClaimTypes.Surname)
                            ?? claimsPrincipal.FindFirst("family_name");
        var preferredUsernameClaim = claimsPrincipal.FindFirst("preferred_username");

        if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
        {
            _logger.LogError("User ID (sub) claim not found or invalid in JWT");
            throw new InvalidOperationException("Invalid user ID in token");
        }

        if (emailClaim == null)
        {
            _logger.LogError("Email claim not found in JWT for user {UserId}", userId);
            throw new InvalidOperationException("Email not found in token");
        }

        // Check if user already exists
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
        {
            // Create new user
            _logger.LogInformation("Creating new user from Keycloak: {Email} (ID: {UserId})",
                emailClaim.Value, userId);

            user = new User
            {
                Id = userId,
                Email = emailClaim.Value,
                FirstName = firstNameClaim?.Value ?? "",
                LastName = lastNameClaim?.Value ?? "",
                PreferredUsername = preferredUsernameClaim?.Value,
                Role = DetermineUserRole(claimsPrincipal),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                LastLoginAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            _logger.LogInformation("User {Email} created successfully in database", emailClaim.Value);
        }
        else
        {
            // Update existing user info (email, name might have changed in Keycloak)
            var hasChanges = false;

            if (user.Email != emailClaim.Value)
            {
                user.Email = emailClaim.Value;
                hasChanges = true;
            }

            var newFirstName = firstNameClaim?.Value ?? "";
            if (user.FirstName != newFirstName)
            {
                user.FirstName = newFirstName;
                hasChanges = true;
            }

            var newLastName = lastNameClaim?.Value ?? "";
            if (user.LastName != newLastName)
            {
                user.LastName = newLastName;
                hasChanges = true;
            }

            var newPreferredUsername = preferredUsernameClaim?.Value;
            if (user.PreferredUsername != newPreferredUsername)
            {
                user.PreferredUsername = newPreferredUsername;
                hasChanges = true;
            }

            var newRole = DetermineUserRole(claimsPrincipal);
            if (user.Role != newRole)
            {
                user.Role = newRole;
                hasChanges = true;
                _logger.LogInformation("User {Email} role updated to {Role}", user.Email, newRole);
            }

            // Always update LastLoginAt
            user.LastLoginAt = DateTime.UtcNow;
            user.UpdatedAt = DateTime.UtcNow;

            if (hasChanges)
            {
                await _context.SaveChangesAsync();
                _logger.LogInformation("User {Email} updated in database", user.Email);
            }
            else
            {
                // Just update LastLoginAt without triggering change detection
                await _context.SaveChangesAsync();
            }
        }

        return user;
    }

    private UserRole DetermineUserRole(ClaimsPrincipal claimsPrincipal)
    {
        // Check realm_access.roles from Keycloak
        var roles = claimsPrincipal.FindAll("realm_access.roles")
            .Select(c => c.Value)
            .ToList();

        // Also check direct role claims
        var directRoles = claimsPrincipal.FindAll(ClaimTypes.Role)
            .Select(c => c.Value)
            .ToList();

        var allRoles = roles.Concat(directRoles).Select(r => r.ToLowerInvariant()).ToList();

        if (allRoles.Contains("admin"))
        {
            return UserRole.Admin;
        }

        if (allRoles.Contains("merchant"))
        {
            return UserRole.Merchant;
        }

        // Default to merchant role
        return UserRole.Merchant;
    }
}
