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

        // Check if user already exists -- by Keycloak ID first
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
        {
            // Not found by Keycloak ID -- check if a record exists with the same email but a different (seeded) ID
            var userByEmail = await _context.Users.FirstOrDefaultAsync(u => u.Email == emailClaim.Value);
            if (userByEmail != null)
            {
                // DB was seeded with a placeholder ID that differs from the real Keycloak sub.
                // Migrate: disable FK, update PK, update FK references, re-enable FK.
                _logger.LogWarning(
                    "User {Email} found in DB with placeholder ID {OldId} -- Keycloak ID is {NewId}. Migrating...",
                    emailClaim.Value, userByEmail.Id, userId);

                var oldId = userByEmail.Id;

                // Disable FK constraint to allow PK update without violating referential integrity
                await _context.Database.ExecuteSqlRawAsync(
                    "ALTER TABLE dbo.Businesses NOCHECK CONSTRAINT FK_Businesses_Users_OwnerId");
                // Update the PK first
                await _context.Database.ExecuteSqlInterpolatedAsync(
                    $"UPDATE Users SET Id = {userId} WHERE Id = {oldId}");
                // Update all child FK references
                await _context.Database.ExecuteSqlInterpolatedAsync(
                    $"UPDATE Businesses SET OwnerId = {userId} WHERE OwnerId = {oldId}");
                // Re-enable and validate the FK constraint
                await _context.Database.ExecuteSqlRawAsync(
                    "ALTER TABLE dbo.Businesses WITH CHECK CHECK CONSTRAINT FK_Businesses_Users_OwnerId");

                _context.Entry(userByEmail).State = EntityState.Detached;
                user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);

                _logger.LogInformation(
                    "Migration complete -- User {Email} ID updated to {NewId}", emailClaim.Value, userId);
            }
        }

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
                IsEnabled = true,
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
            if (user.Email != emailClaim.Value) user.Email = emailClaim.Value;

            var newFirstName = firstNameClaim?.Value ?? "";
            if (user.FirstName != newFirstName) user.FirstName = newFirstName;

            var newLastName = lastNameClaim?.Value ?? "";
            if (user.LastName != newLastName) user.LastName = newLastName;

            var newPreferredUsername = preferredUsernameClaim?.Value;
            if (user.PreferredUsername != newPreferredUsername) user.PreferredUsername = newPreferredUsername;

            var newRole = DetermineUserRole(claimsPrincipal);
            if (user.Role != newRole)
            {
                user.Role = newRole;
                _logger.LogInformation("User {Email} role updated to {Role}", user.Email, newRole);
            }

            user.LastLoginAt = DateTime.UtcNow;
            user.UpdatedAt = DateTime.UtcNow;
            user.IsEnabled = true;

            await _context.SaveChangesAsync();
        }

        return user;
    }

    private UserRole DetermineUserRole(ClaimsPrincipal claimsPrincipal)
    {
        var roles = claimsPrincipal.FindAll("realm_access.roles").Select(c => c.Value).ToList();
        var directRoles = claimsPrincipal.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();
        var allRoles = roles.Concat(directRoles).Select(r => r.ToLowerInvariant()).ToList();

        if (allRoles.Contains("admin"))   return UserRole.Admin;
        if (allRoles.Contains("merchant")) return UserRole.Merchant;

        return UserRole.Merchant;
    }
}