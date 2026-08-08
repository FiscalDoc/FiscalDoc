using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VeloXML.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPedidoTransportadora : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "transportadora_id",
                table: "pedidos",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_pedidos_transportadora_id",
                table: "pedidos",
                column: "transportadora_id");

            migrationBuilder.AddForeignKey(
                name: "FK_pedidos_transportadoras_transportadora_id",
                table: "pedidos",
                column: "transportadora_id",
                principalTable: "transportadoras",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_pedidos_transportadoras_transportadora_id",
                table: "pedidos");

            migrationBuilder.DropIndex(
                name: "IX_pedidos_transportadora_id",
                table: "pedidos");

            migrationBuilder.DropColumn(
                name: "transportadora_id",
                table: "pedidos");
        }
    }
}
