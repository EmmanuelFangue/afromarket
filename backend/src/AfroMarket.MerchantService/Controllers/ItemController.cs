using AfroMarket.MerchantService.Models.DTOs;
using AfroMarket.MerchantService.Models.Enums;
using AfroMarket.MerchantService.Services;
using AfroMarket.MerchantService.Resources;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Localization;

namespace AfroMarket.MerchantService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ItemController : ControllerBase
{
    private readonly IItemService _itemService;
    private readonly ILogger<ItemController> _logger;
    private readonly IStringLocalizer<SharedResources> _localizer;

    public ItemController(
        IItemService itemService,
        ILogger<ItemController> logger,
        IStringLocalizer<SharedResources> localizer)
    {
        _itemService = itemService;
        _logger = logger;
        _localizer = localizer;
    }

    /// <summary>
    /// Crée un nouvel article/produit avec le statut Draft
    /// </summary>
    /// <param name="request">Les informations de l'article à créer</param>
    /// <returns>L'article créé</returns>
    [HttpPost]
    [ProducesResponseType(typeof(ItemResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ItemResponse>> CreateItem([FromBody] CreateItemRequest request)
    {
        try
        {
            // TODO: Récupérer le vrai OwnerId depuis le token JWT authentifié
            // Pour l'instant, on utilise un GUID temporaire pour les tests
            var ownerId = Guid.Parse("00000000-0000-0000-0000-000000000001");

            var item = await _itemService.CreateItemAsync(request, ownerId);

            return CreatedAtAction(
                nameof(GetItemById),
                new { id = item.Id },
                item
            );
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Business not found while creating item");
            return NotFound(new { error = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized access while creating item");
            return Forbid();
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid argument while creating item");
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating item");
            return StatusCode(500, new { error = _localizer["Error.CreateItem"].Value });
        }
    }

    /// <summary>
    /// Met à jour un article existant (seulement si statut = Draft)
    /// </summary>
    /// <param name="id">L'ID de l'article à mettre à jour</param>
    /// <param name="request">Les informations à mettre à jour</param>
    /// <returns>L'article mis à jour</returns>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(ItemResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ItemResponse>> UpdateItem(Guid id, [FromBody] UpdateItemRequest request)
    {
        try
        {
            // TODO: Récupérer le vrai OwnerId depuis le token JWT authentifié
            var ownerId = Guid.Parse("00000000-0000-0000-0000-000000000001");

            var item = await _itemService.UpdateItemAsync(id, request, ownerId);

            return Ok(item);
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Item {ItemId} not found", id);
            return NotFound(new { error = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized access to item {ItemId}", id);
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid operation on item {ItemId}", id);
            return BadRequest(new { error = ex.Message });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid argument while updating item");
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating item {ItemId}", id);
            return StatusCode(500, new { error = _localizer["Error.UpdateItem"].Value });
        }
    }

    /// <summary>
    /// Récupère un article par son ID
    /// </summary>
    /// <param name="id">L'ID de l'article</param>
    /// <returns>L'article demandé</returns>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ItemResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ItemResponse>> GetItemById(Guid id)
    {
        try
        {
            var item = await _itemService.GetItemByIdAsync(id);

            if (item == null)
            {
                return NotFound(new { error = $"Item with ID {id} not found" });
            }

            return Ok(item);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving item {ItemId}", id);
            return StatusCode(500, new { error = _localizer["Error.RetrieveItem"].Value });
        }
    }

    /// <summary>
    /// Récupère les articles d'un commerce avec pagination et filtres optionnels
    /// </summary>
    /// <param name="businessId">L'ID du commerce</param>
    /// <param name="page">Numéro de page (défaut: 1)</param>
    /// <param name="pageSize">Taille de page (défaut: 20, max: 100)</param>
    /// <param name="status">Filtre optionnel par statut (Draft, Active, Suspended)</param>
    /// <returns>Liste paginée des articles du commerce</returns>
    [HttpGet]
    [ProducesResponseType(typeof(PaginatedResponse<ItemResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<PaginatedResponse<ItemResponse>>> GetItemsByBusiness(
        [FromQuery] Guid businessId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] ItemStatus? status = null)
    {
        try
        {
            if (businessId == Guid.Empty)
            {
                return BadRequest(new { error = "businessId parameter is required" });
            }

            var result = await _itemService.GetItemsByBusinessAsync(businessId, page, pageSize, status);

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving items for business {BusinessId}", businessId);
            return StatusCode(500, new { error = _localizer["Error.RetrieveItems"].Value });
        }
    }

    /// <summary>
    /// Supprime un article (seulement si statut = Draft)
    /// </summary>
    /// <param name="id">L'ID de l'article à supprimer</param>
    /// <returns>204 No Content si succès</returns>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteItem(Guid id)
    {
        try
        {
            // TODO: Récupérer le vrai OwnerId depuis le token JWT authentifié
            var ownerId = Guid.Parse("00000000-0000-0000-0000-000000000001");

            var result = await _itemService.DeleteItemAsync(id, ownerId);

            if (!result)
            {
                return NotFound(new { error = $"Item with ID {id} not found" });
            }

            return NoContent();
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized access to item {ItemId}", id);
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid operation on item {ItemId}", id);
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting item {ItemId}", id);
            return StatusCode(500, new { error = _localizer["Error.DeleteItem"].Value });
        }
    }
}
