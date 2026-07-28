using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VeloXML.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPedidoNumeroSequencial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateSequence(
                name: "pedidos_numero_seq");

            migrationBuilder.AddColumn<int>(
                name: "numero",
                table: "pedidos",
                type: "integer",
                nullable: false,
                defaultValueSql: "nextval('pedidos_numero_seq')");

            migrationBuilder.CreateIndex(
                name: "ix_pedidos_numero",
                table: "pedidos",
                column: "numero");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_pedidos_numero",
                table: "pedidos");

            migrationBuilder.DropColumn(
                name: "numero",
                table: "pedidos");

            migrationBuilder.DropSequence(
                name: "pedidos_numero_seq");
        }
    }
}
