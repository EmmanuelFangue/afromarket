using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AfroMarket.MerchantService.Migrations
{
    /// <inheritdoc />
    public partial class AddTranslationSupport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // NOTE: This migration drops existing columns without preserving data.
            // This is acceptable for development when the database will be recreated with seed data.
            //
            // For production migrations with existing data, use this approach instead:
            // 1. Add new translation columns with default values
            // 2. Migrate existing data to JSON format: {"fr":"existing_value","en":""}
            // 3. Drop old columns
            //
            // Example SQL for safe migration:
            // ALTER TABLE Items ADD DescriptionTranslations nvarchar(max) NOT NULL DEFAULT '{"fr":"","en":""}';
            // UPDATE Items SET DescriptionTranslations = '{"fr":"' + REPLACE(Description, '"', '\"') + '","en":""}' WHERE Description IS NOT NULL;
            // ALTER TABLE Items DROP COLUMN Description;

            migrationBuilder.DropColumn(
                name: "Description",
                table: "Items");

            migrationBuilder.DropColumn(
                name: "Title",
                table: "Items");

            migrationBuilder.DropColumn(
                name: "Name",
                table: "Categories");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "Businesses");

            migrationBuilder.DropColumn(
                name: "Name",
                table: "Businesses");

            migrationBuilder.AddColumn<string>(
                name: "DescriptionTranslations",
                table: "Items",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "TitleTranslations",
                table: "Items",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "NameTranslations",
                table: "Categories",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "DescriptionTranslations",
                table: "Businesses",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "NameTranslations",
                table: "Businesses",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DescriptionTranslations",
                table: "Items");

            migrationBuilder.DropColumn(
                name: "TitleTranslations",
                table: "Items");

            migrationBuilder.DropColumn(
                name: "NameTranslations",
                table: "Categories");

            migrationBuilder.DropColumn(
                name: "DescriptionTranslations",
                table: "Businesses");

            migrationBuilder.DropColumn(
                name: "NameTranslations",
                table: "Businesses");

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "Items",
                type: "nvarchar(max)",
                maxLength: 5000,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Title",
                table: "Items",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Name",
                table: "Categories",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "Businesses",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Name",
                table: "Businesses",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");
        }
    }
}
