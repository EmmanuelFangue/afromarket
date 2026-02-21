using System.ComponentModel.DataAnnotations;
using AfroMarket.MerchantService.Models.Enums;

namespace AfroMarket.MerchantService.Models.DTOs;

public class CreateMediaRequest
{
    [Required(ErrorMessage = "Media URL is required")]
    [Url(ErrorMessage = "Must be a valid URL")]
    [StringLength(1000)]
    public string Url { get; set; } = string.Empty;

    [Required]
    public MediaType Type { get; set; } = MediaType.Image;

    [StringLength(255)]
    public string? FileName { get; set; }

    [StringLength(500)]
    public string? AltText { get; set; }

    public long? FileSizeBytes { get; set; }
}
