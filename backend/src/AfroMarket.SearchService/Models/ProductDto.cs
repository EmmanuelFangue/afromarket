namespace AfroMarket.SearchService.Models;

public class ProductDto
{
    public Guid Id { get; set; }
    public Guid BusinessId { get; set; }
    public string BusinessName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string TitleTranslations { get; set; } = string.Empty;
    public string DescriptionTranslations { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string Currency { get; set; } = string.Empty;
    public List<MediaDto> Media { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class MediaDto
{
    public string Url { get; set; } = string.Empty;
    public int OrderIndex { get; set; }
}
