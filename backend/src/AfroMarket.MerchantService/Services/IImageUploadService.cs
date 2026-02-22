namespace AfroMarket.MerchantService.Services;

public interface IImageUploadService
{
    Task<string> UploadImageAsync(IFormFile file, string folder = "products");
    Task<List<string>> UploadImagesAsync(List<IFormFile> files, string folder = "products");
    Task<bool> DeleteImageAsync(string imageUrl);
    bool ValidateImage(IFormFile file);
}
