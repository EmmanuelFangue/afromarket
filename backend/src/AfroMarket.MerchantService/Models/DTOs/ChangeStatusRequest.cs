using AfroMarket.MerchantService.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace AfroMarket.MerchantService.Models.DTOs;

public class ChangeStatusRequest
{
    [Required]
    [EnumDataType(typeof(ProductStatus))]
    public ProductStatus Status { get; set; }
}
