using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AfroMarket.MerchantService.Migrations
{
    /// <inheritdoc />
    public partial class AddUserIsEnabled : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsEnabled",
                table: "Users",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsEnabled",
                table: "Users");
        }
    }
}
