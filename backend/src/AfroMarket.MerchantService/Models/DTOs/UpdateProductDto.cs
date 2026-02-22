using System.ComponentModel.DataAnnotations;

namespace AfroMarket.MerchantService.Models.DTOs;

public class UpdateProductDto
{
    [MaxLength(200, ErrorMessage = "Le nom ne peut pas dépasser 200 caractères")]
    public string? Name { get; set; }

    [MaxLength(2000, ErrorMessage = "La description ne peut pas dépasser 2000 caractères")]
    public string? Description { get; set; }

    [Range(0.01, double.MaxValue, ErrorMessage = "Le prix doit être supérieur à 0")]
    public decimal? Price { get; set; }

    [MaxLength(50)]
    public string? Category { get; set; }

    public bool? IsActive { get; set; }

    public List<string>? ImageUrls { get; set; }
}
