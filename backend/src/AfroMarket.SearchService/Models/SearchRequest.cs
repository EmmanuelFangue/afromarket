namespace AfroMarket.SearchService.Models;

public class BusinessSearchRequest
{
    public string Query { get; set; } = string.Empty;
    public List<string> Categories { get; set; } = new();
    public List<string> Cities { get; set; } = new();
    public GeoSearchParams? GeoSearch { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class GeoSearchParams
{
    public double Lat { get; set; }
    public double Lon { get; set; }
    public string Distance { get; set; } = "10km";
}
