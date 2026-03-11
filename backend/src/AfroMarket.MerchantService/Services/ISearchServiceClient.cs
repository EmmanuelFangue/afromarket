using AfroMarket.MerchantService.Models.DTOs;

namespace AfroMarket.MerchantService.Services;

public interface ISearchServiceClient
{
    /// <summary>
    /// Notifies the SearchService to index a newly approved business.
    /// </summary>
    Task<bool> IndexBusinessAsync(BusinessResponse business);

    /// <summary>
    /// Notifies the SearchService to remove a business from the index.
    /// </summary>
    Task<bool> DeleteBusinessAsync(string businessId);
}
