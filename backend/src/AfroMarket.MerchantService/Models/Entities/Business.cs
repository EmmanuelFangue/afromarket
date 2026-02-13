using AfroMarket.MerchantService.Models.Enums;

namespace AfroMarket.MerchantService.Models.Entities;

public class Business
{
    public Guid Id { get; set; }
    public Guid OwnerId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
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
}
