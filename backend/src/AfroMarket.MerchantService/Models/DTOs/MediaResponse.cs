using AfroMarket.MerchantService.Models.Enums;

namespace AfroMarket.MerchantService.Models.DTOs;

public class MediaResponse
{
    public Guid Id { get; set; }
    public string Url { get; set; } = string.Empty;
    public MediaType Type { get; set; }
    public int OrderIndex { get; set; }
    public string? FileName { get; set; }
    public string? AltText { get; set; }
    public long? FileSizeBytes { get; set; }
    public DateTime CreatedAt { get; set; }
}
