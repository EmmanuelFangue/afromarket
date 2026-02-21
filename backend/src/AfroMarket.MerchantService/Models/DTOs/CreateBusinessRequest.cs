using System.ComponentModel.DataAnnotations;
using AfroMarket.MerchantService.Resources;

namespace AfroMarket.MerchantService.Models.DTOs;

public class CreateBusinessRequest
{
    [Required(ErrorMessageResourceType = typeof(SharedResources), ErrorMessageResourceName = "Business.Name.Required")]
    [StringLength(200, MinimumLength = 2, ErrorMessageResourceType = typeof(SharedResources), ErrorMessageResourceName = "Business.Name.Length")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessageResourceType = typeof(SharedResources), ErrorMessageResourceName = "Business.Description.Required")]
    [StringLength(2000, MinimumLength = 10, ErrorMessageResourceType = typeof(SharedResources), ErrorMessageResourceName = "Business.Description.Length")]
    public string Description { get; set; } = string.Empty;

    [Required(ErrorMessageResourceType = typeof(SharedResources), ErrorMessageResourceName = "Business.Category.Required")]
    public Guid CategoryId { get; set; }

    [Required(ErrorMessageResourceType = typeof(SharedResources), ErrorMessageResourceName = "Business.Address.Required")]
    public AddressDto Address { get; set; } = null!;

    [Phone(ErrorMessageResourceType = typeof(SharedResources), ErrorMessageResourceName = "Business.Phone.Invalid")]
    [StringLength(50)]
    public string? Phone { get; set; }

    [EmailAddress(ErrorMessageResourceType = typeof(SharedResources), ErrorMessageResourceName = "Business.Email.Invalid")]
    [StringLength(255)]
    public string? Email { get; set; }

    [Url(ErrorMessageResourceType = typeof(SharedResources), ErrorMessageResourceName = "Business.Website.Invalid")]
    [StringLength(500)]
    public string? Website { get; set; }

    public List<string> Tags { get; set; } = new();
}
