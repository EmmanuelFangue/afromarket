using Microsoft.AspNetCore.Authorization;
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

    [HttpPost("products")]
    public async Task<ActionResult<ProductSearchResponse>> SearchProducts([FromBody] ProductSearchRequest request)
    {
        try
        {
            var results = await _searchService.SearchProductsAsync(request);
            return Ok(results);
        }
        catch (Exception ex)
        {
            var correlationId = Guid.NewGuid();
            _logger.LogError(ex, "Error performing product search. CorrelationId: {CorrelationId}", correlationId);
            return StatusCode(500, new { error = "An error occurred while searching products", correlationId });
        }
    }

    [Authorize]
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

    [Authorize]
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

    [HttpPost("products/index")]
    public async Task<ActionResult> IndexProduct([FromBody] Product product)
    {
        try
        {
            var success = await _searchService.IndexProductAsync(product);
            if (success)
            {
                return Ok(new { message = "Product indexed successfully" });
            }
            return StatusCode(500, new { error = "Failed to index product" });
        }
        catch (Exception ex)
        {
            var correlationId = Guid.NewGuid();
            _logger.LogError(ex, "Error indexing product. CorrelationId: {CorrelationId}", correlationId);
            return StatusCode(500, new { error = "An error occurred while indexing product", correlationId });
        }
    }

    [HttpDelete("products/{id}")]
    public async Task<ActionResult> DeleteProduct(string id)
    {
        try
        {
            var success = await _searchService.DeleteProductAsync(id);
            if (success)
            {
                return Ok(new { message = "Product deleted from index successfully" });
            }
            return StatusCode(500, new { error = "Failed to delete product from index" });
        }
        catch (Exception ex)
        {
            var correlationId = Guid.NewGuid();
            _logger.LogError(ex, "Error deleting product from index. CorrelationId: {CorrelationId}", correlationId);
            return StatusCode(500, new { error = "An error occurred while deleting product", correlationId });
        }
    }
}
