using AfroMarket.MerchantService.Data;
using AfroMarket.MerchantService.Models.DTOs;
using AfroMarket.MerchantService.Models.Entities;
using AfroMarket.MerchantService.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AfroMarket.MerchantService.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProductsController : ControllerBase
{
    private readonly MerchantDbContext _context;
    private readonly IImageUploadService _imageUploadService;
    private readonly ILogger<ProductsController> _logger;

    public ProductsController(
        MerchantDbContext context,
        IImageUploadService imageUploadService,
        ILogger<ProductsController> logger)
    {
        _context = context;
        _imageUploadService = imageUploadService;
        _logger = logger;
    }

    /// <summary>
    /// Get all products for the authenticated merchant
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<ProductResponseDto>>> GetProducts()
    {
        var userId = User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var merchantId))
        {
            return Unauthorized(new { message = "Invalid user ID" });
        }

        var products = await _context.Products
            .Include(p => p.Images)
            .Where(p => p.MerchantId == merchantId)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        var response = products.Select(p => MapToDto(p)).ToList();
        return Ok(response);
    }

    /// <summary>
    /// Get a single product by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<ProductResponseDto>> GetProduct(Guid id)
    {
        var userId = User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var merchantId))
        {
            return Unauthorized(new { message = "Invalid user ID" });
        }

        var product = await _context.Products
            .Include(p => p.Images)
            .FirstOrDefaultAsync(p => p.Id == id && p.MerchantId == merchantId);

        if (product == null)
        {
            return NotFound(new { message = "Product not found" });
        }

        return Ok(MapToDto(product));
    }

    /// <summary>
    /// Create a new product
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ProductResponseDto>> CreateProduct([FromBody] CreateProductDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var userId = User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var merchantId))
        {
            return Unauthorized(new { message = "Invalid user ID" });
        }

        // Validate image count (max 10)
        if (dto.ImageUrls.Count > 10)
        {
            return BadRequest(new { message = "Maximum 10 images allowed per product" });
        }

        var product = new Product
        {
            Name = dto.Name,
            Description = dto.Description,
            Price = dto.Price,
            Category = dto.Category,
            MerchantId = merchantId,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        // Add images
        for (int i = 0; i < dto.ImageUrls.Count; i++)
        {
            product.Images.Add(new ProductImage
            {
                ImageUrl = dto.ImageUrls[i],
                Order = i,
                CreatedAt = DateTime.UtcNow
            });
        }

        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Product {ProductId} created by merchant {MerchantId}", product.Id, merchantId);

        return CreatedAtAction(nameof(GetProduct), new { id = product.Id }, MapToDto(product));
    }

    /// <summary>
    /// Update an existing product
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<ProductResponseDto>> UpdateProduct(Guid id, [FromBody] UpdateProductDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var userId = User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var merchantId))
        {
            return Unauthorized(new { message = "Invalid user ID" });
        }

        var product = await _context.Products
            .Include(p => p.Images)
            .FirstOrDefaultAsync(p => p.Id == id && p.MerchantId == merchantId);

        if (product == null)
        {
            return NotFound(new { message = "Product not found" });
        }

        // Update fields if provided
        if (!string.IsNullOrEmpty(dto.Name))
            product.Name = dto.Name;

        if (!string.IsNullOrEmpty(dto.Description))
            product.Description = dto.Description;

        if (dto.Price.HasValue)
            product.Price = dto.Price.Value;

        if (!string.IsNullOrEmpty(dto.Category))
            product.Category = dto.Category;

        if (dto.IsActive.HasValue)
            product.IsActive = dto.IsActive.Value;

        // Update images if provided
        if (dto.ImageUrls != null)
        {
            if (dto.ImageUrls.Count > 10)
            {
                return BadRequest(new { message = "Maximum 10 images allowed per product" });
            }

            // Remove old images
            _context.ProductImages.RemoveRange(product.Images);

            // Add new images
            product.Images.Clear();
            for (int i = 0; i < dto.ImageUrls.Count; i++)
            {
                product.Images.Add(new ProductImage
                {
                    ImageUrl = dto.ImageUrls[i],
                    Order = i,
                    CreatedAt = DateTime.UtcNow
                });
            }
        }

        product.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Product {ProductId} updated by merchant {MerchantId}", product.Id, merchantId);

        return Ok(MapToDto(product));
    }

    /// <summary>
    /// Delete a product
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteProduct(Guid id)
    {
        var userId = User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var merchantId))
        {
            return Unauthorized(new { message = "Invalid user ID" });
        }

        var product = await _context.Products
            .FirstOrDefaultAsync(p => p.Id == id && p.MerchantId == merchantId);

        if (product == null)
        {
            return NotFound(new { message = "Product not found" });
        }

        _context.Products.Remove(product);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Product {ProductId} deleted by merchant {MerchantId}", id, merchantId);

        return NoContent();
    }

    /// <summary>
    /// Upload product images
    /// </summary>
    [HttpPost("upload-images")]
    public async Task<ActionResult<List<string>>> UploadImages([FromForm] List<IFormFile> images)
    {
        if (images == null || images.Count == 0)
        {
            return BadRequest(new { message = "No images provided" });
        }

        if (images.Count > 10)
        {
            return BadRequest(new { message = "Maximum 10 images allowed" });
        }

        // Validate all images before uploading
        foreach (var image in images)
        {
            if (!_imageUploadService.ValidateImage(image))
            {
                return BadRequest(new { message = $"Invalid image: {image.FileName}. Must be JPG, PNG, or WEBP and less than 5MB" });
            }
        }

        try
        {
            var imageUrls = await _imageUploadService.UploadImagesAsync(images);
            return Ok(new { imageUrls });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading images");
            return StatusCode(500, new { message = "Error uploading images" });
        }
    }

    private static ProductResponseDto MapToDto(Product product)
    {
        return new ProductResponseDto
        {
            Id = product.Id,
            Name = product.Name,
            Description = product.Description,
            Price = product.Price,
            Category = product.Category,
            MerchantId = product.MerchantId,
            IsActive = product.IsActive,
            CreatedAt = product.CreatedAt,
            UpdatedAt = product.UpdatedAt,
            Images = product.Images
                .OrderBy(i => i.Order)
                .Select(i => new ProductImageDto
                {
                    Id = i.Id,
                    ImageUrl = i.ImageUrl,
                    Order = i.Order
                })
                .ToList()
        };
    }
}
