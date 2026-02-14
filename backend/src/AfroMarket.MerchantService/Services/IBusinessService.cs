using AfroMarket.MerchantService.Models.DTOs;

namespace AfroMarket.MerchantService.Services;

public interface IBusinessService
{
    /// <summary>
    /// Crée un nouveau commerce avec le statut Draft
    /// </summary>
    Task<BusinessResponse> CreateBusinessAsync(CreateBusinessRequest request, Guid ownerId);

    /// <summary>
    /// Met à jour un commerce existant (seulement si statut = Draft)
    /// </summary>
    Task<BusinessResponse> UpdateBusinessAsync(Guid businessId, UpdateBusinessRequest request, Guid ownerId);

    /// <summary>
    /// Récupère un commerce par son ID
    /// </summary>
    Task<BusinessResponse?> GetBusinessByIdAsync(Guid businessId);

    /// <summary>
    /// Récupère tous les commerces d'un propriétaire
    /// </summary>
    Task<List<BusinessResponse>> GetBusinessesByOwnerAsync(Guid ownerId);

    /// <summary>
    /// Supprime un commerce (seulement si statut = Draft)
    /// </summary>
    Task<bool> DeleteBusinessAsync(Guid businessId, Guid ownerId);

    /// <summary>
    /// Récupère tous les commerces publiés avec pagination
    /// </summary>
    Task<PaginatedResult<BusinessResponse>> GetPublishedBusinessesAsync(int page = 1, int pageSize = 20);
}
