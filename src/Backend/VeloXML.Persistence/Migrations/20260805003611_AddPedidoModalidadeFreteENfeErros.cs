using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VeloXML.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPedidoModalidadeFreteENfeErros : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "modalidade_frete",
                table: "pedidos",
                type: "character varying(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "SemFrete");

            migrationBuilder.AddColumn<string>(
                name: "erros_detalhados_json",
                table: "nfe_emissoes",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "modalidade_frete",
                table: "pedidos");

            migrationBuilder.DropColumn(
                name: "erros_detalhados_json",
                table: "nfe_emissoes");
        }
    }
}
