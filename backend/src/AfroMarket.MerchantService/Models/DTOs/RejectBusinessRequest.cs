using System.ComponentModel.DataAnnotations;

namespace AfroMarket.MerchantService.Models.DTOs;

public class RejectBusinessRequest
{
    [Required]
    [MinLength(10, ErrorMessage = "Rejection reason must be at least 10 characters.")]
    public string RejectionReason { get; set; } = string.Empty;
}
