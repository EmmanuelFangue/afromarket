using AfroMarket.SearchService.Models;

namespace AfroMarket.SearchService.Services;

public interface IMerchantServiceClient
{
    Task<PaginatedResult<BusinessDto>> GetPublishedBusinessesAsync(int page = 1, int pageSize = 100);
}
