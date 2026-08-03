using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VeloXML.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddFocusNfeCliente : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "focus_nfe_ambiente",
                table: "clientes",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "homologacao");

            migrationBuilder.AddColumn<string>(
                name: "focus_nfe_empresa_id",
                table: "clientes",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "focus_nfe_erro",
                table: "clientes",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "focus_nfe_status",
                table: "clientes",
                type: "character varying(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "NaoConfigurado");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "focus_nfe_ambiente",
                table: "clientes");

            migrationBuilder.DropColumn(
                name: "focus_nfe_empresa_id",
                table: "clientes");

            migrationBuilder.DropColumn(
                name: "focus_nfe_erro",
                table: "clientes");

            migrationBuilder.DropColumn(
                name: "focus_nfe_status",
                table: "clientes");
        }
    }
}
