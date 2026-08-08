using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VeloXML.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddTransportadoraWebhookEClienteEmailNfe : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "webhook_ativo",
                table: "transportadoras",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "webhook_url",
                table: "transportadoras",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "email_nfe_destinatario_gatilho",
                table: "clientes",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "NotaFiscal");

            migrationBuilder.AddColumn<bool>(
                name: "email_nfe_destinatario_habilitado",
                table: "clientes",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "webhook_ativo",
                table: "transportadoras");

            migrationBuilder.DropColumn(
                name: "webhook_url",
                table: "transportadoras");

            migrationBuilder.DropColumn(
                name: "email_nfe_destinatario_gatilho",
                table: "clientes");

            migrationBuilder.DropColumn(
                name: "email_nfe_destinatario_habilitado",
                table: "clientes");
        }
    }
}
