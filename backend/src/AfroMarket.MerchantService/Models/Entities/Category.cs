using AfroMarket.MerchantService.Helpers;
using System.ComponentModel.DataAnnotations.Schema;

namespace AfroMarket.MerchantService.Models.Entities;

public class Category
{
    public Guid Id { get; set; }

    /// <summary>
    /// Nom de la catégorie en JSON multilingue: {"fr": "...", "en": "..."}
    /// </summary>
    public string NameTranslations { get; set; } = "{\"fr\":\"\",\"en\":\"\"}";

    public string Slug { get; set; } = string.Empty;

    // Navigation property
    public ICollection<Business> Businesses { get; set; } = new List<Business>();

    // Propriété de commodité (non mappée) pour rétrocompatibilité
    [NotMapped]
    public string Name
    {
        get => TranslationHelper.GetTranslation(NameTranslations, "fr");
        set => NameTranslations = TranslationHelper.SetTranslation(NameTranslations, "fr", value);
    }
}
