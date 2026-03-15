using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;

namespace AfroMarket.MerchantService.Models.DTOs;

public class RegisterRequest
{
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password is required")]
    public string Password { get; set; } = string.Empty;

    [Required(ErrorMessage = "First name is required")]
    [MaxLength(100)]
    public string FirstName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Last name is required")]
    [MaxLength(100)]
    public string LastName { get; set; } = string.Empty;

    /// <summary>
    /// Allowed values: "user" | "merchant". "admin" is forbidden at signup.
    /// Defaults to "user" if omitted.
    /// </summary>
    public string Role { get; set; } = "user";

    public Dictionary<string, string>? Attributes { get; set; }

    public IEnumerable<ValidationResult> ValidatePassword()
    {
        // Min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char
        var regex = new Regex(@"^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&#^()_+=\-]).{8,}$");
        if (!regex.IsMatch(Password))
        {
            yield return new ValidationResult(
                "Password must be at least 8 characters and include 1 uppercase, 1 lowercase, 1 digit, and 1 special character",
                new[] { nameof(Password) });
        }
    }
}
