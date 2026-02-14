using AfroMarket.SearchService.Models;

namespace AfroMarket.SearchService.Services;

public class IndexingService
{
    private readonly IMerchantServiceClient _merchantClient;
    private readonly ISearchService _searchService;
    private readonly ILogger<IndexingService> _logger;

    public IndexingService(
        IMerchantServiceClient merchantClient,
        ISearchService searchService,
        ILogger<IndexingService> logger)
    {
        _merchantClient = merchantClient;
        _searchService = searchService;
        _logger = logger;
    }

    public async Task InitialIndexAsync()
    {
        _logger.LogInformation("Starting initial indexing of published businesses");

        try
        {
            // Create index if not exists
            var indexCreated = await _searchService.CreateIndexAsync();
            if (!indexCreated)
            {
                _logger.LogError("Failed to create OpenSearch index");
                return;
            }

            // Fetch all published businesses from MerchantService
            var allBusinesses = new List<BusinessDto>();
            int page = 1;
            const int pageSize = 100;
            bool hasMore = true;

            while (hasMore)
            {
                var result = await _merchantClient.GetPublishedBusinessesAsync(page, pageSize);
                allBusinesses.AddRange(result.Items);

                hasMore = result.HasNextPage;
                page++;

                _logger.LogInformation("Fetched page {Page}, total so far: {Count}", page - 1, allBusinesses.Count);
            }

            _logger.LogInformation("Fetched {Count} published businesses from MerchantService", allBusinesses.Count);

            if (!allBusinesses.Any())
            {
                _logger.LogWarning("No published businesses to index");
                return;
            }

            // Convert to OpenSearch Business model
            var searchBusinesses = allBusinesses.Select(MapToSearchBusiness).ToList();

            // Bulk index
            var indexed = await _searchService.BulkIndexBusinessesAsync(searchBusinesses);

            if (indexed)
            {
                _logger.LogInformation("Successfully indexed {Count} businesses", searchBusinesses.Count);
            }
            else
            {
                _logger.LogError("Failed to bulk index businesses");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during initial indexing");
        }
    }

    private Business MapToSearchBusiness(BusinessDto dto)
    {
        return new Business
        {
            Id = dto.Id.ToString(),
            NameTranslations = dto.NameTranslations,
            DescriptionTranslations = dto.DescriptionTranslations,
            CategoryId = dto.CategoryId,
            CategoryName = dto.CategoryName,
            AddressId = Guid.NewGuid(), // Not critical for search
            City = dto.Address.City,
            Province = dto.Address.Province,
            Address = $"{dto.Address.Street}, {dto.Address.City}",
            Location = new GeoLocation
            {
                Lat = dto.Address.Latitude,
                Lon = dto.Address.Longitude
            },
            Phone = dto.Phone ?? string.Empty,
            Email = dto.Email ?? string.Empty,
            Website = dto.Website ?? string.Empty,
            Tags = dto.Tags,
            IsPublished = true,
            CreatedAt = dto.CreatedAt,
            UpdatedAt = dto.UpdatedAt,
            PublishedAt = dto.PublishedAt
        };
    }
}
