using System.ComponentModel.DataAnnotations;
using AfroMarket.MerchantService.Resources;

namespace AfroMarket.MerchantService.Models.DTOs;

public class CreateProductRequest
{
    [Required(ErrorMessageResourceType = typeof(SharedResources), ErrorMessageResourceName = "Product.BusinessId.Required")]
    public Guid BusinessId { get; set; }

    [Required(ErrorMessageResourceType = typeof(SharedResources), ErrorMessageResourceName = "Product.Title.Required")]
    [StringLength(200, MinimumLength = 3, ErrorMessageResourceType = typeof(SharedResources), ErrorMessageResourceName = "Product.Title.Length")]
    public string Title { get; set; } = string.Empty;

    [Required(ErrorMessageResourceType = typeof(SharedResources), ErrorMessageResourceName = "Product.Description.Required")]
    [StringLength(5000, MinimumLength = 10, ErrorMessageResourceType = typeof(SharedResources), ErrorMessageResourceName = "Product.Description.Length")]
    public string Description { get; set; } = string.Empty;

    [Required(ErrorMessageResourceType = typeof(SharedResources), ErrorMessageResourceName = "Product.Price.Required")]
    [Range(0.01, 999999.99, ErrorMessageResourceType = typeof(SharedResources), ErrorMessageResourceName = "Product.Price.Range")]
    public decimal Price { get; set; }

    [Required(ErrorMessageResourceType = typeof(SharedResources), ErrorMessageResourceName = "Product.Currency.Required")]
    [RegularExpression("^(CAD|USD|EUR|XOF|XAF)$", ErrorMessageResourceType = typeof(SharedResources), ErrorMessageResourceName = "Product.Currency.Invalid")]
    [StringLength(3, MinimumLength = 3)]
    public string Currency { get; set; } = "CAD";

    [StringLength(100)]
    public string? SKU { get; set; }

    public bool IsAvailable { get; set; } = true;

    [Required(ErrorMessageResourceType = typeof(SharedResources), ErrorMessageResourceName = "Product.Media.Required")]
    [MinLength(1, ErrorMessageResourceType = typeof(SharedResources), ErrorMessageResourceName = "Product.Media.Required")]
    public List<CreateMediaRequest> Media { get; set; } = new();
}
