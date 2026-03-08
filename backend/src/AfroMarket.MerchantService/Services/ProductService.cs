using AfroMarket.MerchantService.Data;
using AfroMarket.MerchantService.Models.DTOs;
using AfroMarket.MerchantService.Models.Entities;
using AfroMarket.MerchantService.Models.Enums;
using AfroMarket.MerchantService.Resources;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;

namespace AfroMarket.MerchantService.Services;

public class ProductService : IProductService
{
    private readonly MerchantDbContext _context;
    private readonly ILogger<ProductService> _logger;
    private readonly IStringLocalizer<SharedResources> _localizer;
    private static readonly string[] SupportedCurrencies = { "CAD", "USD", "EUR", "XOF", "XAF" };

    public ProductService(
        MerchantDbContext context,
        ILogger<ProductService> logger,
        IStringLocalizer<SharedResources> localizer)
    {
        _context = context;
        _logger = logger;
        _localizer = localizer;
    }

    public async Task<ProductResponse> CreateProductAsync(CreateProductRequest request, Guid ownerId)
    {
        // Validate business ownership
        var business = await _context.Businesses
            .FirstOrDefaultAsync(b => b.Id == request.BusinessId);

        if (business == null)
        {
            throw new KeyNotFoundException(string.Format(_localizer["Error.BusinessNotFound"].Value, request.BusinessId));
        }

        if (business.OwnerId != ownerId)
        {
            throw new UnauthorizedAccessException(_localizer["Error.Unauthorized"].Value);
        }

        // Validate media
        if (request.Media == null || request.Media.Count == 0)
        {
            throw new ArgumentException(_localizer["Error.MediaRequired"].Value);
        }

        // Validate price
        if (request.Price <= 0)
        {
            throw new ArgumentException(_localizer["Error.PricePositive"].Value);
        }

        // Validate currency
        if (!SupportedCurrencies.Contains(request.Currency))
        {
            throw new ArgumentException(string.Format(_localizer["Error.InvalidCurrency"].Value, string.Join(", ", SupportedCurrencies)));
        }

        // Create product
        var product = new Product
        {
            Id = Guid.NewGuid(),
            BusinessId = request.BusinessId,
            Title = request.Title,
            Description = request.Description,
            Price = request.Price,
            Currency = request.Currency,
            SKU = request.SKU,
            IsAvailable = request.IsAvailable,
            Status = ProductStatus.Draft,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Create media
        var mediaList = request.Media.Select((m, index) => new Media
        {
            Id = Guid.NewGuid(),
            ProductId = product.Id,
            Url = m.Url,
            Type = m.Type,
            OrderIndex = index,
            FileName = m.FileName,
            AltText = m.AltText,
            FileSizeBytes = m.FileSizeBytes,
            CreatedAt = DateTime.UtcNow
        }).ToList();

        _context.Products.Add(product);
        _context.Media.AddRange(mediaList);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created product {ProductId} for business {BusinessId}", product.Id, product.BusinessId);

        return await MapToResponseAsync(product);
    }

    public async Task<ProductResponse> UpdateProductAsync(Guid productId, UpdateProductRequest request, Guid ownerId)
    {
        var product = await _context.Products
            .Include(p => p.Business)
            .Include(p => p.Media.OrderBy(m => m.OrderIndex))
            .FirstOrDefaultAsync(p => p.Id == productId);

        if (product == null)
        {
            throw new KeyNotFoundException(string.Format(_localizer["Error.ProductNotFound"].Value, productId));
        }

        // Verify ownership
        if (product.Business.OwnerId != ownerId)
        {
            throw new UnauthorizedAccessException(_localizer["Error.Unauthorized"].Value);
        }

        // Status check - only Draft products can be updated
        if (product.Status != ProductStatus.Draft)
        {
            throw new InvalidOperationException(_localizer["Error.CannotUpdateStatus"].Value);
        }

        // Update fields if provided
        if (request.Title != null)
            product.Title = request.Title;

        if (request.Description != null)
            product.Description = request.Description;

        if (request.Price.HasValue)
        {
            if (request.Price.Value <= 0)
                throw new ArgumentException(_localizer["Error.PricePositive"].Value);
            product.Price = request.Price.Value;
        }

        if (request.Currency != null)
        {
            if (!SupportedCurrencies.Contains(request.Currency))
                throw new ArgumentException(string.Format(_localizer["Error.InvalidCurrency"].Value, string.Join(", ", SupportedCurrencies)));
            product.Currency = request.Currency;
        }

        if (request.SKU != null)
            product.SKU = request.SKU;

        if (request.IsAvailable.HasValue)
            product.IsAvailable = request.IsAvailable.Value;

        // Handle media updates
        if (request.MediaToRemove != null && request.MediaToRemove.Any())
        {
            var mediaToRemove = product.Media.Where(m => request.MediaToRemove.Contains(m.Id)).ToList();
            _context.Media.RemoveRange(mediaToRemove);
        }

        if (request.MediaToAdd != null && request.MediaToAdd.Any())
        {
            var maxOrderIndex = product.Media.Any() ? product.Media.Max(m => m.OrderIndex) : -1;
            var newMedia = request.MediaToAdd.Select((m, index) => new Media
            {
                Id = Guid.NewGuid(),
                ProductId = product.Id,
                Url = m.Url,
                Type = m.Type,
                OrderIndex = maxOrderIndex + index + 1,
                FileName = m.FileName,
                AltText = m.AltText,
                FileSizeBytes = m.FileSizeBytes,
                CreatedAt = DateTime.UtcNow
            }).ToList();

            _context.Media.AddRange(newMedia);
        }

        if (request.MediaOrderUpdates != null && request.MediaOrderUpdates.Any())
        {
            foreach (var orderUpdate in request.MediaOrderUpdates)
            {
                var media = product.Media.FirstOrDefault(m => m.Id == orderUpdate.MediaId);
                if (media != null)
                {
                    media.OrderIndex = orderUpdate.NewOrderIndex;
                }
            }
        }

        // Ensure at least 1 media remains
        if (product.Media.Count == 0)
        {
            throw new InvalidOperationException(_localizer["Error.MediaRequired"].Value);
        }

        product.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated product {ProductId}", productId);

        return await MapToResponseAsync(product);
    }

    public async Task<ProductResponse?> GetProductByIdAsync(Guid productId)
    {
        var product = await _context.Products
            .Include(p => p.Business)
            .Include(p => p.Media.OrderBy(m => m.OrderIndex))
            .FirstOrDefaultAsync(p => p.Id == productId);

        if (product == null)
        {
            return null;
        }

        return await MapToResponseAsync(product);
    }

    public async Task<PaginatedResponse<ProductResponse>> GetProductsByBusinessAsync(
        Guid businessId,
        int page = 1,
        int pageSize = 20,
        ProductStatus? statusFilter = null)
    {
        if (page < 1) page = 1;
        if (pageSize < 1 || pageSize > 100) pageSize = 20;

        var query = _context.Products
            .Include(p => p.Business)
            .Include(p => p.Media.OrderBy(m => m.OrderIndex))
            .Where(p => p.BusinessId == businessId);

        if (statusFilter.HasValue)
        {
            query = query.Where(p => p.Status == statusFilter.Value);
        }

        var totalCount = await query.CountAsync();
        var products = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var productResponses = new List<ProductResponse>();
        foreach (var product in products)
        {
            productResponses.Add(await MapToResponseAsync(product));
        }

        return new PaginatedResponse<ProductResponse>
        {
            Items = productResponses,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<bool> DeleteProductAsync(Guid productId, Guid ownerId)
    {
        var product = await _context.Products
            .Include(p => p.Business)
            .FirstOrDefaultAsync(p => p.Id == productId);

        if (product == null)
        {
            return false;
        }

        // Verify ownership
        if (product.Business.OwnerId != ownerId)
        {
            throw new UnauthorizedAccessException(_localizer["Error.Unauthorized"].Value);
        }

        // Status check - only Draft products can be deleted
        if (product.Status != ProductStatus.Draft)
        {
            throw new InvalidOperationException(string.Format(_localizer["Error.CannotDeleteStatus"].Value, product.Status));
        }

        _context.Products.Remove(product);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted product {ProductId}", productId);

        return true;
    }

    private async Task<ProductResponse> MapToResponseAsync(Product product)
    {
        // Ensure business is loaded
        if (product.Business == null)
        {
            product.Business = await _context.Businesses.FindAsync(product.BusinessId) ?? throw new InvalidOperationException("Business not found");
        }

        // Ensure media is loaded
        if (product.Media == null || !product.Media.Any())
        {
            product.Media = await _context.Media
                .Where(m => m.ProductId == product.Id)
                .OrderBy(m => m.OrderIndex)
                .ToListAsync();
        }

        return new ProductResponse
        {
            Id = product.Id,
            BusinessId = product.BusinessId,
            BusinessName = product.Business.Name,
            Title = product.Title,
            Description = product.Description,
            TitleTranslations = product.TitleTranslations,
            DescriptionTranslations = product.DescriptionTranslations,
            Price = product.Price,
            Currency = product.Currency,
            SKU = product.SKU,
            IsAvailable = product.IsAvailable,
            Status = product.Status,
            Media = product.Media.Select(m => new MediaResponse
            {
                Id = m.Id,
                Url = m.Url,
                Type = m.Type,
                OrderIndex = m.OrderIndex,
                FileName = m.FileName,
                AltText = m.AltText,
                FileSizeBytes = m.FileSizeBytes,
                CreatedAt = m.CreatedAt
            }).ToList(),
            CreatedAt = product.CreatedAt,
            UpdatedAt = product.UpdatedAt
        };
    }
}
