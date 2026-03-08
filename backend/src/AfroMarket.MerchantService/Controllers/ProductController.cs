using AfroMarket.MerchantService.Models.DTOs;
using AfroMarket.MerchantService.Models.Enums;
using AfroMarket.MerchantService.Services;
using AfroMarket.MerchantService.Resources;
using AfroMarket.MerchantService.Extensions;
using AfroMarket.MerchantService.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Localization;
using Microsoft.EntityFrameworkCore;

namespace AfroMarket.MerchantService.Controllers;

[ApiController]
[Route("api/products")]
public class ProductController : ControllerBase
{
    private readonly IProductService _productService;
    private readonly MerchantDbContext _context;
    private readonly ILogger<ProductController> _logger;
    private readonly IStringLocalizer<SharedResources> _localizer;

    public ProductController(
        IProductService productService,
        MerchantDbContext context,
        ILogger<ProductController> logger,
        IStringLocalizer<SharedResources> localizer)
    {
        _productService = productService;
        _context = context;
        _logger = logger;
        _localizer = localizer;
    }

    /// <summary>
    /// Get all products for the authenticated merchant's business
    /// </summary>
    [HttpGet("merchant/products")]
    [Authorize]
    [ProducesResponseType(typeof(List<ProductResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<List<ProductResponse>>> GetMerchantProducts()
    {
        try
        {
            var merchantId = User.GetUserId();

            // Find the merchant's business
            var business = await _context.Businesses
                .FirstOrDefaultAsync(b => b.OwnerId == merchantId);

            if (business == null)
            {
                // Merchant doesn't have a business yet, return empty list
                return Ok(new List<ProductResponse>());
            }

            // Get products for the business
            var result = await _productService.GetProductsByBusinessAsync(business.Id, 1, 100);

            return Ok(result.Items);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized access on GetMerchantProducts");
            return Unauthorized(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving merchant products");
            return StatusCode(500, new { error = "Error retrieving products" });
        }
    }

    /// <summary>
    /// Crée un nouveau produit avec le statut Draft
    /// </summary>
    [HttpPost]
    [Authorize]
    [ProducesResponseType(typeof(ProductResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProductResponse>> CreateProduct([FromBody] CreateProductRequest request)
    {
        try
        {
            var ownerId = User.GetUserId();

            var product = await _productService.CreateProductAsync(request, ownerId);

            return CreatedAtAction(
                nameof(GetProductById),
                new { id = product.Id },
                product
            );
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Business not found while creating product");
            return NotFound(new { error = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized access while creating product");
            return Forbid();
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid argument while creating product");
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating product");
            return StatusCode(500, new { error = _localizer["Error.CreateProduct"].Value });
        }
    }

    /// <summary>
    /// Met à jour un produit existant (seulement si statut = Draft)
    /// </summary>
    [HttpPut("{id}")]
    [Authorize]
    [ProducesResponseType(typeof(ProductResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProductResponse>> UpdateProduct(Guid id, [FromBody] UpdateProductRequest request)
    {
        try
        {
            var ownerId = User.GetUserId();

            var product = await _productService.UpdateProductAsync(id, request, ownerId);

            return Ok(product);
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Product {ProductId} not found", id);
            return NotFound(new { error = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized access to product {ProductId}", id);
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid operation on product {ProductId}", id);
            return BadRequest(new { error = ex.Message });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid argument while updating product");
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating product {ProductId}", id);
            return StatusCode(500, new { error = _localizer["Error.UpdateProduct"].Value });
        }
    }

    /// <summary>
    /// Récupère un produit par son ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ProductResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProductResponse>> GetProductById(Guid id)
    {
        try
        {
            var product = await _productService.GetProductByIdAsync(id);

            if (product == null)
            {
                return NotFound(new { error = $"Product with ID {id} not found" });
            }

            return Ok(product);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving product {ProductId}", id);
            return StatusCode(500, new { error = _localizer["Error.RetrieveProduct"].Value });
        }
    }

    /// <summary>
    /// Récupère les produits d'un commerce avec pagination et filtres optionnels
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PaginatedResponse<ProductResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<PaginatedResponse<ProductResponse>>> GetProductsByBusiness(
        [FromQuery] Guid businessId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] ProductStatus? status = null)
    {
        try
        {
            if (businessId == Guid.Empty)
            {
                return BadRequest(new { error = "businessId parameter is required" });
            }

            var result = await _productService.GetProductsByBusinessAsync(businessId, page, pageSize, status);

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving products for business {BusinessId}", businessId);
            return StatusCode(500, new { error = _localizer["Error.RetrieveProducts"].Value });
        }
    }

    /// <summary>
    /// Supprime un produit (seulement si statut = Draft)
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteProduct(Guid id)
    {
        try
        {
            var ownerId = User.GetUserId();

            var result = await _productService.DeleteProductAsync(id, ownerId);

            if (!result)
            {
                return NotFound(new { error = $"Product with ID {id} not found" });
            }

            return NoContent();
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized access to product {ProductId}", id);
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid operation on product {ProductId}", id);
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting product {ProductId}", id);
            return StatusCode(500, new { error = _localizer["Error.DeleteProduct"].Value });
        }
    }
}
