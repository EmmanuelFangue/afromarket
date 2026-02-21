using System.Security.Claims;

namespace AfroMarket.MerchantService.Extensions;

public static class UserClaimsExtensions
{
    public static Guid GetUserId(this ClaimsPrincipal user)
    {
        var userIdClaim = user.FindFirst("sub")
            ?? user.FindFirst("user_id")
            ?? user.FindFirst(ClaimTypes.NameIdentifier);

        if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
        {
            throw new UnauthorizedAccessException("User ID not found in token claims");
        }

        return userId;
    }

    public static string GetUserEmail(this ClaimsPrincipal user)
    {
        var emailClaim = user.FindFirst("email")
            ?? user.FindFirst(ClaimTypes.Email);

        return emailClaim?.Value ?? throw new UnauthorizedAccessException("Email not found in token claims");
    }

    public static bool HasRole(this ClaimsPrincipal user, string role)
    {
        return user.IsInRole(role);
    }
}
