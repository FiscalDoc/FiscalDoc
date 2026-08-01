using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VeloXML.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddOrigemImportacao : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "origem",
                table: "importacao_xml_logs",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "ImportacaoEmail");

            migrationBuilder.AddColumn<string>(
                name: "origem_importacao",
                table: "documentos",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Manual");

            migrationBuilder.CreateIndex(
                name: "IX_importacao_xml_logs_tenant_id_origem",
                table: "importacao_xml_logs",
                columns: new[] { "tenant_id", "origem" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_importacao_xml_logs_tenant_id_origem",
                table: "importacao_xml_logs");

            migrationBuilder.DropColumn(
                name: "origem",
                table: "importacao_xml_logs");

            migrationBuilder.DropColumn(
                name: "origem_importacao",
                table: "documentos");
        }
    }
}
