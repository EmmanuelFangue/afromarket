using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AfroMarket.MerchantService.Migrations
{
    /// <inheritdoc />
    public partial class RenameItemToProduct : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Step 1: Drop FK from Media to old Items table
            migrationBuilder.DropForeignKey(
                name: "FK_Media_Items_ItemId",
                table: "Media");

            // Step 2: Drop ProductImages table (depends on old Products table)
            migrationBuilder.DropTable(
                name: "ProductImages");

            // Step 3: Drop indices on old Products table
            migrationBuilder.DropIndex(
                name: "IX_Products_Category",
                table: "Products");

            migrationBuilder.DropIndex(
                name: "IX_Products_MerchantId",
                table: "Products");

            migrationBuilder.DropIndex(
                name: "IX_Products_MerchantId_IsActive",
                table: "Products");

            // Step 4: Drop old Products table (different schema, no useful data to preserve)
            migrationBuilder.DropTable(
                name: "Products");

            // Step 5: Rename Items → Products (preserves all product data)
            migrationBuilder.RenameTable(
                name: "Items",
                newName: "Products");

            // Step 6: Rename indices on the newly renamed Products table
            migrationBuilder.RenameIndex(
                name: "IX_Items_BusinessId",
                table: "Products",
                newName: "IX_Products_BusinessId");

            migrationBuilder.RenameIndex(
                name: "IX_Items_BusinessId_Status",
                table: "Products",
                newName: "IX_Products_BusinessId_Status");

            migrationBuilder.RenameIndex(
                name: "IX_Items_Status",
                table: "Products",
                newName: "IX_Products_Status");

            // Step 7: Rename ItemId → ProductId in Media table
            migrationBuilder.RenameColumn(
                name: "ItemId",
                table: "Media",
                newName: "ProductId");

            migrationBuilder.RenameIndex(
                name: "IX_Media_ItemId",
                table: "Media",
                newName: "IX_Media_ProductId");

            // Step 8: Restore FK from Media to Products (renamed table)
            migrationBuilder.AddForeignKey(
                name: "FK_Media_Products_ProductId",
                table: "Media",
                column: "ProductId",
                principalTable: "Products",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            // Step 9: Add FK from Products to Businesses
            // (previously was FK_Items_Businesses_BusinessId, now renamed correctly)
            migrationBuilder.AddForeignKey(
                name: "FK_Products_Businesses_BusinessId",
                table: "Products",
                column: "BusinessId",
                principalTable: "Businesses",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Reverse Step 8-9: Drop new FKs
            migrationBuilder.DropForeignKey(
                name: "FK_Media_Products_ProductId",
                table: "Media");

            migrationBuilder.DropForeignKey(
                name: "FK_Products_Businesses_BusinessId",
                table: "Products");

            // Reverse Step 7: Rename ProductId → ItemId in Media
            migrationBuilder.RenameColumn(
                name: "ProductId",
                table: "Media",
                newName: "ItemId");

            migrationBuilder.RenameIndex(
                name: "IX_Media_ProductId",
                table: "Media",
                newName: "IX_Media_ItemId");

            // Reverse Step 5-6: Rename Products → Items
            migrationBuilder.RenameIndex(
                name: "IX_Products_BusinessId",
                table: "Products",
                newName: "IX_Items_BusinessId");

            migrationBuilder.RenameIndex(
                name: "IX_Products_BusinessId_Status",
                table: "Products",
                newName: "IX_Items_BusinessId_Status");

            migrationBuilder.RenameIndex(
                name: "IX_Products_Status",
                table: "Products",
                newName: "IX_Items_Status");

            migrationBuilder.RenameTable(
                name: "Products",
                newName: "Items");

            // Reverse Step 4: Recreate old Products table
            migrationBuilder.CreateTable(
                name: "Products",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MerchantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    Category = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Price = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Products", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Products_Category",
                table: "Products",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "IX_Products_MerchantId",
                table: "Products",
                column: "MerchantId");

            migrationBuilder.CreateIndex(
                name: "IX_Products_MerchantId_IsActive",
                table: "Products",
                columns: new[] { "MerchantId", "IsActive" });

            // Reverse Step 2: Recreate ProductImages table
            migrationBuilder.CreateTable(
                name: "ProductImages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProductId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ImageUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Order = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductImages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProductImages_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProductImages_ProductId",
                table: "ProductImages",
                column: "ProductId");

            // Reverse Step 1: Restore FK from Media to Items
            migrationBuilder.AddForeignKey(
                name: "FK_Media_Items_ItemId",
                table: "Media",
                column: "ItemId",
                principalTable: "Items",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
