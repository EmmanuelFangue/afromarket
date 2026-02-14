using AfroMarket.MerchantService.Models.Enums;

namespace AfroMarket.MerchantService.Models.DTOs;

public class ItemResponse
{
    public Guid Id { get; set; }
    public Guid BusinessId { get; set; }
    public string BusinessName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string Currency { get; set; } = string.Empty;
    public string? SKU { get; set; }
    public bool IsAvailable { get; set; }
    public ItemStatus Status { get; set; }
    public List<MediaResponse> Media { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
