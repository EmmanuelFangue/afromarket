using AfroMarket.MerchantService.Data;
using AfroMarket.MerchantService.Models.DTOs;
using AfroMarket.MerchantService.Models.Entities;
using AfroMarket.MerchantService.Models.Enums;
using AfroMarket.MerchantService.Resources;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;

namespace AfroMarket.MerchantService.Services;

public class ItemService : IItemService
{
    private readonly MerchantDbContext _context;
    private readonly ILogger<ItemService> _logger;
    private readonly IStringLocalizer<SharedResources> _localizer;
    private static readonly string[] SupportedCurrencies = { "CAD", "USD", "EUR", "XOF", "XAF" };

    public ItemService(
        MerchantDbContext context,
        ILogger<ItemService> logger,
        IStringLocalizer<SharedResources> localizer)
    {
        _context = context;
        _logger = logger;
        _localizer = localizer;
    }

    public async Task<ItemResponse> CreateItemAsync(CreateItemRequest request, Guid ownerId)
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

        // Create item
        var item = new Item
        {
            Id = Guid.NewGuid(),
            BusinessId = request.BusinessId,
            Title = request.Title,
            Description = request.Description,
            Price = request.Price,
            Currency = request.Currency,
            SKU = request.SKU,
            IsAvailable = request.IsAvailable,
            Status = ItemStatus.Draft,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Create media
        var mediaList = request.Media.Select((m, index) => new Media
        {
            Id = Guid.NewGuid(),
            ItemId = item.Id,
            Url = m.Url,
            Type = m.Type,
            OrderIndex = index,
            FileName = m.FileName,
            AltText = m.AltText,
            FileSizeBytes = m.FileSizeBytes,
            CreatedAt = DateTime.UtcNow
        }).ToList();

        _context.Items.Add(item);
        _context.Media.AddRange(mediaList);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created item {ItemId} for business {BusinessId}", item.Id, item.BusinessId);

        return await MapToResponseAsync(item);
    }

    public async Task<ItemResponse> UpdateItemAsync(Guid itemId, UpdateItemRequest request, Guid ownerId)
    {
        var item = await _context.Items
            .Include(i => i.Business)
            .Include(i => i.Media.OrderBy(m => m.OrderIndex))
            .FirstOrDefaultAsync(i => i.Id == itemId);

        if (item == null)
        {
            throw new KeyNotFoundException($"Item with ID {itemId} not found");
        }

        // Verify ownership
        if (item.Business.OwnerId != ownerId)
        {
            throw new UnauthorizedAccessException("You do not own this item");
        }

        // Status check - only Draft items can be updated
        if (item.Status != ItemStatus.Draft)
        {
            throw new InvalidOperationException("Only Draft items can be updated");
        }

        // Update fields if provided
        if (request.Title != null)
            item.Title = request.Title;

        if (request.Description != null)
            item.Description = request.Description;

        if (request.Price.HasValue)
        {
            if (request.Price.Value <= 0)
                throw new ArgumentException("Price must be greater than 0");
            item.Price = request.Price.Value;
        }

        if (request.Currency != null)
        {
            if (!SupportedCurrencies.Contains(request.Currency))
                throw new ArgumentException($"Invalid currency code. Supported: {string.Join(", ", SupportedCurrencies)}");
            item.Currency = request.Currency;
        }

        if (request.SKU != null)
            item.SKU = request.SKU;

        if (request.IsAvailable.HasValue)
            item.IsAvailable = request.IsAvailable.Value;

        // Handle media updates
        if (request.MediaToRemove != null && request.MediaToRemove.Any())
        {
            var mediaToRemove = item.Media.Where(m => request.MediaToRemove.Contains(m.Id)).ToList();
            _context.Media.RemoveRange(mediaToRemove);
        }

        if (request.MediaToAdd != null && request.MediaToAdd.Any())
        {
            var maxOrderIndex = item.Media.Any() ? item.Media.Max(m => m.OrderIndex) : -1;
            var newMedia = request.MediaToAdd.Select((m, index) => new Media
            {
                Id = Guid.NewGuid(),
                ItemId = item.Id,
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
                var media = item.Media.FirstOrDefault(m => m.Id == orderUpdate.MediaId);
                if (media != null)
                {
                    media.OrderIndex = orderUpdate.NewOrderIndex;
                }
            }
        }

        // Ensure at least 1 media remains
        if (item.Media.Count == 0)
        {
            throw new InvalidOperationException("Item must have at least one media item");
        }

        item.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated item {ItemId}", itemId);

        return await MapToResponseAsync(item);
    }

    public async Task<ItemResponse?> GetItemByIdAsync(Guid itemId)
    {
        var item = await _context.Items
            .Include(i => i.Business)
            .Include(i => i.Media.OrderBy(m => m.OrderIndex))
            .FirstOrDefaultAsync(i => i.Id == itemId);

        if (item == null)
        {
            return null;
        }

        return await MapToResponseAsync(item);
    }

    public async Task<PaginatedResponse<ItemResponse>> GetItemsByBusinessAsync(
        Guid businessId,
        int page = 1,
        int pageSize = 20,
        ItemStatus? statusFilter = null)
    {
        if (page < 1) page = 1;
        if (pageSize < 1 || pageSize > 100) pageSize = 20;

        var query = _context.Items
            .Include(i => i.Business)
            .Include(i => i.Media.OrderBy(m => m.OrderIndex))
            .Where(i => i.BusinessId == businessId);

        if (statusFilter.HasValue)
        {
            query = query.Where(i => i.Status == statusFilter.Value);
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(i => i.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var itemResponses = new List<ItemResponse>();
        foreach (var item in items)
        {
            itemResponses.Add(await MapToResponseAsync(item));
        }

        return new PaginatedResponse<ItemResponse>
        {
            Items = itemResponses,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<bool> DeleteItemAsync(Guid itemId, Guid ownerId)
    {
        var item = await _context.Items
            .Include(i => i.Business)
            .FirstOrDefaultAsync(i => i.Id == itemId);

        if (item == null)
        {
            return false;
        }

        // Verify ownership
        if (item.Business.OwnerId != ownerId)
        {
            throw new UnauthorizedAccessException("You do not own this item");
        }

        // Status check - only Draft items can be deleted
        if (item.Status != ItemStatus.Draft)
        {
            throw new InvalidOperationException("Only Draft items can be deleted");
        }

        _context.Items.Remove(item);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted item {ItemId}", itemId);

        return true;
    }

    private async Task<ItemResponse> MapToResponseAsync(Item item)
    {
        // Ensure business is loaded
        if (item.Business == null)
        {
            item.Business = await _context.Businesses.FindAsync(item.BusinessId) ?? throw new InvalidOperationException("Business not found");
        }

        // Ensure media is loaded
        if (item.Media == null || !item.Media.Any())
        {
            item.Media = await _context.Media
                .Where(m => m.ItemId == item.Id)
                .OrderBy(m => m.OrderIndex)
                .ToListAsync();
        }

        return new ItemResponse
        {
            Id = item.Id,
            BusinessId = item.BusinessId,
            BusinessName = item.Business.Name,
            Title = item.Title,
            Description = item.Description,
            Price = item.Price,
            Currency = item.Currency,
            SKU = item.SKU,
            IsAvailable = item.IsAvailable,
            Status = item.Status,
            Media = item.Media.Select(m => new MediaResponse
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
            CreatedAt = item.CreatedAt,
            UpdatedAt = item.UpdatedAt
        };
    }
}
