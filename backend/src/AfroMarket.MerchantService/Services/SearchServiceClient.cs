using System.Net.Http.Json;

namespace AfroMarket.MerchantService.Services;

public class SearchServiceClient : ISearchServiceClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<SearchServiceClient> _logger;

    public SearchServiceClient(HttpClient httpClient, ILogger<SearchServiceClient> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task IndexProductAsync(ProductSearchDocument product)
    {
        try
        {
            var response = await _httpClient.PostAsJsonAsync("/api/search/products/index", product);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("SearchService returned {StatusCode} when indexing product {ProductId}",
                    response.StatusCode, product.Id);
            }
        }
        catch (Exception ex)
        {
            // Non-blocking: log and continue
            _logger.LogWarning(ex, "Failed to notify SearchService to index product {ProductId}", product.Id);
        }
    }

    public async Task DeleteProductAsync(string productId)
    {
        try
        {
            var response = await _httpClient.DeleteAsync($"/api/search/products/{productId}");
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("SearchService returned {StatusCode} when deleting product {ProductId} from index",
                    response.StatusCode, productId);
            }
        }
        catch (Exception ex)
        {
            // Non-blocking: log and continue
            _logger.LogWarning(ex, "Failed to notify SearchService to delete product {ProductId}", productId);
        }
    }
}
