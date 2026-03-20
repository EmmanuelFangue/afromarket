namespace AfroMarket.MerchantService.Models.DTOs;

public class MessageSummaryDto
{
    public Guid Id { get; set; }
    public string SenderName { get; set; } = string.Empty;
    public string SenderEmail { get; set; } = string.Empty;
    public string ContentPreview { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public bool IsRead { get; set; }
    public int ReplyCount { get; set; }
    public DateTime LastActivityAt { get; set; }
}

public class MessageDetailDto
{
    public Guid Id { get; set; }
    public string SenderName { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public bool IsFromMerchant { get; set; }
}

public class SendMessageRequest
{
    public Guid BusinessId { get; set; }
    public string SenderName { get; set; } = string.Empty;
    public string SenderEmail { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
}

public class ReplyMessageRequest
{
    public string Content { get; set; } = string.Empty;
}
