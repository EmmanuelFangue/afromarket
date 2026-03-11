namespace AfroMarket.MerchantService.Services;

/// <summary>
/// Client for notifying the SearchService when product status changes.
/// </summary>
public interface ISearchServiceClient
{
    Task IndexProductAsync(ProductSearchDocument product);
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
