namespace AfroMarket.MerchantService.Models.Entities;

public class Message
{
    public Guid Id { get; set; }
    public Guid BusinessId { get; set; }
    public string SenderEmail { get; set; } = string.Empty;
    public string SenderName { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public bool IsRead { get; set; } = false;
    public bool IsFromMerchant { get; set; } = false;
    public Guid? ParentMessageId { get; set; }  // null = root message

    // Navigation properties
    public Business Business { get; set; } = null!;
    public Message? ParentMessage { get; set; }
    public ICollection<Message> Replies { get; set; } = new List<Message>();
}
