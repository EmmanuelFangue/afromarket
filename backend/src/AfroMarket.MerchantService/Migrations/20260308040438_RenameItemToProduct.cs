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
            // Step 1: Drop FKs that reference the Items table (must be removed before rename)
            migrationBuilder.DropForeignKey(
                name: "FK_Media_Items_ItemId",
                table: "Media");

            migrationBuilder.DropForeignKey(
                name: "FK_Items_Businesses_BusinessId",
                table: "Items");

            // Step 2: Rename Items → Products (preserves all product data)
            migrationBuilder.RenameTable(
                name: "Items",
                newName: "Products");

            // Step 3: Rename indexes on the newly renamed Products table
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

            // Step 4: Rename ItemId → ProductId in Media table
            migrationBuilder.RenameColumn(
                name: "ItemId",
                table: "Media",
                newName: "ProductId");

            migrationBuilder.RenameIndex(
                name: "IX_Media_ItemId",
                table: "Media",
                newName: "IX_Media_ProductId");

            // Step 5: Restore FKs with names matching the Products table
            migrationBuilder.AddForeignKey(
                name: "FK_Media_Products_ProductId",
                table: "Media",
                column: "ProductId",
                principalTable: "Products",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

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
            // Reverse Step 5: Drop FKs referencing Products
            migrationBuilder.DropForeignKey(
                name: "FK_Media_Products_ProductId",
                table: "Media");

            migrationBuilder.DropForeignKey(
                name: "FK_Products_Businesses_BusinessId",
                table: "Products");

            // Reverse Step 4: Rename ProductId → ItemId in Media
            migrationBuilder.RenameColumn(
                name: "ProductId",
                table: "Media",
                newName: "ItemId");

            migrationBuilder.RenameIndex(
                name: "IX_Media_ProductId",
                table: "Media",
                newName: "IX_Media_ItemId");

            // Reverse Step 2-3: Rename Products → Items
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

            // Reverse Step 1: Restore original FKs
            migrationBuilder.AddForeignKey(
                name: "FK_Items_Businesses_BusinessId",
                table: "Items",
                column: "BusinessId",
                principalTable: "Businesses",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

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
