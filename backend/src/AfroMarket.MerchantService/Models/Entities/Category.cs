namespace AfroMarket.MerchantService.Models.Entities;

public class Category
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;

    // Navigation property
    public ICollection<Business> Businesses { get; set; } = new List<Business>();
}
