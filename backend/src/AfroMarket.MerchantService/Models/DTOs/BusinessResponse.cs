using AfroMarket.MerchantService.Models.Enums;

namespace AfroMarket.MerchantService.Models.DTOs;

public class BusinessResponse
{
    public Guid Id { get; set; }
    public Guid OwnerId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public BusinessStatus Status { get; set; }
    public Guid CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public AddressDto Address { get; set; } = null!;
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Website { get; set; }
    public List<string> Tags { get; set; } = new();
    public string? RejectionReason { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? PublishedAt { get; set; }
}
