using MediatR;
using Microsoft.Extensions.Logging;
using VeloXML.Application.Features.Documentos.Queries.GetDocumentos;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Pedidos.Commands.CreatePedido;

public sealed class CreatePedidoCommandHandler(IUnitOfWork uow, ILogger<CreatePedidoCommandHandler> logger)
    : IRequestHandler<CreatePedidoCommand, Result<PedidoDto>>
{
    public async Task<Result<PedidoDto>> Handle(CreatePedidoCommand request, CancellationToken ct)
    {
        var destinatarioValido = await uow.Destinatarios.ExistsAsync(
            d => d.Id == request.DestinatarioId && d.ClienteId == request.ClienteId, ct);
        if (!destinatarioValido)
        {
            logger.LogWarning("Pedido rejeitado: destinatário {DestinatarioId} não encontrado para o cliente {ClienteId}", request.DestinatarioId, request.ClienteId);
            return Result.Failure<PedidoDto>(ResultError.Validation("DestinatarioId", "Destinatário não encontrado ou não pertence a este cliente."));
        }

        var produtoIds = request.Itens.Select(i => i.ProdutoId).Distinct().ToList();
        var produtosValidos = await uow.Produtos.FindAsync(
            p => p.ClienteId == request.ClienteId && produtoIds.Contains(p.Id), ct);
        var produtoIdsFaltando = produtoIds.Except(produtosValidos.Select(p => p.Id)).ToList();
        if (produtoIdsFaltando.Count > 0)
        {
            logger.LogWarning("Pedido rejeitado: produto(s) {ProdutoIds} não encontrado(s) para o cliente {ClienteId}", produtoIdsFaltando, request.ClienteId);
            return Result.Failure<PedidoDto>(ResultError.Validation("ProdutoId", "Um ou mais produtos não foram encontrados ou não pertencem a este cliente."));
        }

        var itens = request.Itens.Select(i =>
        {
            var total = Math.Max(0, (i.Quantidade * i.PrecoUnitario) - i.Desconto);
            return new PedidoItem
            {
                ProdutoId = i.ProdutoId,
                Descricao = i.Descricao,
                Unidade = i.Unidade,
                Quantidade = i.Quantidade,
                PrecoUnitario = i.PrecoUnitario,
                Desconto = i.Desconto,
                ValorTotal = total,
                Cfop = i.Cfop,
                Ncm = i.Ncm,
                AliquotaIcms = i.AliquotaIcms,
                AliquotaPis = i.AliquotaPis,
                AliquotaCofins = i.AliquotaCofins,
            };
        }).ToList();

        var pedido = new Pedido
        {
            ClienteId = request.ClienteId,
            DestinatarioId = request.DestinatarioId,
            Observacoes = request.Observacoes,
            ValorTotal = itens.Sum(i => i.ValorTotal),
            Itens = itens,
            NaturezaOperacao = request.NaturezaOperacao,
            DataSaida = request.DataSaida,
            FormaPagamento = request.FormaPagamento,
            MeioPagamento = request.MeioPagamento,
            InformacoesComplementares = request.InformacoesComplementares,
        };

        await uow.Pedidos.AddAsync(pedido, ct);
        await uow.SaveChangesAsync(ct);
        logger.LogInformation("Pedido {PedidoId} criado para o cliente {ClienteId} com {ItemCount} item(ns)", pedido.Id, request.ClienteId, itens.Count);

        var withDest = await uow.Pedidos.GetWithItensAsync(pedido.Id, ct);
        return Result.Success(ToDto(withDest!));
    }

    internal static PedidoDto ToDto(Pedido p) => new(
        p.Id, p.Numero, p.ClienteId, p.DestinatarioId,
        p.Destinatario?.RazaoSocial ?? string.Empty,
        p.Status, p.Observacoes, p.ValorTotal, p.CreatedAt,
        p.Itens.Select(i => new PedidoItemDto(
            i.Id, i.ProdutoId, i.Descricao, i.Unidade,
            i.Quantidade, i.PrecoUnitario, i.Desconto, i.ValorTotal,
            i.Cfop, i.Ncm, i.AliquotaIcms, i.AliquotaPis, i.AliquotaCofins
        )).ToList(),
        p.NaturezaOperacao, p.DataSaida, p.FormaPagamento, p.MeioPagamento, p.InformacoesComplementares,
        p.DocumentoId, p.Documento?.Numero, p.Documento?.ChaveAcesso,
        p.Documento is null ? null : new DocumentoImpostosDto(
            p.Documento.ValorProdutos, p.Documento.ValorFrete, p.Documento.ValorSeguro, p.Documento.ValorDesconto,
            p.Documento.ValorIcms, p.Documento.ValorIpi, p.Documento.ValorPis, p.Documento.ValorCofins,
            p.Documento.ValorOutrasDespesas, p.Documento.ValorAproxTributos));
}
