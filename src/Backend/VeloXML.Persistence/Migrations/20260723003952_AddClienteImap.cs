using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VeloXML.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddClienteImap : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "imap_email",
                table: "clientes",
                type: "character varying(256)",
                maxLength: 256,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "imap_habilitado",
                table: "clientes",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "imap_host",
                table: "clientes",
                type: "character varying(256)",
                maxLength: 256,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "imap_port",
                table: "clientes",
                type: "integer",
                nullable: false,
                defaultValue: 993);

            migrationBuilder.AddColumn<string>(
                name: "imap_senha",
                table: "clientes",
                type: "character varying(512)",
                maxLength: 512,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "imap_email",
                table: "clientes");

            migrationBuilder.DropColumn(
                name: "imap_habilitado",
                table: "clientes");

            migrationBuilder.DropColumn(
                name: "imap_host",
                table: "clientes");

            migrationBuilder.DropColumn(
                name: "imap_port",
                table: "clientes");

            migrationBuilder.DropColumn(
                name: "imap_senha",
                table: "clientes");
        }
    }
}
