namespace AfroMarket.MerchantService.Models.Entities;

public class Message
{
    public Guid Id { get; set; }
    public Guid BusinessId { get; set; }
    public string SenderEmail { get; set; } = string.Empty;
    public string SenderName { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }

    // Navigation property
    public Business Business { get; set; } = null!;
}
