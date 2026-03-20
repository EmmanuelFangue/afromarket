using AfroMarket.MerchantService.Data;
using AfroMarket.MerchantService.Models.DTOs;
using AfroMarket.MerchantService.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace AfroMarket.MerchantService.Services;

public class MessageService : IMessageService
{
    private readonly MerchantDbContext _context;
    private readonly ILogger<MessageService> _logger;

    public MessageService(MerchantDbContext context, ILogger<MessageService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<PaginatedResponse<MessageSummaryDto>> GetInboxAsync(
        Guid businessId, Guid merchantId, int page, int pageSize)
    {
        // Verify ownership
        var businessExists = await _context.Businesses
            .AnyAsync(b => b.Id == businessId && b.OwnerId == merchantId);

        if (!businessExists)
            throw new UnauthorizedAccessException("Business not found or not owned by this merchant");

        var query = _context.Messages
            .Where(m => m.BusinessId == businessId && m.ParentMessageId == null)
            .OrderByDescending(m => m.CreatedAt);

        var totalCount = await query.CountAsync();

        var messages = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(m => new
            {
                m.Id,
                m.SenderName,
                m.SenderEmail,
                m.Content,
                m.CreatedAt,
                m.IsRead,
                ReplyCount = m.Replies.Count(),
                LastActivityAt = m.Replies.Any()
                    ? m.Replies.Max(r => r.CreatedAt)
                    : m.CreatedAt
            })
            .ToListAsync();

        return new PaginatedResponse<MessageSummaryDto>
        {
            Items = messages.Select(m => new MessageSummaryDto
            {
                Id = m.Id,
                SenderName = m.SenderName,
                SenderEmail = m.SenderEmail,
                ContentPreview = m.Content.Length > 150 ? m.Content[..150] + "..." : m.Content,
                CreatedAt = m.CreatedAt,
                IsRead = m.IsRead,
                ReplyCount = m.ReplyCount,
                LastActivityAt = m.LastActivityAt
            }).ToList(),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<IList<MessageDetailDto>> GetThreadAsync(Guid messageId, Guid merchantId)
    {
        var root = await _context.Messages
            .Include(m => m.Business)
            .FirstOrDefaultAsync(m => m.Id == messageId && m.ParentMessageId == null);

        if (root == null)
            throw new KeyNotFoundException("Message not found");

        if (root.Business.OwnerId != merchantId)
            throw new UnauthorizedAccessException("Access denied");

        var thread = await _context.Messages
            .Where(m => m.Id == messageId || m.ParentMessageId == messageId)
            .OrderBy(m => m.CreatedAt)
            .ToListAsync();

        return thread.Select(m => new MessageDetailDto
        {
            Id = m.Id,
            SenderName = m.SenderName,
            Content = m.Content,
            CreatedAt = m.CreatedAt,
            IsFromMerchant = m.IsFromMerchant
        }).ToList();
    }

    public async Task<MessageSummaryDto> SendAsync(SendMessageRequest request)
    {
        var businessExists = await _context.Businesses.AnyAsync(b => b.Id == request.BusinessId);
        if (!businessExists)
            throw new KeyNotFoundException("Business not found");

        if (string.IsNullOrWhiteSpace(request.SenderName))
            throw new ArgumentException("Sender name is required");
        if (string.IsNullOrWhiteSpace(request.SenderEmail))
            throw new ArgumentException("Sender email is required");
        if (string.IsNullOrWhiteSpace(request.Content))
            throw new ArgumentException("Message content is required");

        var message = new Message
        {
            Id = Guid.NewGuid(),
            BusinessId = request.BusinessId,
            SenderName = request.SenderName.Trim(),
            SenderEmail = request.SenderEmail.Trim().ToLowerInvariant(),
            Content = request.Content.Trim(),
            CreatedAt = DateTime.UtcNow,
            IsRead = false,
            IsFromMerchant = false
        };

        _context.Messages.Add(message);
        await _context.SaveChangesAsync();

        return new MessageSummaryDto
        {
            Id = message.Id,
            SenderName = message.SenderName,
            SenderEmail = message.SenderEmail,
            ContentPreview = message.Content.Length > 150 ? message.Content[..150] + "..." : message.Content,
            CreatedAt = message.CreatedAt,
            IsRead = false,
            ReplyCount = 0,
            LastActivityAt = message.CreatedAt
        };
    }

    public async Task ReplyAsync(Guid messageId, string content, Guid merchantId, string merchantEmail, string merchantName)
    {
        if (string.IsNullOrWhiteSpace(content))
            throw new ArgumentException("Reply content is required");

        var root = await _context.Messages
            .Include(m => m.Business)
            .FirstOrDefaultAsync(m => m.Id == messageId && m.ParentMessageId == null);

        if (root == null)
            throw new KeyNotFoundException("Message not found");

        if (root.Business.OwnerId != merchantId)
            throw new UnauthorizedAccessException("Access denied");

        var reply = new Message
        {
            Id = Guid.NewGuid(),
            BusinessId = root.BusinessId,
            ParentMessageId = messageId,
            SenderName = merchantName,
            SenderEmail = merchantEmail,
            Content = content.Trim(),
            CreatedAt = DateTime.UtcNow,
            IsFromMerchant = true,
            IsRead = true
        };

        _context.Messages.Add(reply);
        await _context.SaveChangesAsync();
    }

    public async Task MarkReadAsync(Guid messageId, Guid merchantId)
    {
        var message = await _context.Messages
            .Include(m => m.Business)
            .FirstOrDefaultAsync(m => m.Id == messageId && m.ParentMessageId == null);

        if (message == null)
            throw new KeyNotFoundException("Message not found");

        if (message.Business.OwnerId != merchantId)
            throw new UnauthorizedAccessException("Access denied");

        if (!message.IsRead)
        {
            message.IsRead = true;
            await _context.SaveChangesAsync();
        }
    }
}
