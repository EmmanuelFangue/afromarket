using System.Text.Json;
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
        get => GetTranslation(NameTranslations, "fr");
        set => NameTranslations = SetTranslation(NameTranslations, "fr", value);
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
