using AfroMarket.MerchantService.Models.DTOs;
using AfroMarket.MerchantService.Models.Enums;

namespace AfroMarket.MerchantService.Services;

public interface IProductService
{
    /// <summary>
    /// Creates a new product with Draft status (requires ≥1 media)
    /// </summary>
    Task<ProductResponse> CreateProductAsync(CreateProductRequest request, Guid ownerId);

    /// <summary>
    /// Updates an existing product (only if in Draft status and ownership check passes)
    /// </summary>
    Task<ProductResponse> UpdateProductAsync(Guid productId, UpdateProductRequest request, Guid ownerId);

    /// <summary>
    /// Gets product by ID (includes media and business summary)
    /// </summary>
    Task<ProductResponse?> GetProductByIdAsync(Guid productId);

    /// <summary>
    /// Gets paginated products for a specific business with optional status filter and text search
    /// </summary>
    Task<PaginatedResponse<ProductResponse>> GetProductsByBusinessAsync(
        Guid businessId,
        int page = 1,
        int pageSize = 20,
        ProductStatus? statusFilter = null,
        string? searchQuery = null);

    /// <summary>
    /// Deletes a product (only if Draft status)
    /// </summary>
    Task<bool> DeleteProductAsync(Guid productId, Guid ownerId);

    /// <summary>
    /// Changes the status of a product. Allowed transitions: Draft→Active, Active→Suspended, Suspended→Active.
    /// </summary>
    Task<ProductResponse> ChangeProductStatusAsync(Guid productId, ProductStatus newStatus, Guid ownerId);

    /// <summary>
    /// Gets all Active products across all businesses (used by SearchService for indexing).
    /// </summary>
    Task<PaginatedResponse<ProductResponse>> GetAllActiveProductsAsync(int page = 1, int pageSize = 100);
}
