using MediatR;
using VeloXML.Application.Features.Contadores.Queries.GetContadores;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Enums;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Contadores.Commands.GerarCobrancaMensal;

public sealed class GerarCobrancaMensalCommandHandler(IUnitOfWork uow)
    : IRequestHandler<GerarCobrancaMensalCommand, Result<CobrancaDto>>
{
    public async Task<Result<CobrancaDto>> Handle(GerarCobrancaMensalCommand request, CancellationToken ct)
    {
        var contador = await uow.Contadores.GetWithClientesAsync(request.ContadorId, ct);
        if (contador is null) return Result.Failure<CobrancaDto>(ResultError.NotFound("Contador não encontrado."));

        // Verifica se já existe cobrança para o período
        var existente = await uow.Cobrancas.GetByContadorMesAsync(request.ContadorId, request.Mes, request.Ano, ct);
        if (existente is not null)
            return Result.Failure<CobrancaDto>(ResultError.Validation("Cobrança", "Já existe uma cobrança para este período."));

        var totalClientes = contador.Clientes.Count(c => c.DeletedAt == null && c.Ativo);
        var limiteTotal = totalClientes * contador.LimiteXmlPorCliente;

        // Conta documentos processados no período para todos os clientes deste contador
        var clienteIds = contador.Clientes.Where(c => c.DeletedAt == null).Select(c => c.Id).ToList();
        var inicio = new DateTime(request.Ano, request.Mes, 1, 0, 0, 0, DateTimeKind.Utc);
        var fim = inicio.AddMonths(1);
        var xmlsProcessados = await uow.Documentos
            .FindAsync(d => clienteIds.Contains(d.ClienteId) && d.CreatedAt >= inicio && d.CreatedAt < fim, ct);

        var totalXmls  = xmlsProcessados.Count;
        var excedentes = Math.Max(0, totalXmls - limiteTotal);
        var valorBase  = totalClientes * contador.ValorPorCliente;
        var valorExc   = excedentes * contador.ValorXmlExcedente;
        var dataVenc   = inicio.AddMonths(1).AddDays(request.DiasVencimento - 1);

        var cobranca = new CobrancaContador
        {
            ContadorId       = request.ContadorId,
            Mes              = request.Mes,
            Ano              = request.Ano,
            TotalClientes    = totalClientes,
            ValorPorCliente  = contador.ValorPorCliente,
            ValorBase        = valorBase,
            LimiteXmlTotal   = limiteTotal,
            XmlsProcessados  = totalXmls,
            XmlsExcedentes   = excedentes,
            ValorExcedente   = valorExc,
            ValorTotal       = valorBase + valorExc,
            Status           = StatusCobrancaEnum.Pendente,
            DataVencimento   = dataVenc,
        };

        await uow.Cobrancas.AddAsync(cobranca, ct);
        await uow.SaveChangesAsync(ct);

        return Result.Success(new CobrancaDto(
            cobranca.Id, cobranca.ContadorId, cobranca.Mes, cobranca.Ano,
            cobranca.TotalClientes, cobranca.ValorPorCliente, cobranca.ValorBase,
            cobranca.LimiteXmlTotal, cobranca.XmlsProcessados, cobranca.XmlsExcedentes,
            cobranca.ValorExcedente, cobranca.ValorTotal,
            cobranca.Status.ToString(), cobranca.DataVencimento, cobranca.DataPagamento, cobranca.Observacao));
    }
}
