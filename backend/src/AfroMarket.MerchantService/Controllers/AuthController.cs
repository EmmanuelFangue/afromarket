using AfroMarket.MerchantService.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AfroMarket.MerchantService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly ILogger<AuthController> _logger;

    public AuthController(ILogger<AuthController> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Endpoint to get current user info and trigger user sync
    /// This forces the UserSyncMiddleware to run and sync the user to the database
    /// </summary>
    [HttpGet("me")]
    [Authorize]
    public IActionResult GetCurrentUser()
    {
        // The UserSyncMiddleware has already synced the user to the database
        // We can retrieve it from HttpContext.Items
        var syncedUser = HttpContext.Items["SyncedUser"];

        if (syncedUser == null)
        {
            return Ok(new
            {
                id = User.FindFirst("sub")?.Value,
                email = User.FindFirst("email")?.Value,
                name = User.FindFirst("name")?.Value,
                synced = false,
                message = "User authenticated but not yet synced to database"
            });
        }

        var user = (AfroMarket.MerchantService.Models.Entities.User)syncedUser;

        return Ok(new
        {
            id = user.Id,
            email = user.Email,
            firstName = user.FirstName,
            lastName = user.LastName,
            role = user.Role.ToString(),
            lastLoginAt = user.LastLoginAt,
            synced = true
        });
    }
}
