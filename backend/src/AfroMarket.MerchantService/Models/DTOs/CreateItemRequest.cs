using System.ComponentModel.DataAnnotations;
using AfroMarket.MerchantService.Resources;

namespace AfroMarket.MerchantService.Models.DTOs;

public class CreateItemRequest
{
    [Required(ErrorMessageResourceType = typeof(SharedResources), ErrorMessageResourceName = "Item.BusinessId.Required")]
    public Guid BusinessId { get; set; }

    [Required(ErrorMessageResourceType = typeof(SharedResources), ErrorMessageResourceName = "Item.Title.Required")]
    [StringLength(200, MinimumLength = 3, ErrorMessageResourceType = typeof(SharedResources), ErrorMessageResourceName = "Item.Title.Length")]
    public string Title { get; set; } = string.Empty;

    [Required(ErrorMessageResourceType = typeof(SharedResources), ErrorMessageResourceName = "Item.Description.Required")]
    [StringLength(5000, MinimumLength = 10, ErrorMessageResourceType = typeof(SharedResources), ErrorMessageResourceName = "Item.Description.Length")]
    public string Description { get; set; } = string.Empty;

    [Required(ErrorMessageResourceType = typeof(SharedResources), ErrorMessageResourceName = "Item.Price.Required")]
    [Range(0.01, 999999.99, ErrorMessageResourceType = typeof(SharedResources), ErrorMessageResourceName = "Item.Price.Range")]
    public decimal Price { get; set; }

    [Required(ErrorMessageResourceType = typeof(SharedResources), ErrorMessageResourceName = "Item.Currency.Required")]
    [RegularExpression("^(CAD|USD|EUR|XOF|XAF)$", ErrorMessageResourceType = typeof(SharedResources), ErrorMessageResourceName = "Item.Currency.Invalid")]
    [StringLength(3, MinimumLength = 3)]
    public string Currency { get; set; } = "CAD";

    [StringLength(100)]
    public string? SKU { get; set; }

    public bool IsAvailable { get; set; } = true;

    [Required(ErrorMessageResourceType = typeof(SharedResources), ErrorMessageResourceName = "Item.Media.Required")]
    [MinLength(1, ErrorMessageResourceType = typeof(SharedResources), ErrorMessageResourceName = "Item.Media.Required")]
    public List<CreateMediaRequest> Media { get; set; } = new();
}
