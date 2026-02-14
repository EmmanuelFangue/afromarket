using System.ComponentModel.DataAnnotations;

namespace AfroMarket.MerchantService.Models.DTOs;

public class CreateItemRequest
{
    [Required(ErrorMessage = "Business ID is required")]
    public Guid BusinessId { get; set; }

    [Required(ErrorMessage = "Title is required")]
    [StringLength(200, MinimumLength = 3, ErrorMessage = "Title must be 3-200 characters")]
    public string Title { get; set; } = string.Empty;

    [Required(ErrorMessage = "Description is required")]
    [StringLength(5000, MinimumLength = 10, ErrorMessage = "Description must be 10-5000 characters")]
    public string Description { get; set; } = string.Empty;

    [Required(ErrorMessage = "Price is required")]
    [Range(0.01, 999999.99, ErrorMessage = "Price must be between 0.01 and 999999.99")]
    public decimal Price { get; set; }

    [Required(ErrorMessage = "Currency is required")]
    [RegularExpression("^(CAD|USD|EUR|XOF|XAF)$", ErrorMessage = "Currency must be CAD, USD, EUR, XOF, or XAF")]
    [StringLength(3, MinimumLength = 3)]
    public string Currency { get; set; } = "CAD";

    [StringLength(100)]
    public string? SKU { get; set; }

    public bool IsAvailable { get; set; } = true;

    [Required(ErrorMessage = "At least one media item is required")]
    [MinLength(1, ErrorMessage = "At least one media item is required")]
    public List<CreateMediaRequest> Media { get; set; } = new();
}
