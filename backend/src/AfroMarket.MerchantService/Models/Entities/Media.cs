using AfroMarket.MerchantService.Models.Enums;

namespace AfroMarket.MerchantService.Models.Entities;

/// <summary>
/// Represents media (images/videos) attached to a product
/// </summary>
public class Media
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string Url { get; set; } = string.Empty;
    public MediaType Type { get; set; } = MediaType.Image;
    public int OrderIndex { get; set; } // Display order (0 = primary image)
    public string? FileName { get; set; }
    public string? AltText { get; set; } // Accessibility text
    public long? FileSizeBytes { get; set; }
    public DateTime CreatedAt { get; set; }

    // Navigation property
    public Product Product { get; set; } = null!;
}
