using AfroMarket.MerchantService.Extensions;
using AfroMarket.MerchantService.Models.DTOs;
using AfroMarket.MerchantService.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AfroMarket.MerchantService.Controllers;

[ApiController]
[Route("api/messages")]
public class MessageController : ControllerBase
{
    private readonly IMessageService _messageService;
    private readonly ILogger<MessageController> _logger;

    public MessageController(IMessageService messageService, ILogger<MessageController> logger)
    {
        _messageService = messageService;
        _logger = logger;
    }

    /// <summary>
    /// Public: send a message to a business (ContactForm)
    /// </summary>
    [AllowAnonymous]
    [HttpPost]
    [ProducesResponseType(typeof(MessageSummaryDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<MessageSummaryDto>> SendMessage([FromBody] SendMessageRequest request)
    {
        try
        {
            var result = await _messageService.SendAsync(request);
            return StatusCode(201, result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending message to business {BusinessId}", request.BusinessId);
            return StatusCode(500, new { error = "An error occurred while sending the message" });
        }
    }

    /// <summary>
    /// Merchant: get inbox for a business
    /// </summary>
    [Authorize(Policy = "MerchantOnly")]
    [HttpGet]
    [ProducesResponseType(typeof(PaginatedResponse<MessageSummaryDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PaginatedResponse<MessageSummaryDto>>> GetInbox(
        [FromQuery] Guid businessId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var merchantId = User.GetUserId();
            var result = await _messageService.GetInboxAsync(businessId, merchantId, page, pageSize);
            return Ok(result);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching inbox for business {BusinessId}", businessId);
            return StatusCode(500, new { error = "An error occurred while fetching messages" });
        }
    }

    /// <summary>
    /// Merchant: get full thread for a message
    /// </summary>
    [Authorize(Policy = "MerchantOnly")]
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(IList<MessageDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IList<MessageDetailDto>>> GetThread([FromRoute] Guid id)
    {
        try
        {
            var merchantId = User.GetUserId();
            var result = await _messageService.GetThreadAsync(id, merchantId);
            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = "Message not found" });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching thread for message {MessageId}", id);
            return StatusCode(500, new { error = "An error occurred while fetching the message thread" });
        }
    }

    /// <summary>
    /// Merchant: mark a message as read
    /// </summary>
    [Authorize(Policy = "MerchantOnly")]
    [HttpPatch("{id:guid}/read")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> MarkRead([FromRoute] Guid id)
    {
        try
        {
            var merchantId = User.GetUserId();
            await _messageService.MarkReadAsync(id, merchantId);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = "Message not found" });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking message {MessageId} as read", id);
            return StatusCode(500, new { error = "An error occurred" });
        }
    }

    /// <summary>
    /// Merchant: reply to a message thread
    /// </summary>
    [Authorize(Policy = "MerchantOnly")]
    [HttpPost("{id:guid}/reply")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Reply([FromRoute] Guid id, [FromBody] ReplyMessageRequest request)
    {
        try
        {
            var merchantId = User.GetUserId();
            var merchantEmail = User.GetUserEmail();
            var merchantName = User.FindFirst("name")?.Value
                ?? User.FindFirst("preferred_username")?.Value
                ?? merchantEmail;

            await _messageService.ReplyAsync(id, request.Content, merchantId, merchantEmail, merchantName);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = "Message not found" });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error replying to message {MessageId}", id);
            return StatusCode(500, new { error = "An error occurred while sending the reply" });
        }
    }
}
