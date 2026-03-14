using System.Text.Json;

namespace AfroMarket.SearchService.Models;

public class Product
{
    public string Id { get; set; } = string.Empty;

    // Support i18n - JSON translations
    public string TitleTranslations { get; set; } = "{\"fr\":\"\",\"en\":\"\"}";
    public string DescriptionTranslations { get; set; } = "{\"fr\":\"\",\"en\":\"\"}";

    public decimal Price { get; set; }
    public string Currency { get; set; } = string.Empty;

    public string BusinessId { get; set; } = string.Empty;
    public string BusinessName { get; set; } = string.Empty;

    public string FirstImageUrl { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public string GetTitle(string lang = "fr")
    {
        try
        {
            var dict = JsonSerializer.Deserialize<Dictionary<string, string>>(TitleTranslations);
            return dict?.GetValueOrDefault(lang) ?? dict?.GetValueOrDefault("fr") ?? "";
        }
        catch
        {
            return "";
        }
    }
}
