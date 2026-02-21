using AfroMarket.MerchantService.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace AfroMarket.MerchantService.Data;

public class MerchantDbContext : DbContext
{
    public MerchantDbContext(DbContextOptions<MerchantDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; } = null!;
    public DbSet<Business> Businesses { get; set; } = null!;
    public DbSet<Category> Categories { get; set; } = null!;
    public DbSet<Address> Addresses { get; set; } = null!;
    public DbSet<Message> Messages { get; set; } = null!;
    public DbSet<Item> Items { get; set; } = null!;
    public DbSet<Media> Media { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.Email).IsRequired().HasMaxLength(255);
            entity.Property(e => e.FirstName).HasMaxLength(100);
            entity.Property(e => e.LastName).HasMaxLength(100);
            entity.Property(e => e.PreferredUsername).HasMaxLength(255);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");
        });

        // Category configuration
        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Slug).IsUnique();
            entity.Property(e => e.NameTranslations).IsRequired().HasColumnType("nvarchar(max)");
            entity.Property(e => e.Slug).IsRequired().HasMaxLength(100);

            // Ignore NotMapped properties
            entity.Ignore(e => e.Name);
        });

        // Address configuration
        modelBuilder.Entity<Address>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Street).HasMaxLength(255);
            entity.Property(e => e.City).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Province).HasMaxLength(100);
            entity.Property(e => e.PostalCode).HasMaxLength(20);
            entity.Property(e => e.Country).HasMaxLength(100);
            entity.Property(e => e.Latitude).HasColumnType("decimal(10, 7)");
            entity.Property(e => e.Longitude).HasColumnType("decimal(10, 7)");
        });

        // Business configuration
        modelBuilder.Entity<Business>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.CategoryId);
            entity.HasIndex(e => e.OwnerId);

            entity.Property(e => e.NameTranslations).IsRequired().HasColumnType("nvarchar(max)");
            entity.Property(e => e.DescriptionTranslations).IsRequired().HasColumnType("nvarchar(max)");
            entity.Property(e => e.Phone).HasMaxLength(50);
            entity.Property(e => e.Email).HasMaxLength(255);
            entity.Property(e => e.Website).HasMaxLength(500);
            entity.Property(e => e.Tags).HasDefaultValue("[]");
            entity.Property(e => e.RejectionReason).HasMaxLength(1000);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");

            // Ignore NotMapped properties
            entity.Ignore(e => e.Name);
            entity.Ignore(e => e.Description);

            // Relationships
            entity.HasOne(e => e.Owner)
                .WithMany(u => u.Businesses)
                .HasForeignKey(e => e.OwnerId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Category)
                .WithMany(c => c.Businesses)
                .HasForeignKey(e => e.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Address)
                .WithOne(a => a.Business)
                .HasForeignKey<Business>(e => e.AddressId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Message configuration
        modelBuilder.Entity<Message>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.BusinessId);

            entity.Property(e => e.SenderEmail).IsRequired().HasMaxLength(255);
            entity.Property(e => e.SenderName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Content).IsRequired().HasMaxLength(2000);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

            // Relationship
            entity.HasOne(e => e.Business)
                .WithMany(b => b.Messages)
                .HasForeignKey(e => e.BusinessId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Item configuration
        modelBuilder.Entity<Item>(entity =>
        {
            entity.HasKey(e => e.Id);

            // Indexes for performance
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.BusinessId);
            entity.HasIndex(e => new { e.BusinessId, e.Status }); // Composite for filtering

            // Property constraints
            entity.Property(e => e.TitleTranslations).IsRequired().HasColumnType("nvarchar(max)");
            entity.Property(e => e.DescriptionTranslations).IsRequired().HasColumnType("nvarchar(max)");
            entity.Property(e => e.Price).HasColumnType("decimal(18,2)").IsRequired();
            entity.Property(e => e.Currency).IsRequired().HasMaxLength(3).HasDefaultValue("CAD");
            entity.Property(e => e.SKU).HasMaxLength(100);
            entity.Property(e => e.IsAvailable).HasDefaultValue(true);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");

            // Ignore NotMapped properties
            entity.Ignore(e => e.Title);
            entity.Ignore(e => e.Description);

            // Relationships
            entity.HasOne(e => e.Business)
                .WithMany(b => b.Items)
                .HasForeignKey(e => e.BusinessId)
                .OnDelete(DeleteBehavior.Restrict); // Don't cascade delete items when business deleted
        });

        // Media configuration
        modelBuilder.Entity<Media>(entity =>
        {
            entity.HasKey(e => e.Id);

            // Index for fetching item media
            entity.HasIndex(e => e.ItemId);

            // Property constraints
            entity.Property(e => e.Url).IsRequired().HasMaxLength(1000);
            entity.Property(e => e.FileName).HasMaxLength(255);
            entity.Property(e => e.AltText).HasMaxLength(500);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

            // Relationship
            entity.HasOne(e => e.Item)
                .WithMany(i => i.Media)
                .HasForeignKey(e => e.ItemId)
                .OnDelete(DeleteBehavior.Cascade); // Delete media when item deleted
        });
    }
}
