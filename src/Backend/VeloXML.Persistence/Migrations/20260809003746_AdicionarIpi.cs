using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VeloXML.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AdicionarIpi : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "aliquota_ipi",
                table: "produtos",
                type: "numeric(5,2)",
                precision: 5,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "cst_ipi",
                table: "produtos",
                type: "character varying(2)",
                maxLength: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "aliquota_ipi",
                table: "pedido_itens",
                type: "numeric(5,2)",
                precision: 5,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "cst_ipi",
                table: "pedido_itens",
                type: "character varying(2)",
                maxLength: 2,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "aliquota_ipi",
                table: "produtos");

            migrationBuilder.DropColumn(
                name: "cst_ipi",
                table: "produtos");

            migrationBuilder.DropColumn(
                name: "aliquota_ipi",
                table: "pedido_itens");

            migrationBuilder.DropColumn(
                name: "cst_ipi",
                table: "pedido_itens");
        }
    }
}
