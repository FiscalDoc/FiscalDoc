using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VeloXML.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddImportacaoXmlLog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "importacao_xml_logs",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    contador_id = table.Column<Guid>(type: "uuid", nullable: true),
                    executado_em = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    cliente_id = table.Column<Guid>(type: "uuid", nullable: false),
                    cliente_nome = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    emails_encontrados = table.Column<int>(type: "integer", nullable: false),
                    xmls_processados = table.Column<int>(type: "integer", nullable: false),
                    xmls_importados = table.Column<int>(type: "integer", nullable: false),
                    erros = table.Column<int>(type: "integer", nullable: false),
                    mensagem_erro = table.Column<string>(type: "text", nullable: true),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_importacao_xml_logs", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_importacao_xml_logs_cliente_id",
                table: "importacao_xml_logs",
                column: "cliente_id");

            migrationBuilder.CreateIndex(
                name: "IX_importacao_xml_logs_tenant_id_executado_em",
                table: "importacao_xml_logs",
                columns: new[] { "tenant_id", "executado_em" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "importacao_xml_logs");
        }
    }
}
