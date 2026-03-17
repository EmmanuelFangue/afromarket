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
    [ProducesResponseType(typeof(PaginatedResponse<ProductResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<PaginatedResponse<ProductResponse>>> GetMerchantProducts(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12,
        [FromQuery] ProductStatus? status = null,
        [FromQuery] string? q = null)
    {
        try
        {
            var merchantId = User.GetUserId();

            var business = await _context.Businesses
                .FirstOrDefaultAsync(b => b.OwnerId == merchantId);

            if (business == null)
            {
                return Ok(new PaginatedResponse<ProductResponse>
                {
                    Items = new List<ProductResponse>(),
                    TotalCount = 0,
                    Page = page,
                    PageSize = pageSize
                });
            }

            var result = await _productService.GetProductsByBusinessAsync(
                business.Id, page, pageSize, status, q);

            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized access on GetMerchantProducts");
            return Unauthorized(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving merchant products");
            return StatusCode(500, new { error = _localizer["Error.RetrieveProducts"].Value });
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
                return NotFound(new { error = _localizer["Error.ProductNotFound"].Value });
            }

            // Anonymous callers may only view Active products
            if (product.Status != ProductStatus.Active && !(User.Identity?.IsAuthenticated ?? false))
            {
                return NotFound(new { error = _localizer["Error.ProductNotFound"].Value });
            }

            // Anonymous callers may only view products from Published businesses
            if (!(User.Identity?.IsAuthenticated ?? false))
            {
                var businessStatus = await _context.Businesses
                    .Where(b => b.Id == product.BusinessId)
                    .Select(b => b.Status)
                    .FirstOrDefaultAsync();
                if (businessStatus != BusinessStatus.Published)
                {
                    return NotFound(new { error = _localizer["Error.ProductNotFound"].Value });
                }
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
        [FromQuery] ProductStatus? status = null,
        [FromQuery] string? sort = null)
    {
        try
        {
            if (businessId == Guid.Empty)
            {
                return BadRequest(new { error = "businessId parameter is required" });
            }

            // Anonymous callers may only see Active products
            var effectiveStatus = (User.Identity?.IsAuthenticated ?? false)
                ? status
                : ProductStatus.Active;

            var result = await _productService.GetProductsByBusinessAsync(businessId, page, pageSize, effectiveStatus, sort: sort);

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving products for business {BusinessId}", businessId);
            return StatusCode(500, new { error = _localizer["Error.RetrieveProducts"].Value });
        }
    }

    /// <summary>
    /// Upload d'images produit — retourne les URLs servies en statique
    /// </summary>
    [HttpPost("upload-images")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UploadImages([FromForm] IFormFileCollection images)
    {
        const int maxFiles = 10;
        const long maxFileSizeBytes = 5 * 1024 * 1024; // 5 MB
        var allowedTypes = new[] { "image/jpeg", "image/png", "image/webp" };
        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };

        if (images == null || images.Count == 0)
            return BadRequest(new { message = "Aucune image fournie." });

        if (images.Count > maxFiles)
            return BadRequest(new { message = $"Maximum {maxFiles} images par envoi." });

        foreach (var file in images)
        {
            if (file.Length > maxFileSizeBytes)
                return BadRequest(new { message = $"Le fichier \"{file.FileName}\" dépasse la limite de 5 MB." });

            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(ext) || !allowedTypes.Contains(file.ContentType.ToLowerInvariant()))
                return BadRequest(new { message = $"Type non supporté: \"{file.FileName}\". Formats acceptés: JPG, PNG, WEBP." });
        }

        try
        {
            var uploadDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "products");
            Directory.CreateDirectory(uploadDir);

            var imageUrls = new List<string>();
            var baseUrl = $"{Request.Scheme}://{Request.Host}";

            foreach (var file in images)
            {
                var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
                var fileName = $"{Guid.NewGuid()}{ext}";
                var filePath = Path.Combine(uploadDir, fileName);

                await using var stream = new FileStream(filePath, FileMode.Create);
                await file.CopyToAsync(stream);

                imageUrls.Add($"{baseUrl}/uploads/products/{fileName}");
            }

            _logger.LogInformation("Uploaded {Count} image(s) by merchant {MerchantId}", imageUrls.Count, User.GetUserId());

            return Ok(new { imageUrls });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading product images");
            return StatusCode(500, new { message = "Erreur lors de l'upload des images." });
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
                return NotFound(new { error = _localizer["Error.ProductNotFound"].Value });
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

    /// <summary>
    /// Returns all Active products across all businesses — used by SearchService for indexing.
    /// </summary>
    [HttpGet("published")]
    [ProducesResponseType(typeof(PaginatedResponse<ProductResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PaginatedResponse<ProductResponse>>> GetPublishedProducts(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 100)
    {
        try
        {
            var result = await _productService.GetAllActiveProductsAsync(page, pageSize);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving published products");
            return StatusCode(500, new { error = _localizer["Error.RetrieveProducts"].Value });
        }
    }

    /// <summary>
    /// Change le statut d'un produit (Draft→Active, Active→Suspended, Suspended→Active)
    /// </summary>
    [HttpPatch("{id}/status")]
    [Authorize]
    [ProducesResponseType(typeof(ProductResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProductResponse>> ChangeProductStatus(Guid id, [FromBody] ChangeStatusRequest request)
    {
        try
        {
            var ownerId = User.GetUserId();

            var product = await _productService.ChangeProductStatusAsync(id, request.Status, ownerId);

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
            _logger.LogWarning(ex, "Invalid status transition for product {ProductId}", id);
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error changing status of product {ProductId}", id);
            return StatusCode(500, new { error = _localizer["Error.ChangeStatus"].Value });
        }
    }
}
