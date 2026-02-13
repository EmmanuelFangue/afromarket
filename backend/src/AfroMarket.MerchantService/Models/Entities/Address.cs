namespace AfroMarket.MerchantService.Models.Entities;

public class Address
{
    public Guid Id { get; set; }
    public string Street { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Province { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public string Country { get; set; } = "Canada";
    public decimal Latitude { get; set; }
    public decimal Longitude { get; set; }

    // Navigation property
    public Business? Business { get; set; }
}
