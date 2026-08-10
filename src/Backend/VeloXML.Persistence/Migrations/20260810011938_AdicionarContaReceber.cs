using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VeloXML.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AdicionarContaReceber : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "contas_receber",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    cliente_id = table.Column<Guid>(type: "uuid", nullable: false),
                    destinatario_id = table.Column<Guid>(type: "uuid", nullable: false),
                    pedido_id = table.Column<Guid>(type: "uuid", nullable: true),
                    descricao = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    valor_total = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    data_vencimento = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    data_pagamento = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    status = table.Column<int>(type: "integer", nullable: false),
                    forma_pagamento = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    observacao = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    created_by = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    updated_by = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_contas_receber", x => x.id);
                    table.ForeignKey(
                        name: "FK_contas_receber_clientes_cliente_id",
                        column: x => x.cliente_id,
                        principalTable: "clientes",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_contas_receber_destinatarios_destinatario_id",
                        column: x => x.destinatario_id,
                        principalTable: "destinatarios",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_contas_receber_pedidos_pedido_id",
                        column: x => x.pedido_id,
                        principalTable: "pedidos",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_contas_receber_cliente_id",
                table: "contas_receber",
                column: "cliente_id");

            migrationBuilder.CreateIndex(
                name: "IX_contas_receber_data_vencimento",
                table: "contas_receber",
                column: "data_vencimento");

            migrationBuilder.CreateIndex(
                name: "IX_contas_receber_destinatario_id",
                table: "contas_receber",
                column: "destinatario_id");

            migrationBuilder.CreateIndex(
                name: "IX_contas_receber_pedido_id",
                table: "contas_receber",
                column: "pedido_id");

            migrationBuilder.CreateIndex(
                name: "IX_contas_receber_status",
                table: "contas_receber",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_contas_receber_tenant_id",
                table: "contas_receber",
                column: "tenant_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "contas_receber");
        }
    }
}
