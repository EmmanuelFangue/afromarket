using AfroMarket.MerchantService.Models.Enums;

namespace AfroMarket.MerchantService.Models.Entities;

public class User
{
    // ID from Keycloak (sub claim from JWT)
    public Guid Id { get; set; }

    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? PreferredUsername { get; set; }

    // Roles are managed in Keycloak, but we cache them here for queries
    public UserRole Role { get; set; } = UserRole.Merchant;

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }

    // Navigation property
    public ICollection<Business> Businesses { get; set; } = new List<Business>();
}
