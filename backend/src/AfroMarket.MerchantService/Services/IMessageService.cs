using AfroMarket.MerchantService.Models.DTOs;

namespace AfroMarket.MerchantService.Services;

public interface IMessageService
{
    /// <summary>
    /// Returns paginated inbox (root messages only) for a business owned by merchantId
    /// </summary>
    Task<PaginatedResponse<MessageSummaryDto>> GetInboxAsync(Guid businessId, Guid merchantId, int page, int pageSize);

    /// <summary>
    /// Returns full thread (root + replies) for a message owned by merchantId's business
    /// </summary>
    Task<IList<MessageDetailDto>> GetThreadAsync(Guid messageId, Guid merchantId);

    /// <summary>
    /// Public endpoint — sends a new root message (no auth required)
    /// </summary>
    Task<MessageSummaryDto> SendAsync(SendMessageRequest request);

    /// <summary>
    /// Merchant replies to an existing message thread
    /// </summary>
    Task ReplyAsync(Guid messageId, string content, Guid merchantId, string merchantEmail, string merchantName);

    /// <summary>
    /// Marks a root message as read (only by the owning merchant)
    /// </summary>
    Task MarkReadAsync(Guid messageId, Guid merchantId);
}
