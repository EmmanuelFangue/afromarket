using System.Text.Json;

namespace AfroMarket.SearchService.Models;

public class Business
{
    public string Id { get; set; } = string.Empty;

    // Support i18n - JSON translations
    public string NameTranslations { get; set; } = "{\"fr\":\"\",\"en\":\"\"}";
    public string DescriptionTranslations { get; set; } = "{\"fr\":\"\",\"en\":\"\"}";

    // IDs for relationships
    public Guid CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty; // For display/facets
    public Guid AddressId { get; set; }

    // Geo
    public string City { get; set; } = string.Empty;
    public string Province { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public GeoLocation Location { get; set; } = new();

    // Contact
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Website { get; set; } = string.Empty;

    // Metadata
    public List<string> Tags { get; set; } = new();
    public bool IsPublished { get; set; } = true; // Always true from Published endpoint
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? PublishedAt { get; set; }

    // Helper methods to extract translations
    public string GetName(string lang = "fr")
    {
        try
        {
            var dict = JsonSerializer.Deserialize<Dictionary<string, string>>(NameTranslations);
            return dict?.GetValueOrDefault(lang) ?? dict?.GetValueOrDefault("fr") ?? "";
        }
        catch
        {
            return "";
        }
    }

    public string GetDescription(string lang = "fr")
    {
        try
        {
            var dict = JsonSerializer.Deserialize<Dictionary<string, string>>(DescriptionTranslations);
            return dict?.GetValueOrDefault(lang) ?? dict?.GetValueOrDefault("fr") ?? "";
        }
        catch
        {
            return "";
        }
    }
}

public class GeoLocation
{
    public double Lat { get; set; }
    public double Lon { get; set; }
}
