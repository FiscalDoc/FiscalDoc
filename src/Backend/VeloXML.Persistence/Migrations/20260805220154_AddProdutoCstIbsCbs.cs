using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VeloXML.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddProdutoCstIbsCbs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "cst_cofins",
                table: "produtos",
                type: "character varying(2)",
                maxLength: 2,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "cst_icms",
                table: "produtos",
                type: "character varying(3)",
                maxLength: 3,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "cst_pis",
                table: "produtos",
                type: "character varying(2)",
                maxLength: 2,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ibs_cbs_classificacao_tributaria",
                table: "produtos",
                type: "character varying(6)",
                maxLength: 6,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ibs_cbs_cst",
                table: "produtos",
                type: "character varying(3)",
                maxLength: 3,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "cst_cofins",
                table: "pedido_itens",
                type: "character varying(2)",
                maxLength: 2,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "cst_icms",
                table: "pedido_itens",
                type: "character varying(3)",
                maxLength: 3,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "cst_pis",
                table: "pedido_itens",
                type: "character varying(2)",
                maxLength: 2,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ibs_cbs_classificacao_tributaria",
                table: "pedido_itens",
                type: "character varying(6)",
                maxLength: 6,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ibs_cbs_cst",
                table: "pedido_itens",
                type: "character varying(3)",
                maxLength: 3,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "cst_cofins",
                table: "produtos");

            migrationBuilder.DropColumn(
                name: "cst_icms",
                table: "produtos");

            migrationBuilder.DropColumn(
                name: "cst_pis",
                table: "produtos");

            migrationBuilder.DropColumn(
                name: "ibs_cbs_classificacao_tributaria",
                table: "produtos");

            migrationBuilder.DropColumn(
                name: "ibs_cbs_cst",
                table: "produtos");

            migrationBuilder.DropColumn(
                name: "cst_cofins",
                table: "pedido_itens");

            migrationBuilder.DropColumn(
                name: "cst_icms",
                table: "pedido_itens");

            migrationBuilder.DropColumn(
                name: "cst_pis",
                table: "pedido_itens");

            migrationBuilder.DropColumn(
                name: "ibs_cbs_classificacao_tributaria",
                table: "pedido_itens");

            migrationBuilder.DropColumn(
                name: "ibs_cbs_cst",
                table: "pedido_itens");
        }
    }
}
