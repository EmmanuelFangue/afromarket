namespace AfroMarket.MerchantService.Services;

public class LocalImageUploadService : IImageUploadService
{
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<LocalImageUploadService> _logger;
    private const long MaxFileSize = 5 * 1024 * 1024; // 5MB
    private static readonly string[] AllowedExtensions = { ".jpg", ".jpeg", ".png", ".webp" };

    public LocalImageUploadService(IWebHostEnvironment environment, ILogger<LocalImageUploadService> logger)
    {
        _environment = environment;
        _logger = logger;
    }

    public bool ValidateImage(IFormFile file)
    {
        // Check if file is null
        if (file == null || file.Length == 0)
        {
            return false;
        }

        // Check file size (max 5MB)
        if (file.Length > MaxFileSize)
        {
            return false;
        }

        // Check file extension
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(extension))
        {
            return false;
        }

        return true;
    }

    public async Task<string> UploadImageAsync(IFormFile file, string folder = "products")
    {
        if (!ValidateImage(file))
        {
            throw new ArgumentException("Invalid image file");
        }

        try
        {
            // Create upload directory if it doesn't exist
            var uploadPath = Path.Combine(_environment.WebRootPath, "uploads", folder);
            Directory.CreateDirectory(uploadPath);

            // Generate unique filename
            var extension = Path.GetExtension(file.FileName);
            var fileName = $"{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(uploadPath, fileName);

            // Save file
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Return relative URL
            var relativeUrl = $"/uploads/{folder}/{fileName}";
            _logger.LogInformation("Image uploaded successfully: {ImageUrl}", relativeUrl);

            return relativeUrl;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading image");
            throw;
        }
    }

    public async Task<List<string>> UploadImagesAsync(List<IFormFile> files, string folder = "products")
    {
        if (files.Count > 10)
        {
            throw new ArgumentException("Maximum 10 images allowed");
        }

        var uploadedUrls = new List<string>();

        foreach (var file in files)
        {
            try
            {
                var url = await UploadImageAsync(file, folder);
                uploadedUrls.Add(url);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading image {FileName}", file.FileName);

                // Clean up previously uploaded files on error
                foreach (var uploadedUrl in uploadedUrls)
                {
                    await DeleteImageAsync(uploadedUrl);
                }

                throw;
            }
        }

        return uploadedUrls;
    }

    public async Task<bool> DeleteImageAsync(string imageUrl)
    {
        try
        {
            if (string.IsNullOrEmpty(imageUrl))
            {
                return false;
            }

            // Remove leading slash and convert to physical path
            var relativePath = imageUrl.TrimStart('/');
            var filePath = Path.Combine(_environment.WebRootPath, relativePath);

            if (File.Exists(filePath))
            {
                await Task.Run(() => File.Delete(filePath));
                _logger.LogInformation("Image deleted successfully: {ImageUrl}", imageUrl);
                return true;
            }

            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting image {ImageUrl}", imageUrl);
            return false;
        }
    }
}
