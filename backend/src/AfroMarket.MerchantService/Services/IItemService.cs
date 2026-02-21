using AfroMarket.MerchantService.Models.DTOs;
using AfroMarket.MerchantService.Models.Enums;

namespace AfroMarket.MerchantService.Services;

public interface IItemService
{
    /// <summary>
    /// Creates a new item with Draft status (requires ≥1 media)
    /// </summary>
    Task<ItemResponse> CreateItemAsync(CreateItemRequest request, Guid ownerId);

    /// <summary>
    /// Updates an existing item (only if Draft or owner check passes)
    /// </summary>
    Task<ItemResponse> UpdateItemAsync(Guid itemId, UpdateItemRequest request, Guid ownerId);

    /// <summary>
    /// Gets item by ID (includes media and business summary)
    /// </summary>
    Task<ItemResponse?> GetItemByIdAsync(Guid itemId);

    /// <summary>
    /// Gets paginated items for a specific business
    /// </summary>
    Task<PaginatedResponse<ItemResponse>> GetItemsByBusinessAsync(
        Guid businessId,
        int page = 1,
        int pageSize = 20,
        ItemStatus? statusFilter = null);

    /// <summary>
    /// Deletes an item (only if Draft status)
    /// </summary>
    Task<bool> DeleteItemAsync(Guid itemId, Guid ownerId);
}
