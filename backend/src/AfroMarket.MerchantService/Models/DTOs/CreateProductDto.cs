using System.ComponentModel.DataAnnotations;

namespace AfroMarket.MerchantService.Models.DTOs;

public class CreateProductDto
{
    [Required(ErrorMessage = "Le nom du produit est requis")]
    [MaxLength(200, ErrorMessage = "Le nom ne peut pas dépasser 200 caractères")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "La description est requise")]
    [MaxLength(2000, ErrorMessage = "La description ne peut pas dépasser 2000 caractères")]
    public string Description { get; set; } = string.Empty;

    [Required(ErrorMessage = "Le prix est requis")]
    [Range(0.01, double.MaxValue, ErrorMessage = "Le prix doit être supérieur à 0")]
    public decimal Price { get; set; }

    [Required(ErrorMessage = "La catégorie est requise")]
    [MaxLength(50)]
    public string Category { get; set; } = string.Empty;

    public List<string> ImageUrls { get; set; } = new();
}
