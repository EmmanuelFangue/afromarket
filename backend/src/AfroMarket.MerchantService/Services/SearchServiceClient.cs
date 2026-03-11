using AfroMarket.MerchantService.Models.DTOs;
using System.Net.Http.Json;
using System.Text.Json;

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

    public async Task<bool> IndexBusinessAsync(BusinessResponse business)
    {
        try
        {
            var payload = new
            {
                id = business.Id.ToString(),
                nameTranslations = business.NameTranslations,
                descriptionTranslations = business.DescriptionTranslations,
                categoryId = business.CategoryId,
                categoryName = business.CategoryName,
                addressId = Guid.Empty,
                city = business.Address?.City ?? string.Empty,
                province = business.Address?.Province ?? string.Empty,
                address = string.Join(", ", new[]
                {
                    business.Address?.Street,
                    business.Address?.City,
                    business.Address?.Province
                }.Where(s => !string.IsNullOrEmpty(s))),
                location = new
                {
                    lat = (double)(business.Address?.Latitude ?? 0),
                    lon = (double)(business.Address?.Longitude ?? 0)
                },
                phone = business.Phone ?? string.Empty,
                email = business.Email ?? string.Empty,
                website = business.Website ?? string.Empty,
                tags = business.Tags,
                isPublished = true,
                createdAt = business.CreatedAt,
                updatedAt = business.UpdatedAt,
                publishedAt = business.PublishedAt
            };

            var response = await _httpClient.PostAsJsonAsync("api/search/index", payload);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning(
                    "SearchService returned {StatusCode} while indexing business {BusinessId}",
                    response.StatusCode, business.Id);
                return false;
            }

            _logger.LogInformation("Business {BusinessId} successfully indexed in SearchService", business.Id);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to index business {BusinessId} in SearchService", business.Id);
            return false;
        }
    }

    public async Task<bool> DeleteBusinessAsync(string businessId)
    {
        try
        {
            var response = await _httpClient.DeleteAsync($"api/search/{businessId}");

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning(
                    "SearchService returned {StatusCode} while deleting business {BusinessId}",
                    response.StatusCode, businessId);
                return false;
            }

            _logger.LogInformation("Business {BusinessId} successfully removed from SearchService index", businessId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete business {BusinessId} from SearchService", businessId);
            return false;
        }
    }
}
