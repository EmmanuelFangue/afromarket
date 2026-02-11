namespace AfroMarket.SearchService.Models;

public class SearchResponse
{
    public List<Business> Results { get; set; } = new();
    public long TotalResults { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public Dictionary<string, List<FacetItem>> Facets { get; set; } = new();
}

public class FacetItem
{
    public string Key { get; set; } = string.Empty;
    public long Count { get; set; }
}
