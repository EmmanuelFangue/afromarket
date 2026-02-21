using System.ComponentModel.DataAnnotations;
using AfroMarket.MerchantService.Resources;

namespace AfroMarket.MerchantService.Models.DTOs;

public class UpdateBusinessRequest
{
    [StringLength(200, MinimumLength = 2, ErrorMessageResourceType = typeof(SharedResources), ErrorMessageResourceName = "Business.Name.Length")]
    public string? Name { get; set; }

    [StringLength(2000, MinimumLength = 10, ErrorMessageResourceType = typeof(SharedResources), ErrorMessageResourceName = "Business.Description.Length")]
    public string? Description { get; set; }

    public Guid? CategoryId { get; set; }

    public AddressDto? Address { get; set; }

    [Phone(ErrorMessageResourceType = typeof(SharedResources), ErrorMessageResourceName = "Business.Phone.Invalid")]
    [StringLength(50)]
    public string? Phone { get; set; }

    [EmailAddress(ErrorMessageResourceType = typeof(SharedResources), ErrorMessageResourceName = "Business.Email.Invalid")]
    [StringLength(255)]
    public string? Email { get; set; }

    [Url(ErrorMessageResourceType = typeof(SharedResources), ErrorMessageResourceName = "Business.Website.Invalid")]
    [StringLength(500)]
    public string? Website { get; set; }

    public List<string>? Tags { get; set; }
}
