using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VeloXML.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RemoverTwoFactorAuth : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "totp_secret",
                table: "users");

            migrationBuilder.DropColumn(
                name: "two_factor_habilitado",
                table: "users");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "totp_secret",
                table: "users",
                type: "character varying(256)",
                maxLength: 256,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "two_factor_habilitado",
                table: "users",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }
    }
}
