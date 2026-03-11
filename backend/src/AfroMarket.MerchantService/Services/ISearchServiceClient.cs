using AfroMarket.MerchantService.Models.DTOs;

namespace AfroMarket.MerchantService.Services;

public interface ISearchServiceClient
{
    /// <summary>
    /// Notifies the SearchService to index a newly approved business.
    /// </summary>
    Task<bool> IndexBusinessAsync(BusinessResponse business);

    /// <summary>
    /// Notifies the SearchService to remove a business from the index.
    /// </summary>
    Task<bool> DeleteBusinessAsync(string businessId);

    /// <summary>
    /// Notifies the SearchService to index or update a product.
    /// </summary>
    Task IndexProductAsync(ProductSearchDocument product);

    /// <summary>
    /// Notifies the SearchService to remove a product from the index.
    /// </summary>
    Task DeleteProductAsync(string productId);
}

public class ProductSearchDocument
{
    public string Id { get; set; } = string.Empty;
    public string TitleTranslations { get; set; } = string.Empty;
    public string DescriptionTranslations { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string Currency { get; set; } = string.Empty;
    public string BusinessId { get; set; } = string.Empty;
    public string BusinessName { get; set; } = string.Empty;
    public string FirstImageUrl { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
