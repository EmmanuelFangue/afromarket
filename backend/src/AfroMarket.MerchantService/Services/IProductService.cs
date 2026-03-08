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
    /// Updates an existing product (only if Draft or owner check passes)
    /// </summary>
    Task<ProductResponse> UpdateProductAsync(Guid productId, UpdateProductRequest request, Guid ownerId);

    /// <summary>
    /// Gets product by ID (includes media and business summary)
    /// </summary>
    Task<ProductResponse?> GetProductByIdAsync(Guid productId);

    /// <summary>
    /// Gets paginated products for a specific business
    /// </summary>
    Task<PaginatedResponse<ProductResponse>> GetProductsByBusinessAsync(
        Guid businessId,
        int page = 1,
        int pageSize = 20,
        ProductStatus? statusFilter = null);

    /// <summary>
    /// Deletes a product (only if Draft status)
    /// </summary>
    Task<bool> DeleteProductAsync(Guid productId, Guid ownerId);
}
