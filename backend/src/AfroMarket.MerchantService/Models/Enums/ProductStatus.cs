namespace AfroMarket.MerchantService.Models.Enums;

/// <summary>
/// Product lifecycle statuses
/// </summary>
public enum ProductStatus
{
    /// <summary>
    /// Draft status - product is being created/edited, not visible to public
    /// </summary>
    Draft = 0,

    /// <summary>
    /// Active status - product is published and visible to customers
    /// </summary>
    Active = 1,

    /// <summary>
    /// Suspended status - product is temporarily hidden (admin action or out of stock)
    /// </summary>
    Suspended = 2
}
