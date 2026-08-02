using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VeloXML.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddDocumentoImpostosItensEPedidoVinculo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "documento_id",
                table: "pedidos",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "itens_json",
                table: "documentos",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "valor_aprox_tributos",
                table: "documentos",
                type: "numeric(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "valor_cofins",
                table: "documentos",
                type: "numeric(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "valor_desconto",
                table: "documentos",
                type: "numeric(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "valor_frete",
                table: "documentos",
                type: "numeric(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "valor_icms",
                table: "documentos",
                type: "numeric(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "valor_ipi",
                table: "documentos",
                type: "numeric(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "valor_outras_despesas",
                table: "documentos",
                type: "numeric(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "valor_pis",
                table: "documentos",
                type: "numeric(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "valor_produtos",
                table: "documentos",
                type: "numeric(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "valor_seguro",
                table: "documentos",
                type: "numeric(18,2)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_pedidos_documento_id",
                table: "pedidos",
                column: "documento_id");

            migrationBuilder.AddForeignKey(
                name: "FK_pedidos_documentos_documento_id",
                table: "pedidos",
                column: "documento_id",
                principalTable: "documentos",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_pedidos_documentos_documento_id",
                table: "pedidos");

            migrationBuilder.DropIndex(
                name: "IX_pedidos_documento_id",
                table: "pedidos");

            migrationBuilder.DropColumn(
                name: "documento_id",
                table: "pedidos");

            migrationBuilder.DropColumn(
                name: "itens_json",
                table: "documentos");

            migrationBuilder.DropColumn(
                name: "valor_aprox_tributos",
                table: "documentos");

            migrationBuilder.DropColumn(
                name: "valor_cofins",
                table: "documentos");

            migrationBuilder.DropColumn(
                name: "valor_desconto",
                table: "documentos");

            migrationBuilder.DropColumn(
                name: "valor_frete",
                table: "documentos");

            migrationBuilder.DropColumn(
                name: "valor_icms",
                table: "documentos");

            migrationBuilder.DropColumn(
                name: "valor_ipi",
                table: "documentos");

            migrationBuilder.DropColumn(
                name: "valor_outras_despesas",
                table: "documentos");

            migrationBuilder.DropColumn(
                name: "valor_pis",
                table: "documentos");

            migrationBuilder.DropColumn(
                name: "valor_produtos",
                table: "documentos");

            migrationBuilder.DropColumn(
                name: "valor_seguro",
                table: "documentos");
        }
    }
}
