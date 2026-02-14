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

        // Créer des articles de test
        var items = new[]
        {
            // Items for Chez Fatou Restaurant (businesses[0])
            new Item
            {
                Id = Guid.NewGuid(),
                BusinessId = businesses[0].Id,
                Title = "Thiéboudienne traditionnel",
                Description = "Le plat national du Sénégal - riz cuisiné au poisson, légumes variés et sauce tomate. Servi avec du poisson frais et une variété de légumes de saison.",
                Price = 18.99m,
                Currency = "CAD",
                SKU = "TRAD-THIEB-001",
                IsAvailable = true,
                Status = ItemStatus.Active,
                CreatedAt = DateTime.UtcNow.AddDays(-25),
                UpdatedAt = DateTime.UtcNow.AddDays(-15)
            },
            new Item
            {
                Id = Guid.NewGuid(),
                BusinessId = businesses[0].Id,
                Title = "Mafé poulet",
                Description = "Ragoût de poulet mijoté dans une sauce aux arachides crémeuse, accompagné de riz blanc. Un classique de la cuisine ouest-africaine.",
                Price = 16.50m,
                Currency = "CAD",
                SKU = "TRAD-MAFE-002",
                IsAvailable = true,
                Status = ItemStatus.Active,
                CreatedAt = DateTime.UtcNow.AddDays(-20),
                UpdatedAt = DateTime.UtcNow.AddDays(-10)
            },
            new Item
            {
                Id = Guid.NewGuid(),
                BusinessId = businesses[0].Id,
                Title = "Yassa poulet",
                Description = "Poulet mariné aux oignons et citron, servi avec du riz. Plat acidulé et savoureux de la cuisine sénégalaise.",
                Price = 17.25m,
                Currency = "CAD",
                SKU = "TRAD-YASSA-003",
                IsAvailable = false,
                Status = ItemStatus.Draft,
                CreatedAt = DateTime.UtcNow.AddDays(-2),
                UpdatedAt = DateTime.UtcNow.AddDays(-1)
            },

            // Items for Marché Africain Adama (businesses[1])
            new Item
            {
                Id = Guid.NewGuid(),
                BusinessId = businesses[1].Id,
                Title = "Farine de manioc (Gari)",
                Description = "Farine de manioc fermentée de qualité premium, importée directement d'Afrique de l'Ouest. Parfaite pour préparer l'eba ou à consommer avec soupe.",
                Price = 8.99m,
                Currency = "CAD",
                SKU = "EPIC-GARI-500G",
                IsAvailable = true,
                Status = ItemStatus.Active,
                CreatedAt = DateTime.UtcNow.AddDays(-40),
                UpdatedAt = DateTime.UtcNow.AddDays(-20)
            },
            new Item
            {
                Id = Guid.NewGuid(),
                BusinessId = businesses[1].Id,
                Title = "Poisson fumé barracuda",
                Description = "Barracuda fumé artisanalement, idéal pour vos sauces et ragoûts. Poids approximatif: 500g.",
                Price = 12.50m,
                Currency = "CAD",
                SKU = "POISS-BARRA-500G",
                IsAvailable = true,
                Status = ItemStatus.Active,
                CreatedAt = DateTime.UtcNow.AddDays(-35),
                UpdatedAt = DateTime.UtcNow.AddDays(-25)
            },

            // Items for Lagos Kitchen Toronto (businesses[3])
            new Item
            {
                Id = Guid.NewGuid(),
                BusinessId = businesses[3].Id,
                Title = "Jollof Rice Party Size",
                Description = "Notre célèbre jollof rice nigérian dans un format familial (4-6 personnes). Riz parfumé cuit dans une sauce tomate épicée avec des légumes.",
                Price = 35.00m,
                Currency = "CAD",
                SKU = "JOLL-PARTY-01",
                IsAvailable = true,
                Status = ItemStatus.Active,
                CreatedAt = DateTime.UtcNow.AddDays(-15),
                UpdatedAt = DateTime.UtcNow.AddDays(-8)
            },
            new Item
            {
                Id = Guid.NewGuid(),
                BusinessId = businesses[3].Id,
                Title = "Suya Beef Skewers (5 pcs)",
                Description = "Brochettes de bœuf marinées dans notre mélange d'épices suya maison et grillées à la perfection. Servies avec oignons frais et tomates.",
                Price = 14.99m,
                Currency = "CAD",
                SKU = "SUYA-BEEF-5PC",
                IsAvailable = true,
                Status = ItemStatus.Active,
                CreatedAt = DateTime.UtcNow.AddDays(-18),
                UpdatedAt = DateTime.UtcNow.AddDays(-12)
            },

            // Draft item for Wax & Pagne Boutique (businesses[4])
            new Item
            {
                Id = Guid.NewGuid(),
                BusinessId = businesses[4].Id,
                Title = "Tissu Wax Ankara Premium",
                Description = "Tissu wax 100% coton, motifs ankara authentiques. Vendu au mètre (minimum 2 mètres), parfait pour robes, chemises et accessoires.",
                Price = 15.00m,
                Currency = "CAD",
                SKU = "TISSU-WAX-ANKA-001",
                IsAvailable = true,
                Status = ItemStatus.Draft,
                CreatedAt = DateTime.UtcNow.AddDays(-3),
                UpdatedAt = DateTime.UtcNow.AddDays(-1)
            }
        };
        context.Items.AddRange(items);
        context.SaveChanges();

        // Créer des médias pour les articles
        var mediaList = new List<Media>
        {
            // Media for Thiéboudienne (items[0])
            new Media
            {
                Id = Guid.NewGuid(),
                ItemId = items[0].Id,
                Url = "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26",
                Type = MediaType.Image,
                OrderIndex = 0,
                FileName = "thieboudienne-main.jpg",
                AltText = "Thiéboudienne traditionnel avec poisson et légumes",
                FileSizeBytes = 245600,
                CreatedAt = DateTime.UtcNow.AddDays(-25)
            },
            new Media
            {
                Id = Guid.NewGuid(),
                ItemId = items[0].Id,
                Url = "https://images.unsplash.com/photo-1546833999-b9f581a1996d",
                Type = MediaType.Image,
                OrderIndex = 1,
                FileName = "thieboudienne-detail.jpg",
                AltText = "Détail du plat thiéboudienne",
                FileSizeBytes = 198400,
                CreatedAt = DateTime.UtcNow.AddDays(-25)
            },

            // Media for Mafé poulet (items[1])
            new Media
            {
                Id = Guid.NewGuid(),
                ItemId = items[1].Id,
                Url = "https://images.unsplash.com/photo-1585937421612-70a008356fbe",
                Type = MediaType.Image,
                OrderIndex = 0,
                FileName = "mafe-poulet.jpg",
                AltText = "Mafé poulet sauce arachide",
                FileSizeBytes = 312000,
                CreatedAt = DateTime.UtcNow.AddDays(-20)
            },

            // Media for Yassa poulet (items[2] - Draft)
            new Media
            {
                Id = Guid.NewGuid(),
                ItemId = items[2].Id,
                Url = "https://images.unsplash.com/photo-1598103442097-8b74394b95c6",
                Type = MediaType.Image,
                OrderIndex = 0,
                FileName = "yassa-poulet.jpg",
                AltText = "Yassa poulet aux oignons",
                FileSizeBytes = 278900,
                CreatedAt = DateTime.UtcNow.AddDays(-2)
            },

            // Media for Farine de manioc (items[3])
            new Media
            {
                Id = Guid.NewGuid(),
                ItemId = items[3].Id,
                Url = "https://images.unsplash.com/photo-1586201375761-83865001e31c",
                Type = MediaType.Image,
                OrderIndex = 0,
                FileName = "gari-package.jpg",
                AltText = "Sachet de farine de manioc gari",
                FileSizeBytes = 156700,
                CreatedAt = DateTime.UtcNow.AddDays(-40)
            },

            // Media for Poisson fumé (items[4])
            new Media
            {
                Id = Guid.NewGuid(),
                ItemId = items[4].Id,
                Url = "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2",
                Type = MediaType.Image,
                OrderIndex = 0,
                FileName = "smoked-fish.jpg",
                AltText = "Barracuda fumé",
                FileSizeBytes = 223400,
                CreatedAt = DateTime.UtcNow.AddDays(-35)
            },

            // Media for Jollof Rice (items[5])
            new Media
            {
                Id = Guid.NewGuid(),
                ItemId = items[5].Id,
                Url = "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26",
                Type = MediaType.Image,
                OrderIndex = 0,
                FileName = "jollof-party.jpg",
                AltText = "Jollof rice format familial",
                FileSizeBytes = 389200,
                CreatedAt = DateTime.UtcNow.AddDays(-15)
            },
            new Media
            {
                Id = Guid.NewGuid(),
                ItemId = items[5].Id,
                Url = "https://images.unsplash.com/photo-1546833998-877b37c2e5c6",
                Type = MediaType.Image,
                OrderIndex = 1,
                FileName = "jollof-closeup.jpg",
                AltText = "Gros plan sur le jollof rice",
                FileSizeBytes = 267800,
                CreatedAt = DateTime.UtcNow.AddDays(-15)
            },

            // Media for Suya Beef (items[6])
            new Media
            {
                Id = Guid.NewGuid(),
                ItemId = items[6].Id,
                Url = "https://images.unsplash.com/photo-1529006557810-274b9b2fc783",
                Type = MediaType.Image,
                OrderIndex = 0,
                FileName = "suya-skewers.jpg",
                AltText = "Brochettes de suya beef grillées",
                FileSizeBytes = 345100,
                CreatedAt = DateTime.UtcNow.AddDays(-18)
            },

            // Media for Tissu Wax (items[7] - Draft)
            new Media
            {
                Id = Guid.NewGuid(),
                ItemId = items[7].Id,
                Url = "https://images.unsplash.com/photo-1610652492500-ded49cecc377",
                Type = MediaType.Image,
                OrderIndex = 0,
                FileName = "wax-ankara.jpg",
                AltText = "Tissu wax ankara motifs colorés",
                FileSizeBytes = 412300,
                CreatedAt = DateTime.UtcNow.AddDays(-3)
            },
            new Media
            {
                Id = Guid.NewGuid(),
                ItemId = items[7].Id,
                Url = "https://images.unsplash.com/photo-1591799265444-d66432b91588",
                Type = MediaType.Image,
                OrderIndex = 1,
                FileName = "wax-detail.jpg",
                AltText = "Détail du motif wax",
                FileSizeBytes = 385600,
                CreatedAt = DateTime.UtcNow.AddDays(-3)
            }
        };
        context.Media.AddRange(mediaList);
        context.SaveChanges();

        Console.WriteLine("Base de données initialisée avec succès !");
        Console.WriteLine($"- {categories.Length} catégories créées");
        Console.WriteLine($"- {businesses.Length} commerces créés");
        Console.WriteLine($"- 2 utilisateurs créés");
        Console.WriteLine($"- {items.Length} articles créés");
        Console.WriteLine($"- {mediaList.Count} médias créés");
    }
}
