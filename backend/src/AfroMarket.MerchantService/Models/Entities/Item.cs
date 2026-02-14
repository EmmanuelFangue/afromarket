using AfroMarket.MerchantService.Models.Enums;

namespace AfroMarket.MerchantService.Models.Entities;

/// <summary>
/// Represents a product/item sold by a business
/// </summary>
public class Item
{
    public Guid Id { get; set; }
    public Guid BusinessId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
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
}
