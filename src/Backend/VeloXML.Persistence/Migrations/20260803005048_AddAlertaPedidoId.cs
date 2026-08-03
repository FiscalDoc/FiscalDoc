using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VeloXML.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddAlertaPedidoId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "pedido_id",
                table: "alertas",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_alertas_pedido_id",
                table: "alertas",
                column: "pedido_id");

            migrationBuilder.AddForeignKey(
                name: "FK_alertas_pedidos_pedido_id",
                table: "alertas",
                column: "pedido_id",
                principalTable: "pedidos",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_alertas_pedidos_pedido_id",
                table: "alertas");

            migrationBuilder.DropIndex(
                name: "IX_alertas_pedido_id",
                table: "alertas");

            migrationBuilder.DropColumn(
                name: "pedido_id",
                table: "alertas");
        }
    }
}
