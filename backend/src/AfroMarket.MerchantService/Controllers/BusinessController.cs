using AfroMarket.MerchantService.Models.DTOs;
using AfroMarket.MerchantService.Services;
using AfroMarket.MerchantService.Extensions;
using AfroMarket.MerchantService.Resources;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Localization;

namespace AfroMarket.MerchantService.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "MerchantOnly")]
public class BusinessController : ControllerBase
{
    private readonly IBusinessService _businessService;
    private readonly ILogger<BusinessController> _logger;
    private readonly IStringLocalizer<SharedResources> _localizer;

    public BusinessController(
        IBusinessService businessService,
        ILogger<BusinessController> logger,
        IStringLocalizer<SharedResources> localizer)
    {
        _businessService = businessService;
        _logger = logger;
        _localizer = localizer;
    }

    /// <summary>
    /// Crée un nouveau commerce avec le statut Draft
    /// </summary>
    /// <param name="request">Les informations du commerce à créer</param>
    /// <returns>Le commerce créé</returns>
    [HttpPost]
    [ProducesResponseType(typeof(BusinessResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<BusinessResponse>> CreateBusiness([FromBody] CreateBusinessRequest request)
    {
        try
        {
            var ownerId = User.GetUserId();
            _logger.LogInformation("Creating business for owner {OwnerId}", ownerId);

            var business = await _businessService.CreateBusinessAsync(request, ownerId);

            return CreatedAtAction(
                nameof(GetBusinessById),
                new { id = business.Id },
                business
            );
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid argument while creating business");
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating business");
            return StatusCode(500, new { error = _localizer["Error.CreateBusiness"].Value });
        }
    }

    /// <summary>
    /// Met à jour un commerce existant (seulement si statut = Draft)
    /// </summary>
    /// <param name="id">L'ID du commerce à mettre à jour</param>
    /// <param name="request">Les informations à mettre à jour</param>
    /// <returns>Le commerce mis à jour</returns>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(BusinessResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<BusinessResponse>> UpdateBusiness(Guid id, [FromBody] UpdateBusinessRequest request)
    {
        try
        {
            var ownerId = User.GetUserId();

            var business = await _businessService.UpdateBusinessAsync(id, request, ownerId);

            return Ok(business);
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Business {BusinessId} not found", id);
            return NotFound(new { error = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized access to business {BusinessId}", id);
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid operation on business {BusinessId}", id);
            return BadRequest(new { error = ex.Message });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid argument while updating business");
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating business {BusinessId}", id);
            return StatusCode(500, new { error = _localizer["Error.UpdateBusiness"].Value });
        }
    }

    /// <summary>
    /// Récupère un commerce par son ID
    /// </summary>
    /// <param name="id">L'ID du commerce</param>
    /// <returns>Le commerce demandé</returns>
    [HttpGet("{id}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(BusinessResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<BusinessResponse>> GetBusinessById(Guid id)
    {
        try
        {
            var business = await _businessService.GetBusinessByIdAsync(id);

            if (business == null)
            {
                return NotFound(new { error = $"Business with ID {id} not found" });
            }

            return Ok(business);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving business {BusinessId}", id);
            return StatusCode(500, new { error = _localizer["Error.RetrieveBusiness"].Value });
        }
    }

    /// <summary>
    /// Récupère tous les commerces du propriétaire connecté
    /// </summary>
    /// <returns>La liste des commerces du propriétaire</returns>
    [HttpGet("my-businesses")]
    [ProducesResponseType(typeof(List<BusinessResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<List<BusinessResponse>>> GetMyBusinesses()
    {
        try
        {
            var ownerId = User.GetUserId();

            var businesses = await _businessService.GetBusinessesByOwnerAsync(ownerId);

            return Ok(businesses);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving businesses");
            return StatusCode(500, new { error = _localizer["Error.RetrieveBusiness"].Value });
        }
    }

    /// <summary>
    /// Supprime un commerce (seulement si statut = Draft)
    /// </summary>
    /// <param name="id">L'ID du commerce à supprimer</param>
    /// <returns>204 No Content si succès</returns>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> DeleteBusiness(Guid id)
    {
        try
        {
            var ownerId = User.GetUserId();

            var result = await _businessService.DeleteBusinessAsync(id, ownerId);

            if (!result)
            {
                return NotFound(new { error = $"Business with ID {id} not found" });
            }

            return NoContent();
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized access to business {BusinessId}", id);
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid operation on business {BusinessId}", id);
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting business {BusinessId}", id);
            return StatusCode(500, new { error = _localizer["Error.DeleteBusiness"].Value });
        }
    }

    /// <summary>
    /// Récupère tous les commerces publiés avec pagination
    /// </summary>
    /// <param name="page">Numéro de la page (défaut: 1)</param>
    /// <param name="pageSize">Taille de la page (défaut: 20, max: 100)</param>
    /// <returns>Liste paginée des commerces publiés</returns>
    [HttpGet("published")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(PaginatedResult<BusinessResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<PaginatedResult<BusinessResponse>>> GetPublishedBusinesses(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var result = await _businessService.GetPublishedBusinessesAsync(page, pageSize);
            return Ok(result);
        }
        catch (Exception ex)
        {
            var correlationId = Guid.NewGuid();
            _logger.LogError(ex, "Error retrieving published businesses. CorrelationId: {CorrelationId}", correlationId);
            return StatusCode(500, new { error = _localizer["Error.RetrieveBusiness"].Value, correlationId });
        }
    }
}
