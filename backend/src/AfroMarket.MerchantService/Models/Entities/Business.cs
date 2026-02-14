using AfroMarket.MerchantService.Models.Enums;
using AfroMarket.MerchantService.Helpers;
using System.ComponentModel.DataAnnotations.Schema;

namespace AfroMarket.MerchantService.Models.Entities;

public class Business
{
    public Guid Id { get; set; }
    public Guid OwnerId { get; set; }

    /// <summary>
    /// Nom du commerce en JSON multilingue: {"fr": "...", "en": "..."}
    /// </summary>
    public string NameTranslations { get; set; } = "{\"fr\":\"\",\"en\":\"\"}";

    /// <summary>
    /// Description en JSON multilingue: {"fr": "...", "en": "..."}
    /// </summary>
    public string DescriptionTranslations { get; set; } = "{\"fr\":\"\",\"en\":\"\"}";

    public BusinessStatus Status { get; set; } = BusinessStatus.Draft;
    public Guid CategoryId { get; set; }
    public Guid AddressId { get; set; }
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Website { get; set; } = string.Empty;
    public string Tags { get; set; } = "[]"; // JSON array as string
    public string? RejectionReason { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? PublishedAt { get; set; }

    // Navigation properties
    public User Owner { get; set; } = null!;
    public Category Category { get; set; } = null!;
    public Address Address { get; set; } = null!;
    public ICollection<Message> Messages { get; set; } = new List<Message>();
    public ICollection<Item> Items { get; set; } = new List<Item>();

    // Propriétés de commodité (non mappées) pour rétrocompatibilité
    [NotMapped]
    public string Name
    {
        get => TranslationHelper.GetTranslation(NameTranslations, "fr");
        set => NameTranslations = TranslationHelper.SetTranslation(NameTranslations, "fr", value);
    }

    [NotMapped]
    public string Description
    {
        get => TranslationHelper.GetTranslation(DescriptionTranslations, "fr");
        set => DescriptionTranslations = TranslationHelper.SetTranslation(DescriptionTranslations, "fr", value);
    }
}
