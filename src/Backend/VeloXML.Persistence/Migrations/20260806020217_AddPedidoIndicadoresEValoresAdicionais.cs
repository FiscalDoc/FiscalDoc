using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VeloXML.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPedidoIndicadoresEValoresAdicionais : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "consumidor_final",
                table: "pedidos",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<int>(
                name: "presenca_comprador",
                table: "pedidos",
                type: "integer",
                nullable: false,
                defaultValue: 9);

            migrationBuilder.AddColumn<decimal>(
                name: "valor_frete",
                table: "pedidos",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "valor_outras_despesas",
                table: "pedidos",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "valor_seguro",
                table: "pedidos",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "consumidor_final",
                table: "pedidos");

            migrationBuilder.DropColumn(
                name: "presenca_comprador",
                table: "pedidos");

            migrationBuilder.DropColumn(
                name: "valor_frete",
                table: "pedidos");

            migrationBuilder.DropColumn(
                name: "valor_outras_despesas",
                table: "pedidos");

            migrationBuilder.DropColumn(
                name: "valor_seguro",
                table: "pedidos");
        }
    }
}
