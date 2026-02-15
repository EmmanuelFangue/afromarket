using AfroMarket.MerchantService.Data;
using AfroMarket.MerchantService.Models.DTOs;
using AfroMarket.MerchantService.Models.Entities;
using AfroMarket.MerchantService.Models.Enums;
using AfroMarket.MerchantService.Resources;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;
using System.Text.Json;

namespace AfroMarket.MerchantService.Services;

public class BusinessService : IBusinessService
{
    private readonly MerchantDbContext _context;
    private readonly ILogger<BusinessService> _logger;
    private readonly IStringLocalizer<SharedResources> _localizer;

    public BusinessService(
        MerchantDbContext context,
        ILogger<BusinessService> logger,
        IStringLocalizer<SharedResources> localizer)
    {
        _context = context;
        _logger = logger;
        _localizer = localizer;
    }

    public async Task<BusinessResponse> CreateBusinessAsync(CreateBusinessRequest request, Guid ownerId)
    {
        _logger.LogInformation("Creating new business for owner {OwnerId}", ownerId);

        // Vérifier que la catégorie existe
        var categoryExists = await _context.Categories.AnyAsync(c => c.Id == request.CategoryId);
        if (!categoryExists)
        {
            throw new ArgumentException(string.Format(_localizer["Error.CategoryNotFound"].Value, request.CategoryId));
        }

        // Créer l'adresse
        var address = new Address
        {
            Id = Guid.NewGuid(),
            Street = request.Address.Street,
            City = request.Address.City,
            Province = request.Address.Province,
            PostalCode = request.Address.PostalCode,
            Country = request.Address.Country,
            Latitude = request.Address.Latitude,
            Longitude = request.Address.Longitude
        };

        // Créer le commerce
        var business = new Business
        {
            Id = Guid.NewGuid(),
            OwnerId = ownerId,
            Name = request.Name,
            Description = request.Description,
            Status = BusinessStatus.Draft,
            CategoryId = request.CategoryId,
            AddressId = address.Id,
            Address = address,
            Phone = request.Phone ?? string.Empty,
            Email = request.Email ?? string.Empty,
            Website = request.Website ?? string.Empty,
            Tags = JsonSerializer.Serialize(request.Tags),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Addresses.Add(address);
        _context.Businesses.Add(business);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Business {BusinessId} created successfully", business.Id);

        return await MapToResponseAsync(business);
    }

    public async Task<BusinessResponse> UpdateBusinessAsync(Guid businessId, UpdateBusinessRequest request, Guid ownerId)
    {
        _logger.LogInformation("Updating business {BusinessId} for owner {OwnerId}", businessId, ownerId);

        var business = await _context.Businesses
            .Include(b => b.Address)
            .Include(b => b.Category)
            .FirstOrDefaultAsync(b => b.Id == businessId);

        if (business == null)
        {
            throw new KeyNotFoundException(string.Format(_localizer["Error.BusinessNotFound"].Value, businessId));
        }

        // Vérifier que l'utilisateur est propriétaire
        if (business.OwnerId != ownerId)
        {
            throw new UnauthorizedAccessException(_localizer["Error.Unauthorized"].Value);
        }

        // Vérifier que le statut permet la modification
        if (business.Status != BusinessStatus.Draft)
        {
            throw new InvalidOperationException(string.Format(_localizer["Error.CannotUpdateStatus"].Value, business.Status));
        }

        // Mettre à jour les champs si fournis
        if (!string.IsNullOrWhiteSpace(request.Name))
        {
            business.Name = request.Name;
        }

        if (!string.IsNullOrWhiteSpace(request.Description))
        {
            business.Description = request.Description;
        }

        if (request.CategoryId.HasValue)
        {
            var categoryExists = await _context.Categories.AnyAsync(c => c.Id == request.CategoryId.Value);
            if (!categoryExists)
            {
                throw new ArgumentException(string.Format(_localizer["Error.CategoryNotFound"].Value, request.CategoryId));
            }
            business.CategoryId = request.CategoryId.Value;
        }

        if (request.Address != null)
        {
            business.Address.Street = request.Address.Street;
            business.Address.City = request.Address.City;
            business.Address.Province = request.Address.Province;
            business.Address.PostalCode = request.Address.PostalCode;
            business.Address.Country = request.Address.Country;
            business.Address.Latitude = request.Address.Latitude;
            business.Address.Longitude = request.Address.Longitude;
        }

        if (request.Phone != null)
        {
            business.Phone = request.Phone;
        }

        if (request.Email != null)
        {
            business.Email = request.Email;
        }

        if (request.Website != null)
        {
            business.Website = request.Website;
        }

        if (request.Tags != null)
        {
            business.Tags = JsonSerializer.Serialize(request.Tags);
        }

        business.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Business {BusinessId} updated successfully", businessId);

        return await MapToResponseAsync(business);
    }

    public async Task<BusinessResponse?> GetBusinessByIdAsync(Guid businessId)
    {
        var business = await _context.Businesses
            .Include(b => b.Address)
            .Include(b => b.Category)
            .FirstOrDefaultAsync(b => b.Id == businessId);

        return business == null ? null : await MapToResponseAsync(business);
    }

    public async Task<List<BusinessResponse>> GetBusinessesByOwnerAsync(Guid ownerId)
    {
        var businesses = await _context.Businesses
            .Include(b => b.Address)
            .Include(b => b.Category)
            .Where(b => b.OwnerId == ownerId)
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync();

        var responses = new List<BusinessResponse>();
        foreach (var business in businesses)
        {
            responses.Add(await MapToResponseAsync(business));
        }

        return responses;
    }

    public async Task<bool> DeleteBusinessAsync(Guid businessId, Guid ownerId)
    {
        _logger.LogInformation("Deleting business {BusinessId} for owner {OwnerId}", businessId, ownerId);

        var business = await _context.Businesses.FindAsync(businessId);

        if (business == null)
        {
            return false;
        }

        // Vérifier que l'utilisateur est propriétaire
        if (business.OwnerId != ownerId)
        {
            throw new UnauthorizedAccessException(_localizer["Error.Unauthorized"].Value);
        }

        // Vérifier que le statut permet la suppression
        if (business.Status != BusinessStatus.Draft)
        {
            throw new InvalidOperationException(string.Format(_localizer["Error.CannotDeleteStatus"].Value, business.Status));
        }

        _context.Businesses.Remove(business);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Business {BusinessId} deleted successfully", businessId);

        return true;
    }

    public async Task<PaginatedResult<BusinessResponse>> GetPublishedBusinessesAsync(int page = 1, int pageSize = 20)
    {
        _logger.LogInformation("Fetching published businesses - Page: {Page}, PageSize: {PageSize}", page, pageSize);

        // Valider pagination
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        // Query Published businesses
        var query = _context.Businesses
            .Include(b => b.Address)
            .Include(b => b.Category)
            .Where(b => b.Status == BusinessStatus.Published)
            .OrderByDescending(b => b.PublishedAt);

        // Total count
        var totalCount = await query.CountAsync();

        // Paginate
        var businesses = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        // Map to DTOs
        var businessResponses = new List<BusinessResponse>();
        foreach (var business in businesses)
        {
            businessResponses.Add(await MapToResponseAsync(business));
        }

        _logger.LogInformation("Found {TotalCount} published businesses, returning {Count} for page {Page}",
            totalCount, businessResponses.Count, page);

        return new PaginatedResult<BusinessResponse>
        {
            Items = businessResponses,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    private async Task<BusinessResponse> MapToResponseAsync(Business business)
    {
        // Charger la catégorie si non chargée
        if (business.Category == null)
        {
            business.Category = await _context.Categories.FindAsync(business.CategoryId)
                ?? throw new InvalidOperationException("Category not found");
        }

        // Charger l'adresse si non chargée
        if (business.Address == null)
        {
            business.Address = await _context.Addresses.FindAsync(business.AddressId)
                ?? throw new InvalidOperationException("Address not found");
        }

        var tags = new List<string>();
        try
        {
            tags = JsonSerializer.Deserialize<List<string>>(business.Tags) ?? new List<string>();
        }
        catch (JsonException)
        {
            _logger.LogWarning("Failed to deserialize tags for business {BusinessId}", business.Id);
        }

        return new BusinessResponse
        {
            Id = business.Id,
            OwnerId = business.OwnerId,
            Name = business.Name,
            Description = business.Description,
            NameTranslations = business.NameTranslations,
            DescriptionTranslations = business.DescriptionTranslations,
            Status = business.Status,
            CategoryId = business.CategoryId,
            CategoryName = business.Category.Name,
            Address = new AddressDto
            {
                Street = business.Address.Street,
                City = business.Address.City,
                Province = business.Address.Province,
                PostalCode = business.Address.PostalCode,
                Country = business.Address.Country,
                Latitude = business.Address.Latitude,
                Longitude = business.Address.Longitude
            },
            Phone = business.Phone,
            Email = business.Email,
            Website = business.Website,
            Tags = tags,
            RejectionReason = business.RejectionReason,
            CreatedAt = business.CreatedAt,
            UpdatedAt = business.UpdatedAt,
            PublishedAt = business.PublishedAt
        };
    }
}
