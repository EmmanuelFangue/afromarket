using AfroMarket.MerchantService.Models.DTOs;
using AfroMarket.MerchantService.Models.Enums;

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

    /// <summary>
    /// Soumet un commerce pour validation (Draft/Rejected → PendingValidation)
    /// </summary>
    Task<BusinessResponse> SubmitForReviewAsync(Guid businessId, Guid ownerId);

    /// <summary>
    /// Approuve un commerce (PendingValidation → Published) et notifie le SearchService
    /// </summary>
    Task<BusinessResponse> ApproveBusinessAsync(Guid businessId);

    /// <summary>
    /// Rejette un commerce avec un motif (PendingValidation → Rejected)
    /// </summary>
    Task<BusinessResponse> RejectBusinessAsync(Guid businessId, string reason);

    /// <summary>
    /// Récupère les commerces en attente de validation (admin)
    /// </summary>
    Task<PaginatedResult<BusinessResponse>> GetPendingBusinessesAsync(int page = 1, int pageSize = 20);

    /// <summary>
    /// Récupère tous les commerces avec filtre optionnel par statut (admin)
    /// </summary>
    Task<PaginatedResult<BusinessResponse>> GetAllBusinessesForAdminAsync(int page = 1, int pageSize = 20, BusinessStatus? status = null);
}

