using AfroMarket.MerchantService.Models.Entities;
using AfroMarket.MerchantService.Models.Enums;

namespace AfroMarket.MerchantService.Data;

public static class DbInitializer
{
    public static void Initialize(MerchantDbContext context)
    {
        // Vérifier si la base est déjà initialisée
        if (context.Categories.Any())
        {
            return; // La base est déjà initialisée
        }

        // Créer les catégories
        var categories = new[]
        {
            new Category { Id = Guid.NewGuid(), Name = "Restaurant africain", Slug = "restaurant-africain" },
            new Category { Id = Guid.NewGuid(), Name = "Épicerie africaine", Slug = "epicerie-africaine" },
            new Category { Id = Guid.NewGuid(), Name = "Coiffure afro", Slug = "coiffure-afro" },
            new Category { Id = Guid.NewGuid(), Name = "Vêtements africains", Slug = "vetements-africains" },
            new Category { Id = Guid.NewGuid(), Name = "Services traiteur", Slug = "services-traiteur" }
        };
        context.Categories.AddRange(categories);
        context.SaveChanges();

        // Créer des utilisateurs de test
        var merchantUser = new User
        {
            Id = Guid.NewGuid(),
            Email = "merchant@afromarket.com",
            PasswordHash = "hashed_password_here", // En production, utiliser un vrai hash
            FirstName = "Marie",
            LastName = "Kouassi",
            Role = UserRole.Merchant,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var adminUser = new User
        {
            Id = Guid.NewGuid(),
            Email = "admin@afromarket.com",
            PasswordHash = "hashed_password_here",
            FirstName = "Admin",
            LastName = "AfroMarket",
            Role = UserRole.Admin,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        context.Users.AddRange(merchantUser, adminUser);
        context.SaveChanges();

        // Créer des adresses
        var addresses = new[]
        {
            new Address
            {
                Id = Guid.NewGuid(),
                Street = "1234 Rue Saint-Denis",
                City = "Montréal",
                Province = "QC",
                PostalCode = "H2X 3K8",
                Country = "Canada",
                Latitude = 45.5155m,
                Longitude = -73.5625m
            },
            new Address
            {
                Id = Guid.NewGuid(),
                Street = "5678 Boulevard Saint-Laurent",
                City = "Montréal",
                Province = "QC",
                PostalCode = "H2T 1R6",
                Country = "Canada",
                Latitude = 45.5253m,
                Longitude = -73.5846m
            },
            new Address
            {
                Id = Guid.NewGuid(),
                Street = "910 Rue Jean-Talon Est",
                City = "Montréal",
                Province = "QC",
                PostalCode = "H2R 1V5",
                Country = "Canada",
                Latitude = 45.5356m,
                Longitude = -73.6123m
            },
            new Address
            {
                Id = Guid.NewGuid(),
                Street = "123 Yonge Street",
                City = "Toronto",
                Province = "ON",
                PostalCode = "M5B 1M4",
                Country = "Canada",
                Latitude = 43.6532m,
                Longitude = -79.3832m
            },
            new Address
            {
                Id = Guid.NewGuid(),
                Street = "456 Bloor Street West",
                City = "Toronto",
                Province = "ON",
                PostalCode = "M5S 1X8",
                Country = "Canada",
                Latitude = 43.6677m,
                Longitude = -79.4000m
            }
        };
        context.Addresses.AddRange(addresses);
        context.SaveChanges();

        // Créer des commerces de test
        var businesses = new[]
        {
            new Business
            {
                Id = Guid.NewGuid(),
                OwnerId = merchantUser.Id,
                Name = "Chez Fatou Restaurant",
                Description = "Restaurant sénégalais authentique proposant thiéboudienne, mafé et yassa poulet dans une ambiance chaleureuse.",
                Status = BusinessStatus.Published,
                CategoryId = categories[0].Id,
                AddressId = addresses[0].Id,
                Phone = "+1 514-123-4567",
                Email = "contact@chezfatou.ca",
                Website = "https://chezfatou.ca",
                Tags = "[\"sénégalais\", \"halal\", \"plats à emporter\"]",
                CreatedAt = DateTime.UtcNow.AddDays(-30),
                UpdatedAt = DateTime.UtcNow.AddDays(-5),
                PublishedAt = DateTime.UtcNow.AddDays(-20)
            },
            new Business
            {
                Id = Guid.NewGuid(),
                OwnerId = merchantUser.Id,
                Name = "Marché Africain Adama",
                Description = "Épicerie africaine offrant produits d'Afrique de l'Ouest, viandes halal, poissons fumés et épices authentiques.",
                Status = BusinessStatus.Published,
                CategoryId = categories[1].Id,
                AddressId = addresses[1].Id,
                Phone = "+1 514-234-5678",
                Email = "info@marcheadama.com",
                Website = "",
                Tags = "[\"épicerie\", \"produits frais\", \"halal\"]",
                CreatedAt = DateTime.UtcNow.AddDays(-60),
                UpdatedAt = DateTime.UtcNow.AddDays(-10),
                PublishedAt = DateTime.UtcNow.AddDays(-50)
            },
            new Business
            {
                Id = Guid.NewGuid(),
                OwnerId = merchantUser.Id,
                Name = "Salon Afro Beauté",
                Description = "Salon de coiffure spécialisé en tresses, locks, tissages et soins capillaires pour cheveux afro.",
                Status = BusinessStatus.Published,
                CategoryId = categories[2].Id,
                AddressId = addresses[2].Id,
                Phone = "+1 514-345-6789",
                Email = "rdv@afrobeaute.ca",
                Website = "https://afrobeaute.ca",
                Tags = "[\"tresses\", \"locks\", \"tissage\", \"nattes\"]",
                CreatedAt = DateTime.UtcNow.AddDays(-45),
                UpdatedAt = DateTime.UtcNow,
                PublishedAt = DateTime.UtcNow.AddDays(-40)
            },
            new Business
            {
                Id = Guid.NewGuid(),
                OwnerId = merchantUser.Id,
                Name = "Lagos Kitchen Toronto",
                Description = "Cuisine nigériane authentique - jollof rice, suya, egusi soup, pounded yam et plus encore.",
                Status = BusinessStatus.Published,
                CategoryId = categories[0].Id,
                AddressId = addresses[3].Id,
                Phone = "+1 416-123-7890",
                Email = "hello@lagoskitchen.ca",
                Website = "https://lagoskitchen.ca",
                Tags = "[\"nigérian\", \"jollof\", \"suya\", \"livraison\"]",
                CreatedAt = DateTime.UtcNow.AddDays(-25),
                UpdatedAt = DateTime.UtcNow.AddDays(-2),
                PublishedAt = DateTime.UtcNow.AddDays(-15)
            },
            new Business
            {
                Id = Guid.NewGuid(),
                OwnerId = merchantUser.Id,
                Name = "Wax & Pagne Boutique",
                Description = "Boutique de vêtements et tissus africains - wax, pagne, boubous, dashikis sur mesure.",
                Status = BusinessStatus.PendingValidation,
                CategoryId = categories[3].Id,
                AddressId = addresses[4].Id,
                Phone = "+1 416-234-8901",
                Email = "boutique@waxpagne.com",
                Website = "",
                Tags = "[\"wax\", \"pagne\", \"sur mesure\", \"couture\"]",
                CreatedAt = DateTime.UtcNow.AddDays(-5),
                UpdatedAt = DateTime.UtcNow.AddDays(-1),
                PublishedAt = null
            }
        };
        context.Businesses.AddRange(businesses);
        context.SaveChanges();

        Console.WriteLine("Base de données initialisée avec succès !");
        Console.WriteLine($"- {categories.Length} catégories créées");
        Console.WriteLine($"- {businesses.Length} commerces créés");
        Console.WriteLine($"- 2 utilisateurs créés");
    }
}
