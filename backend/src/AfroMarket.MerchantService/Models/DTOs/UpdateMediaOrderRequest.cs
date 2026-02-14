namespace AfroMarket.MerchantService.Models.DTOs;

public class UpdateMediaOrderRequest
{
    public Guid MediaId { get; set; }
    public int NewOrderIndex { get; set; }
}
