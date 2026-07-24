using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VeloXML.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCobrancaContadorELicenciamento : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "limite_xml_por_cliente",
                table: "contadores",
                type: "integer",
                nullable: false,
                defaultValue: 100);

            migrationBuilder.AddColumn<string>(
                name: "motivo_bloqueio",
                table: "contadores",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "status_licenca",
                table: "contadores",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "valor_por_cliente",
                table: "contadores",
                type: "numeric(18,2)",
                nullable: false,
                defaultValue: 100m);

            migrationBuilder.AddColumn<decimal>(
                name: "valor_xml_excedente",
                table: "contadores",
                type: "numeric(18,2)",
                nullable: false,
                defaultValue: 1m);

            migrationBuilder.CreateTable(
                name: "cobrancas_contador",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    contador_id = table.Column<Guid>(type: "uuid", nullable: false),
                    mes = table.Column<int>(type: "integer", nullable: false),
                    ano = table.Column<int>(type: "integer", nullable: false),
                    total_clientes = table.Column<int>(type: "integer", nullable: false),
                    valor_por_cliente = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    valor_base = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    limite_xml_total = table.Column<int>(type: "integer", nullable: false),
                    xmls_processados = table.Column<int>(type: "integer", nullable: false),
                    xmls_excedentes = table.Column<int>(type: "integer", nullable: false),
                    valor_excedente = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    valor_total = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    status = table.Column<int>(type: "integer", nullable: false),
                    data_vencimento = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    data_pagamento = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    observacao = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_cobrancas_contador", x => x.id);
                    table.ForeignKey(
                        name: "FK_cobrancas_contador_contadores_contador_id",
                        column: x => x.contador_id,
                        principalTable: "contadores",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_cobrancas_contador_contador_id_mes_ano",
                table: "cobrancas_contador",
                columns: new[] { "contador_id", "mes", "ano" },
                unique: true,
                filter: "deleted_at IS NULL");

            migrationBuilder.CreateIndex(
                name: "IX_cobrancas_contador_tenant_id",
                table: "cobrancas_contador",
                column: "tenant_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "cobrancas_contador");

            migrationBuilder.DropColumn(
                name: "limite_xml_por_cliente",
                table: "contadores");

            migrationBuilder.DropColumn(
                name: "motivo_bloqueio",
                table: "contadores");

            migrationBuilder.DropColumn(
                name: "status_licenca",
                table: "contadores");

            migrationBuilder.DropColumn(
                name: "valor_por_cliente",
                table: "contadores");

            migrationBuilder.DropColumn(
                name: "valor_xml_excedente",
                table: "contadores");
        }
    }
}
