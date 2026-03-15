using AfroMarket.MerchantService.Data;
using AfroMarket.MerchantService.Models.DTOs;
using AfroMarket.MerchantService.Models.Enums;
using AfroMarket.MerchantService.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AfroMarket.MerchantService.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Policy = "AdminOnly")]
public class AdminController : ControllerBase
{
    private readonly MerchantDbContext _context;
    private readonly IKeycloakAdminService _keycloakAdmin;
    private readonly ILogger<AdminController> _logger;

    public AdminController(
        MerchantDbContext context,
        IKeycloakAdminService keycloakAdmin,
        ILogger<AdminController> logger)
    {
        _context = context;
        _keycloakAdmin = keycloakAdmin;
        _logger = logger;
    }

    /// <summary>
    /// Returns a paginated, filtered, sorted list of all users.
    /// </summary>
    [HttpGet("users")]
    [ProducesResponseType(typeof(PaginatedResponse<AdminUserResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PaginatedResponse<AdminUserResponse>>> GetUsers(
        [FromQuery] string? search = null,
        [FromQuery] UserRole? role = null,
        [FromQuery] bool? isEnabled = null,
        [FromQuery] string sort = "created_desc",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        pageSize = Math.Clamp(pageSize, 1, 100);
        page = Math.Max(page, 1);

        var query = _context.Users.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(u =>
                u.Email.ToLower().Contains(term) ||
                u.FirstName.ToLower().Contains(term) ||
                u.LastName.ToLower().Contains(term) ||
                (u.PreferredUsername != null && u.PreferredUsername.ToLower().Contains(term)));
        }

        if (role.HasValue)
            query = query.Where(u => u.Role == role.Value);

        if (isEnabled.HasValue)
            query = query.Where(u => u.IsEnabled == isEnabled.Value);

        query = sort switch
        {
            "email_asc"    => query.OrderBy(u => u.Email),
            "email_desc"   => query.OrderByDescending(u => u.Email),
            "name_asc"     => query.OrderBy(u => u.LastName).ThenBy(u => u.FirstName),
            "name_desc"    => query.OrderByDescending(u => u.LastName).ThenByDescending(u => u.FirstName),
            "created_asc"  => query.OrderBy(u => u.CreatedAt),
            _              => query.OrderByDescending(u => u.CreatedAt), // created_desc
        };

        var totalCount = await query.CountAsync();

        var users = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new AdminUserResponse
            {
                Id = u.Id,
                Email = u.Email,
                FirstName = u.FirstName,
                LastName = u.LastName,
                PreferredUsername = u.PreferredUsername,
                Role = u.Role,
                IsEnabled = u.IsEnabled,
                CreatedAt = u.CreatedAt,
                UpdatedAt = u.UpdatedAt,
                LastLoginAt = u.LastLoginAt,
                BusinessCount = u.Businesses.Count,
            })
            .ToListAsync();

        return Ok(new PaginatedResponse<AdminUserResponse>
        {
            Items = users,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
        });
    }

    /// <summary>
    /// Enables a user in Keycloak and updates the local DB record.
    /// </summary>
    [HttpPost("users/{id}/enable")]
    [ProducesResponseType(typeof(AdminUserResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AdminUserResponse>> EnableUser(Guid id)
    {
        return await SetUserEnabled(id, enabled: true);
    }

    /// <summary>
    /// Disables a user in Keycloak and updates the local DB record.
    /// </summary>
    [HttpPost("users/{id}/disable")]
    [ProducesResponseType(typeof(AdminUserResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AdminUserResponse>> DisableUser(Guid id)
    {
        return await SetUserEnabled(id, enabled: false);
    }

    // -------------------------------------------------------------------------

    private async Task<ActionResult<AdminUserResponse>> SetUserEnabled(Guid id, bool enabled)
    {
        var user = await _context.Users
            .Include(u => u.Businesses)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null)
            return NotFound(new { error = $"User {id} not found." });

        try
        {
            await _keycloakAdmin.SetUserEnabledAsync(id.ToString(), enabled);
        }
        catch (KeycloakAdminException ex)
        {
            _logger.LogError(ex, "Keycloak call failed while setting user {UserId} enabled={Enabled}", id, enabled);
            return StatusCode(502, new { error = ex.Message });
        }

        user.IsEnabled = enabled;
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("User {UserId} {Action} by admin", id, enabled ? "enabled" : "disabled");

        return Ok(new AdminUserResponse
        {
            Id = user.Id,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            PreferredUsername = user.PreferredUsername,
            Role = user.Role,
            IsEnabled = user.IsEnabled,
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt,
            LastLoginAt = user.LastLoginAt,
            BusinessCount = user.Businesses.Count,
        });
    }
}
