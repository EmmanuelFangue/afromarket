using System.ComponentModel.DataAnnotations;

namespace AfroMarket.MerchantService.Models.DTOs;

public class UpdateBusinessRequest
{
    [StringLength(200, MinimumLength = 2, ErrorMessage = "Le nom doit contenir entre 2 et 200 caractères")]
    public string? Name { get; set; }

    [StringLength(2000, MinimumLength = 10, ErrorMessage = "La description doit contenir entre 10 et 2000 caractères")]
    public string? Description { get; set; }

    public Guid? CategoryId { get; set; }

    public AddressDto? Address { get; set; }

    [Phone(ErrorMessage = "Le numéro de téléphone n'est pas valide")]
    [StringLength(50)]
    public string? Phone { get; set; }

    [EmailAddress(ErrorMessage = "L'adresse email n'est pas valide")]
    [StringLength(255)]
    public string? Email { get; set; }

    [Url(ErrorMessage = "Le site web n'est pas une URL valide")]
    [StringLength(500)]
    public string? Website { get; set; }

    public List<string>? Tags { get; set; }
}
