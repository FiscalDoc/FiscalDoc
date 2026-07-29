using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VeloXML.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class GeneralizarCobranca : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Renomeia a tabela em vez de recriar — preserva o histórico de cobranças já existente.
            migrationBuilder.RenameTable(
                name: "cobrancas_contador",
                newName: "cobrancas");

            migrationBuilder.RenameIndex(
                name: "IX_cobrancas_contador_tenant_id",
                table: "cobrancas",
                newName: "IX_cobrancas_tenant_id");

            migrationBuilder.DropIndex(
                name: "IX_cobrancas_contador_contador_id_mes_ano",
                table: "cobrancas");

            migrationBuilder.AddColumn<Guid>(
                name: "cliente_id",
                table: "cobrancas",
                type: "uuid",
                nullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "contador_id",
                table: "cobrancas",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.CreateIndex(
                name: "IX_cobrancas_contador_id_mes_ano",
                table: "cobrancas",
                columns: new[] { "contador_id", "mes", "ano" },
                unique: true,
                filter: "deleted_at IS NULL AND contador_id IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_cobrancas_cliente_id",
                table: "cobrancas",
                column: "cliente_id");

            migrationBuilder.AddForeignKey(
                name: "FK_cobrancas_clientes_cliente_id",
                table: "cobrancas",
                column: "cliente_id",
                principalTable: "clientes",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_cobrancas_clientes_cliente_id",
                table: "cobrancas");

            migrationBuilder.DropIndex(
                name: "IX_cobrancas_cliente_id",
                table: "cobrancas");

            migrationBuilder.DropIndex(
                name: "IX_cobrancas_contador_id_mes_ano",
                table: "cobrancas");

            migrationBuilder.DropColumn(
                name: "cliente_id",
                table: "cobrancas");

            migrationBuilder.AlterColumn<Guid>(
                name: "contador_id",
                table: "cobrancas",
                type: "uuid",
                nullable: false,
                defaultValue: Guid.Empty,
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_cobrancas_contador_contador_id_mes_ano",
                table: "cobrancas",
                columns: new[] { "contador_id", "mes", "ano" },
                unique: true,
                filter: "deleted_at IS NULL");

            migrationBuilder.RenameIndex(
                name: "IX_cobrancas_tenant_id",
                table: "cobrancas",
                newName: "IX_cobrancas_contador_tenant_id");

            migrationBuilder.RenameTable(
                name: "cobrancas",
                newName: "cobrancas_contador");
        }
    }
}
