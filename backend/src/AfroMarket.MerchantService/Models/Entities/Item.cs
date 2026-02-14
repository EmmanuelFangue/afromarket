using AfroMarket.MerchantService.Models.Enums;
using System.Text.Json;
using System.ComponentModel.DataAnnotations.Schema;

namespace AfroMarket.MerchantService.Models.Entities;

/// <summary>
/// Represents a product/item sold by a business
/// </summary>
public class Item
{
    public Guid Id { get; set; }
    public Guid BusinessId { get; set; }

    /// <summary>
    /// Titre de l'article en JSON multilingue: {"fr": "...", "en": "..."}
    /// </summary>
    public string TitleTranslations { get; set; } = "{\"fr\":\"\",\"en\":\"\"}";

    /// <summary>
    /// Description de l'article en JSON multilingue: {"fr": "...", "en": "..."}
    /// </summary>
    public string DescriptionTranslations { get; set; } = "{\"fr\":\"\",\"en\":\"\"}";

    public decimal Price { get; set; }
    public string Currency { get; set; } = "CAD"; // ISO 4217 code
    public string? SKU { get; set; } // Optional Stock Keeping Unit
    public bool IsAvailable { get; set; } = true; // Stock availability
    public ItemStatus Status { get; set; } = ItemStatus.Draft;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation properties
    public Business Business { get; set; } = null!;
    public ICollection<Media> Media { get; set; } = new List<Media>();

    // Propriétés de commodité (non mappées) pour rétrocompatibilité
    [NotMapped]
    public string Title
    {
        get => GetTranslation(TitleTranslations, "fr");
        set => TitleTranslations = SetTranslation(TitleTranslations, "fr", value);
    }

    [NotMapped]
    public string Description
    {
        get => GetTranslation(DescriptionTranslations, "fr");
        set => DescriptionTranslations = SetTranslation(DescriptionTranslations, "fr", value);
    }

    // Helpers pour JSON
    private static string GetTranslation(string json, string lang)
    {
        try
        {
            var dict = JsonSerializer.Deserialize<Dictionary<string, string>>(json);
            return dict?.GetValueOrDefault(lang) ?? "";
        }
        catch
        {
            return "";
        }
    }

    private static string SetTranslation(string json, string lang, string value)
    {
        try
        {
            var dict = JsonSerializer.Deserialize<Dictionary<string, string>>(json)
                       ?? new Dictionary<string, string>();
            dict[lang] = value;
            return JsonSerializer.Serialize(dict);
        }
        catch
        {
            return "{\"fr\":\"\",\"en\":\"\"}";
        }
    }
}
