using AfroMarket.MerchantService.Models.Enums;

namespace AfroMarket.MerchantService.Models.DTOs;

public class AdminUserResponse
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? PreferredUsername { get; set; }
    public UserRole Role { get; set; }
    public bool IsEnabled { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public int BusinessCount { get; set; }
}
