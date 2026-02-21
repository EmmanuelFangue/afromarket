using System.ComponentModel.DataAnnotations;

namespace AfroMarket.MerchantService.Models.DTOs;

public class UpdateItemRequest
{
    [StringLength(200, MinimumLength = 3)]
    public string? Title { get; set; }

    [StringLength(5000, MinimumLength = 10)]
    public string? Description { get; set; }

    [Range(0.01, 999999.99)]
    public decimal? Price { get; set; }

    [RegularExpression("^(CAD|USD|EUR|XOF|XAF)$")]
    [StringLength(3, MinimumLength = 3)]
    public string? Currency { get; set; }

    [StringLength(100)]
    public string? SKU { get; set; }

    public bool? IsAvailable { get; set; }

    // Media management (optional)
    public List<CreateMediaRequest>? MediaToAdd { get; set; }
    public List<Guid>? MediaToRemove { get; set; }
    public List<UpdateMediaOrderRequest>? MediaOrderUpdates { get; set; }
}
