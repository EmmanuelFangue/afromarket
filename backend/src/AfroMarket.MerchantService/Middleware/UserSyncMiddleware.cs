using AfroMarket.MerchantService.Services;

namespace AfroMarket.MerchantService.Middleware;

public class UserSyncMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<UserSyncMiddleware> _logger;

    public UserSyncMiddleware(RequestDelegate next, ILogger<UserSyncMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, IUserSyncService userSyncService)
    {
        // Only sync if user is authenticated
        if (context.User?.Identity?.IsAuthenticated == true)
        {
            try
            {
                // Check if we've already synced this user in this request
                if (!context.Items.ContainsKey("UserSynced"))
                {
                    var user = await userSyncService.SyncUserFromClaimsAsync(context.User);

                    // Store synced user in HttpContext for this request
                    context.Items["SyncedUser"] = user;
                    context.Items["UserSynced"] = true;

                    _logger.LogDebug("User {Email} synced for request {Path}",
                        user.Email, context.Request.Path);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to sync user from claims");
                // Continue with request even if sync fails
                // The app can still work with JWT claims
            }
        }

        await _next(context);
    }
}

public static class UserSyncMiddlewareExtensions
{
    public static IApplicationBuilder UseUserSync(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<UserSyncMiddleware>();
    }
}
