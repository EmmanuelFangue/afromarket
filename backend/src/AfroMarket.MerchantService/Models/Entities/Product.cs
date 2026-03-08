using AfroMarket.MerchantService.Models.Enums;
using AfroMarket.MerchantService.Helpers;
using System.ComponentModel.DataAnnotations.Schema;

namespace AfroMarket.MerchantService.Models.Entities;

/// <summary>
/// Represents a product sold by a business
/// </summary>
public class Product
{
    public Guid Id { get; set; }
    public Guid BusinessId { get; set; }

    /// <summary>
    /// Titre du produit en JSON multilingue: {"fr": "...", "en": "..."}
    /// </summary>
    public string TitleTranslations { get; set; } = "{\"fr\":\"\",\"en\":\"\"}";

    /// <summary>
    /// Description du produit en JSON multilingue: {"fr": "...", "en": "..."}
    /// </summary>
    public string DescriptionTranslations { get; set; } = "{\"fr\":\"\",\"en\":\"\"}";

    public decimal Price { get; set; }
    public string Currency { get; set; } = "CAD"; // ISO 4217 code
    public string? SKU { get; set; } // Optional Stock Keeping Unit
    public bool IsAvailable { get; set; } = true; // Stock availability
    public ProductStatus Status { get; set; } = ProductStatus.Draft;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation properties
    public Business Business { get; set; } = null!;
    public ICollection<Media> Media { get; set; } = new List<Media>();

    // Propriétés de commodité (non mappées) pour rétrocompatibilité
    [NotMapped]
    public string Title
    {
        get => TranslationHelper.GetTranslation(TitleTranslations, "fr");
        set => TitleTranslations = TranslationHelper.SetTranslation(TitleTranslations, "fr", value);
    }

    [NotMapped]
    public string Description
    {
        get => TranslationHelper.GetTranslation(DescriptionTranslations, "fr");
        set => DescriptionTranslations = TranslationHelper.SetTranslation(DescriptionTranslations, "fr", value);
    }
}
