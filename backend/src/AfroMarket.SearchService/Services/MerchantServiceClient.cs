using AfroMarket.SearchService.Models;
using System.Text.Json;

namespace AfroMarket.SearchService.Services;

public class MerchantServiceClient : IMerchantServiceClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<MerchantServiceClient> _logger;

    public MerchantServiceClient(HttpClient httpClient, ILogger<MerchantServiceClient> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<PaginatedResult<BusinessDto>> GetPublishedBusinessesAsync(int page = 1, int pageSize = 100)
    {
        try
        {
            _logger.LogInformation("Fetching published businesses from MerchantService - Page: {Page}, PageSize: {PageSize}", page, pageSize);

            var response = await _httpClient.GetAsync($"/api/business/published?page={page}&pageSize={pageSize}");
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<PaginatedResult<BusinessDto>>(json, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            _logger.LogInformation("Successfully fetched {Count} businesses from MerchantService", result?.Items.Count ?? 0);

            return result ?? new PaginatedResult<BusinessDto>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fetch published businesses from MerchantService");
            throw;
        }
    }
}
