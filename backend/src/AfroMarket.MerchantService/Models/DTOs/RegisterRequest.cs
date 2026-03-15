using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;
using AfroMarket.MerchantService.Resources;

namespace AfroMarket.MerchantService.Models.DTOs;

public class RegisterRequest
{
    [Required(ErrorMessageResourceType = typeof(SharedResources), ErrorMessageResourceName = "Auth.Email.Required")]
    [EmailAddress(ErrorMessageResourceType = typeof(SharedResources), ErrorMessageResourceName = "Auth.Email.Invalid")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessageResourceType = typeof(SharedResources), ErrorMessageResourceName = "Auth.Password.Required")]
    public string Password { get; set; } = string.Empty;

    [Required(ErrorMessageResourceType = typeof(SharedResources), ErrorMessageResourceName = "Auth.FirstName.Required")]
    [MaxLength(100)]
    public string FirstName { get; set; } = string.Empty;

    [Required(ErrorMessageResourceType = typeof(SharedResources), ErrorMessageResourceName = "Auth.LastName.Required")]
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
