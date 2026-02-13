using OpenSearch.Client;
using OpenSearch.Net;
using AfroMarket.SearchService.Models;

namespace AfroMarket.SearchService.Services;

public interface ISearchService
{
    Task<SearchResponse> SearchBusinessesAsync(BusinessSearchRequest request);
    Task<bool> IndexBusinessAsync(Business business);
    Task<bool> DeleteBusinessAsync(string id);
}

public class OpenSearchService : ISearchService
{
    private readonly IOpenSearchClient _client;
    private readonly ILogger<OpenSearchService> _logger;
    private const string IndexName = "businesses";

    public OpenSearchService(IOpenSearchClient client, ILogger<OpenSearchService> logger)
    {
        _client = client;
        _logger = logger;
    }

    public async Task<SearchResponse> SearchBusinessesAsync(BusinessSearchRequest request)
    {
        // Validate and clamp pagination parameters
        var page = Math.Max(1, request.Page);
        var pageSize = Math.Max(1, Math.Min(100, request.PageSize)); // Max 100 results per page

        var searchDescriptor = new SearchDescriptor<Business>()
            .Index(IndexName)
            .From((page - 1) * pageSize)
            .Size(pageSize)
            .Query(q => BuildQuery(q, request))
            .Aggregations(a => BuildAggregations(a));

        var response = await _client.SearchAsync<Business>(searchDescriptor);

        if (!response.IsValid)
        {
            _logger.LogError("Search failed: {Error}", response.DebugInformation);
            throw new Exception($"Search failed: {response.OriginalException?.Message ?? "Unknown error"}");
        }

        return new SearchResponse
        {
            Results = response.Documents.ToList(),
            TotalResults = response.Total,
            Page = page,
            PageSize = pageSize,
            Facets = ExtractFacets(response.Aggregations)
        };
    }

    private QueryContainer BuildQuery(QueryContainerDescriptor<Business> q, BusinessSearchRequest request)
    {
        var queries = new List<QueryContainer>();

        // Full-text search
        if (!string.IsNullOrWhiteSpace(request.Query))
        {
            queries.Add(q.MultiMatch(m => m
                .Query(request.Query)
                .Fields(f => f
                    .Field(b => b.Name, 2.0)
                    .Field(b => b.Description)
                    .Field(b => b.Tags)
                )
                .Type(TextQueryType.BestFields)
                .Fuzziness(Fuzziness.Auto)
            ));
        }

        // Category filter
        if (request.Categories?.Any() == true)
        {
            queries.Add(q.Terms(t => t
                .Field(b => b.Category)
                .Terms(request.Categories)
            ));
        }

        // City filter
        if (request.Cities?.Any() == true)
        {
            queries.Add(q.Terms(t => t
                .Field(b => b.City)
                .Terms(request.Cities)
            ));
        }

        // Geo search
        if (request.GeoSearch != null)
        {
            queries.Add(q.GeoDistance(g => g
                .Field(b => b.Location)
                .Location(request.GeoSearch.Lat, request.GeoSearch.Lon)
                .Distance(request.GeoSearch.Distance)
            ));
        }

        // Only published businesses
        queries.Add(q.Term(t => t
            .Field(b => b.IsPublished)
            .Value(true)
        ));

        return q.Bool(b => b.Must(queries.ToArray()));
    }

    private AggregationContainerDescriptor<Business> BuildAggregations(AggregationContainerDescriptor<Business> a)
    {
        return a
            .Terms("categories", t => t
                .Field(b => b.Category)
                .Size(50)
            )
            .Terms("cities", t => t
                .Field(b => b.City)
                .Size(50)
            );
    }

    private Dictionary<string, List<FacetItem>> ExtractFacets(AggregateDictionary aggregations)
    {
        var facets = new Dictionary<string, List<FacetItem>>();

        if (aggregations.Terms("categories") is { } categoryBuckets)
        {
            facets["categories"] = categoryBuckets.Buckets
                .Select(b => new FacetItem { Key = b.Key, Count = b.DocCount ?? 0 })
                .ToList();
        }

        if (aggregations.Terms("cities") is { } cityBuckets)
        {
            facets["cities"] = cityBuckets.Buckets
                .Select(b => new FacetItem { Key = b.Key, Count = b.DocCount ?? 0 })
                .ToList();
        }

        return facets;
    }

    public async Task<bool> IndexBusinessAsync(Business business)
    {
        var response = await _client.IndexAsync(business, i => i
            .Index(IndexName)
            .Id(business.Id)
            .Refresh(Refresh.True)
        );

        if (!response.IsValid)
        {
            _logger.LogError("Index failed: {Error}", response.DebugInformation);
            return false;
        }

        return true;
    }

    public async Task<bool> DeleteBusinessAsync(string id)
    {
        var response = await _client.DeleteAsync<Business>(id, d => d
            .Index(IndexName)
            .Refresh(Refresh.True)
        );

        if (!response.IsValid && response.Result != Result.NotFound)
        {
            _logger.LogError("Delete failed: {Error}", response.DebugInformation);
            return false;
        }

        return true;
    }
}
