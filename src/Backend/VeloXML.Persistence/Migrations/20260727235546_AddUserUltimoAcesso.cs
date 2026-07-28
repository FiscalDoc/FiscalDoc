using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VeloXML.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddUserUltimoAcesso : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ultimo_acesso_em",
                table: "users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "certificado_a1_key",
                table: "clientes",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "certificado_a1_senha",
                table: "clientes",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "certificado_a1_validade",
                table: "clientes",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "cnae_principal",
                table: "clientes",
                type: "character varying(10)",
                maxLength: 10,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "inscricao_estadual",
                table: "clientes",
                type: "character varying(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "inscricao_municipal",
                table: "clientes",
                type: "character varying(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "nfe_habilitado",
                table: "clientes",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "regime_tributario",
                table: "clientes",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "serie_nfe",
                table: "clientes",
                type: "character varying(3)",
                maxLength: 3,
                nullable: false,
                defaultValue: "1");

            migrationBuilder.CreateTable(
                name: "destinatarios",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    cliente_id = table.Column<Guid>(type: "uuid", nullable: false),
                    razao_social = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    nome_fantasia = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    cpf_cnpj = table.Column<string>(type: "character varying(18)", maxLength: 18, nullable: true),
                    inscricao_estadual = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    email = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    telefone = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    logradouro = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    numero = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    complemento = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    bairro = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    cidade = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    estado = table.Column<string>(type: "character varying(2)", maxLength: 2, nullable: true),
                    cep = table.Column<string>(type: "character varying(9)", maxLength: 9, nullable: true),
                    codigo_ibge_cidade = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    ativo = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    created_by = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    updated_by = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_destinatarios", x => x.id);
                    table.ForeignKey(
                        name: "FK_destinatarios_clientes_cliente_id",
                        column: x => x.cliente_id,
                        principalTable: "clientes",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "produtos",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    cliente_id = table.Column<Guid>(type: "uuid", nullable: false),
                    codigo = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    descricao = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    ncm = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    unidade = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false, defaultValue: "UN"),
                    preco_unitario = table.Column<decimal>(type: "numeric(18,4)", precision: 18, scale: 4, nullable: false),
                    cfop = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    aliquota_icms = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    aliquota_pis = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    aliquota_cofins = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    ativo = table.Column<bool>(type: "boolean", nullable: false),
                    created_by = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    updated_by = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_produtos", x => x.id);
                    table.ForeignKey(
                        name: "FK_produtos_clientes_cliente_id",
                        column: x => x.cliente_id,
                        principalTable: "clientes",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "pedidos",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    cliente_id = table.Column<Guid>(type: "uuid", nullable: false),
                    destinatario_id = table.Column<Guid>(type: "uuid", nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    observacoes = table.Column<string>(type: "text", nullable: true),
                    valor_total = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    natureza_operacao = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false, defaultValue: "Venda de mercadoria"),
                    data_saida = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    forma_pagamento = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    meio_pagamento = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    informacoes_complementares = table.Column<string>(type: "text", nullable: true),
                    created_by = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    updated_by = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_pedidos", x => x.id);
                    table.ForeignKey(
                        name: "FK_pedidos_clientes_cliente_id",
                        column: x => x.cliente_id,
                        principalTable: "clientes",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_pedidos_destinatarios_destinatario_id",
                        column: x => x.destinatario_id,
                        principalTable: "destinatarios",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "pedido_itens",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    pedido_id = table.Column<Guid>(type: "uuid", nullable: false),
                    produto_id = table.Column<Guid>(type: "uuid", nullable: false),
                    descricao = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    unidade = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    quantidade = table.Column<decimal>(type: "numeric(18,4)", precision: 18, scale: 4, nullable: false),
                    preco_unitario = table.Column<decimal>(type: "numeric(18,4)", precision: 18, scale: 4, nullable: false),
                    desconto = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    valor_total = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    cfop = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    ncm = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    aliquota_icms = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    aliquota_pis = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    aliquota_cofins = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_pedido_itens", x => x.id);
                    table.ForeignKey(
                        name: "FK_pedido_itens_pedidos_pedido_id",
                        column: x => x.pedido_id,
                        principalTable: "pedidos",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_pedido_itens_produtos_produto_id",
                        column: x => x.produto_id,
                        principalTable: "produtos",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "ix_destinatarios_cliente_id",
                table: "destinatarios",
                column: "cliente_id");

            migrationBuilder.CreateIndex(
                name: "ix_destinatarios_tenant_id",
                table: "destinatarios",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "ix_pedido_itens_pedido_id",
                table: "pedido_itens",
                column: "pedido_id");

            migrationBuilder.CreateIndex(
                name: "IX_pedido_itens_produto_id",
                table: "pedido_itens",
                column: "produto_id");

            migrationBuilder.CreateIndex(
                name: "ix_pedidos_cliente_id",
                table: "pedidos",
                column: "cliente_id");

            migrationBuilder.CreateIndex(
                name: "IX_pedidos_destinatario_id",
                table: "pedidos",
                column: "destinatario_id");

            migrationBuilder.CreateIndex(
                name: "ix_pedidos_tenant_id",
                table: "pedidos",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "ix_produtos_cliente_id",
                table: "produtos",
                column: "cliente_id");

            migrationBuilder.CreateIndex(
                name: "ix_produtos_tenant_id",
                table: "produtos",
                column: "tenant_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "pedido_itens");

            migrationBuilder.DropTable(
                name: "pedidos");

            migrationBuilder.DropTable(
                name: "produtos");

            migrationBuilder.DropTable(
                name: "destinatarios");

            migrationBuilder.DropColumn(
                name: "ultimo_acesso_em",
                table: "users");

            migrationBuilder.DropColumn(
                name: "certificado_a1_key",
                table: "clientes");

            migrationBuilder.DropColumn(
                name: "certificado_a1_senha",
                table: "clientes");

            migrationBuilder.DropColumn(
                name: "certificado_a1_validade",
                table: "clientes");

            migrationBuilder.DropColumn(
                name: "cnae_principal",
                table: "clientes");

            migrationBuilder.DropColumn(
                name: "inscricao_estadual",
                table: "clientes");

            migrationBuilder.DropColumn(
                name: "inscricao_municipal",
                table: "clientes");

            migrationBuilder.DropColumn(
                name: "nfe_habilitado",
                table: "clientes");

            migrationBuilder.DropColumn(
                name: "regime_tributario",
                table: "clientes");

            migrationBuilder.DropColumn(
                name: "serie_nfe",
                table: "clientes");
        }
    }
}
