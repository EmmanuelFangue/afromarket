using System.ComponentModel.DataAnnotations;
using AfroMarket.MerchantService.Resources;

namespace AfroMarket.MerchantService.Models.DTOs;

public class CreateBusinessRequest
{
    /// <summary>
    /// Nom multilingue : {"fr": "...", "en": "..."}
    /// </summary>
    [Required]
    public Dictionary<string, string> Name { get; set; } = new();

    /// <summary>
    /// Description multilingue : {"fr": "...", "en": "..."}
    /// </summary>
    [Required]
    public Dictionary<string, string> Description { get; set; } = new();

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
