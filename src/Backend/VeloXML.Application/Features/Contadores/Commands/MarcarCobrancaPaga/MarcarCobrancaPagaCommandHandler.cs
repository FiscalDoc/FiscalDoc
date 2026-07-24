using MediatR;
using VeloXML.Application.Features.Contadores.Queries.GetContadores;
using VeloXML.Domain.Enums;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Contadores.Commands.MarcarCobrancaPaga;

public sealed class MarcarCobrancaPagaCommandHandler(IUnitOfWork uow)
    : IRequestHandler<MarcarCobrancaPagaCommand, Result<CobrancaDto>>
{
    public async Task<Result<CobrancaDto>> Handle(MarcarCobrancaPagaCommand request, CancellationToken ct)
    {
        var cobranca = await uow.Cobrancas.GetByIdAsync(request.CobrancaId, ct);
        if (cobranca is null) return Result.Failure<CobrancaDto>(ResultError.NotFound("Cobrança não encontrada."));

        cobranca.Status = StatusCobrancaEnum.Pago;
        cobranca.DataPagamento = DateTime.UtcNow;
        if (!string.IsNullOrWhiteSpace(request.Observacao))
            cobranca.Observacao = request.Observacao;

        uow.Cobrancas.Update(cobranca);
        await uow.SaveChangesAsync(ct);

        return Result.Success(new CobrancaDto(
            cobranca.Id, cobranca.ContadorId, cobranca.Mes, cobranca.Ano,
            cobranca.TotalClientes, cobranca.ValorPorCliente, cobranca.ValorBase,
            cobranca.LimiteXmlTotal, cobranca.XmlsProcessados, cobranca.XmlsExcedentes,
            cobranca.ValorExcedente, cobranca.ValorTotal,
            cobranca.Status.ToString(), cobranca.DataVencimento, cobranca.DataPagamento, cobranca.Observacao));
    }
}
