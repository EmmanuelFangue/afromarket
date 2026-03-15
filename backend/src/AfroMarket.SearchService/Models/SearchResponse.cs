namespace AfroMarket.SearchService.Models;

public class SearchResponse
{
    public List<Business> Results { get; set; } = new();
    public long TotalResults { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => PageSize > 0 ? (int)Math.Ceiling((double)TotalResults / PageSize) : 0;
    public Dictionary<string, List<FacetItem>> Facets { get; set; } = new();
}

public class FacetItem
{
    public string Key { get; set; } = string.Empty;
    public long Count { get; set; }
}

public class ProductSearchResponse
{
    public List<Product> Results { get; set; } = new();
    public long TotalResults { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}
