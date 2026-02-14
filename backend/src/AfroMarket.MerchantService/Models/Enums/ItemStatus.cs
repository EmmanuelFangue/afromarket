namespace AfroMarket.MerchantService.Models.Enums;

/// <summary>
/// Item lifecycle statuses
/// </summary>
public enum ItemStatus
{
    /// <summary>
    /// Draft status - item is being created/edited, not visible to public
    /// </summary>
    Draft = 0,

    /// <summary>
    /// Active status - item is published and visible to customers
    /// </summary>
    Active = 1,

    /// <summary>
    /// Suspended status - item is temporarily hidden (admin action or out of stock)
    /// </summary>
    Suspended = 2
}
