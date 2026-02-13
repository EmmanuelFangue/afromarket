using AfroMarket.MerchantService.Data;
using AfroMarket.MerchantService.Models.DTOs;
using AfroMarket.MerchantService.Models.Entities;
using AfroMarket.MerchantService.Models.Enums;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace AfroMarket.MerchantService.Services;

public class BusinessService : IBusinessService
{
    private readonly MerchantDbContext _context;
    private readonly ILogger<BusinessService> _logger;

    public BusinessService(MerchantDbContext context, ILogger<BusinessService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<BusinessResponse> CreateBusinessAsync(CreateBusinessRequest request, Guid ownerId)
    {
        _logger.LogInformation("Creating new business for owner {OwnerId}", ownerId);

        // Vérifier que la catégorie existe
        var categoryExists = await _context.Categories.AnyAsync(c => c.Id == request.CategoryId);
        if (!categoryExists)
        {
            throw new ArgumentException($"Category with ID {request.CategoryId} does not exist");
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
            throw new KeyNotFoundException($"Business with ID {businessId} not found");
        }

        // Vérifier que l'utilisateur est propriétaire
        if (business.OwnerId != ownerId)
        {
            throw new UnauthorizedAccessException("You are not authorized to update this business");
        }

        // Vérifier que le statut permet la modification
        if (business.Status != BusinessStatus.Draft)
        {
            throw new InvalidOperationException($"Cannot update business with status {business.Status}. Only Draft businesses can be updated.");
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
                throw new ArgumentException($"Category with ID {request.CategoryId} does not exist");
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
            throw new UnauthorizedAccessException("You are not authorized to delete this business");
        }

        // Vérifier que le statut permet la suppression
        if (business.Status != BusinessStatus.Draft)
        {
            throw new InvalidOperationException($"Cannot delete business with status {business.Status}. Only Draft businesses can be deleted.");
        }

        _context.Businesses.Remove(business);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Business {BusinessId} deleted successfully", businessId);

        return true;
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
