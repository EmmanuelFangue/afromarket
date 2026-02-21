using Microsoft.AspNetCore.Mvc;
using AfroMarket.SearchService.Models;
using AfroMarket.SearchService.Services;

namespace AfroMarket.SearchService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SearchController : ControllerBase
{
    private readonly ISearchService _searchService;
    private readonly ILogger<SearchController> _logger;

    public SearchController(ISearchService searchService, ILogger<SearchController> logger)
    {
        _searchService = searchService;
        _logger = logger;
    }

    [HttpPost]
    public async Task<ActionResult<SearchResponse>> Search([FromBody] BusinessSearchRequest request)
    {
        try
        {
            var results = await _searchService.SearchBusinessesAsync(request);
            return Ok(results);
        }
        catch (Exception ex)
        {
            var correlationId = Guid.NewGuid();
            _logger.LogError(ex, "Error performing search. CorrelationId: {CorrelationId}", correlationId);
            return StatusCode(500, new { error = "An error occurred while searching", correlationId });
        }
    }

    [HttpPost("index")]
    public async Task<ActionResult> IndexBusiness([FromBody] Business business)
    {
        try
        {
            var success = await _searchService.IndexBusinessAsync(business);
            if (success)
            {
                return Ok(new { message = "Business indexed successfully" });
            }
            return StatusCode(500, new { error = "Failed to index business" });
        }
        catch (Exception ex)
        {
            var correlationId = Guid.NewGuid();
            _logger.LogError(ex, "Error indexing business. CorrelationId: {CorrelationId}", correlationId);
            return StatusCode(500, new { error = "An error occurred while indexing", correlationId });
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteBusiness(string id)
    {
        try
        {
            var success = await _searchService.DeleteBusinessAsync(id);
            if (success)
            {
                return Ok(new { message = "Business deleted successfully" });
            }
            return StatusCode(500, new { error = "Failed to delete business" });
        }
        catch (Exception ex)
        {
            var correlationId = Guid.NewGuid();
            _logger.LogError(ex, "Error deleting business. CorrelationId: {CorrelationId}", correlationId);
            return StatusCode(500, new { error = "An error occurred while deleting", correlationId });
        }
    }
}
