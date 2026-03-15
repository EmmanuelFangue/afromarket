using AfroMarket.MerchantService.Models.DTOs;
using AfroMarket.MerchantService.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AfroMarket.MerchantService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private static readonly HashSet<string> AllowedRoles = new(StringComparer.OrdinalIgnoreCase) { "user", "merchant" };

    private readonly IKeycloakAdminService _keycloakAdmin;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IKeycloakAdminService keycloakAdmin, ILogger<AuthController> logger)
    {
        _keycloakAdmin = keycloakAdmin;
        _logger = logger;
    }

    // -------------------------------------------------------------------------
    // POST /api/auth/register
    // -------------------------------------------------------------------------

    /// <summary>
    /// Registers a new user (role: user | merchant).
    /// Admin role cannot be granted at signup — returns 403.
    /// </summary>
    [HttpPost("register")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(RegisterResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status502BadGateway)]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request, CancellationToken cancellationToken)
    {
        // 0) Forbid admin role at signup
        if (string.Equals(request.Role, "admin", StringComparison.OrdinalIgnoreCase))
        {
            return StatusCode(StatusCodes.Status403Forbidden, new
            {
                error = "FORBIDDEN_ROLE",
                message = "Admin role cannot be granted at signup. Please request promotion via Admin dashboard."
            });
        }

        // 1) Validate role value
        if (!AllowedRoles.Contains(request.Role))
        {
            return BadRequest(new
            {
                error = "VALIDATION_ERROR",
                details = new { role = "Allowed values: user | merchant" }
            });
        }

        // 2) Validate password strength
        var passwordErrors = request.ValidatePassword().ToList();
        if (passwordErrors.Count > 0)
        {
            return BadRequest(new
            {
                error = "VALIDATION_ERROR",
                details = new { password = passwordErrors[0].ErrorMessage }
            });
        }

        // 3) Regular users get no extra custom realm role (only Keycloak defaults).
        //    Merchants get the "merchant" realm role.
        var realmRole = string.Equals(request.Role, "merchant", StringComparison.OrdinalIgnoreCase)
            ? "merchant"
            : null;

        try
        {
            var userId = await _keycloakAdmin.CreateUserAsync(
                email: request.Email.Trim().ToLowerInvariant(),
                password: request.Password,
                firstName: request.FirstName.Trim(),
                lastName: request.LastName.Trim(),
                realmRole: realmRole,
                attributes: request.Attributes,
                cancellationToken: cancellationToken);

            _logger.LogInformation("User registered successfully. Id={UserId} Role={Role}", userId, request.Role);

            return StatusCode(StatusCodes.Status201Created, new RegisterResponse
            {
                Id     = userId,
                Email  = request.Email.Trim().ToLowerInvariant(),
                Role   = request.Role.ToLowerInvariant(),
                Status = "created"
            });
        }
        catch (KeycloakUserExistsException)
        {
            return Conflict(new
            {
                error   = "USER_EXISTS",
                message = "An account with this email already exists."
            });
        }
        catch (KeycloakAdminException ex)
        {
            _logger.LogError("Registration failed for {Email}. StatusCode={Code} Message={Msg}",
                request.Email, ex.StatusCode, ex.Message);
            return StatusCode(StatusCodes.Status502BadGateway, new
            {
                error   = "UPSTREAM_ERROR",
                message = "Identity provider unavailable. Please try again later."
            });
        }
    }

    // -------------------------------------------------------------------------
    // GET /api/auth/me
    // -------------------------------------------------------------------------

    /// <summary>
    /// Returns current user info and triggers user sync to the database.
    /// </summary>
    [HttpGet("me")]
    [Authorize]
    public IActionResult GetCurrentUser()
    {
        var syncedUser = HttpContext.Items["SyncedUser"];

        if (syncedUser == null)
        {
            return Ok(new
            {
                id      = User.FindFirst("sub")?.Value,
                email   = User.FindFirst("email")?.Value,
                name    = User.FindFirst("name")?.Value,
                synced  = false,
                message = "User authenticated but not yet synced to database"
            });
        }

        var user = (AfroMarket.MerchantService.Models.Entities.User)syncedUser;

        return Ok(new
        {
            id          = user.Id,
            email       = user.Email,
            firstName   = user.FirstName,
            lastName    = user.LastName,
            role        = user.Role.ToString(),
            lastLoginAt = user.LastLoginAt,
            synced      = true
        });
    }
}
