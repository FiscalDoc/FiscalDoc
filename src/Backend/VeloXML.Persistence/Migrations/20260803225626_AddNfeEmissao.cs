using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VeloXML.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddNfeEmissao : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "nfe_emissoes",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    pedido_id = table.Column<Guid>(type: "uuid", nullable: false),
                    cliente_id = table.Column<Guid>(type: "uuid", nullable: false),
                    @ref = table.Column<string>(name: "ref", type: "character varying(100)", maxLength: 100, nullable: false),
                    ambiente = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "homologacao"),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    mensagem_erro = table.Column<string>(type: "text", nullable: true),
                    chave_acesso = table.Column<string>(type: "character varying(44)", maxLength: 44, nullable: true),
                    numero = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    serie = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    documento_id = table.Column<Guid>(type: "uuid", nullable: true),
                    ultimo_payload_resposta_json = table.Column<string>(type: "text", nullable: true),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_nfe_emissoes", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_nfe_emissoes_pedido_id_created_at",
                table: "nfe_emissoes",
                columns: new[] { "pedido_id", "created_at" });

            migrationBuilder.CreateIndex(
                name: "IX_nfe_emissoes_ref",
                table: "nfe_emissoes",
                column: "ref",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "nfe_emissoes");
        }
    }
}
