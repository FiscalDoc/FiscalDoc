using MediatR;
using VeloXML.Application.Features.Contadores.Queries.GetContadores;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Enums;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Contadores.Commands.CriarCobrancaManual;

public sealed class CriarCobrancaManualCommandHandler(IUnitOfWork uow)
    : IRequestHandler<CriarCobrancaManualCommand, Result<CobrancaDto>>
{
    public async Task<Result<CobrancaDto>> Handle(CriarCobrancaManualCommand request, CancellationToken ct)
    {
        Contador? contador = null;
        Cliente? cliente = null;

        if (request.ContadorId.HasValue)
        {
            contador = await uow.Contadores.GetByIdAsync(request.ContadorId.Value, ct);
            if (contador is null) return Result.Failure<CobrancaDto>(ResultError.NotFound("Contador"));

            var existente = await uow.Cobrancas.GetByContadorMesAsync(request.ContadorId.Value, request.Mes, request.Ano, ct);
            if (existente is not null)
                return Result.Failure<CobrancaDto>(ResultError.Validation("Cobrança", "Já existe uma cobrança para este contador neste período."));
        }
        else if (request.ClienteId.HasValue)
        {
            cliente = await uow.Clientes.GetByIdAsync(request.ClienteId.Value, ct);
            if (cliente is null) return Result.Failure<CobrancaDto>(ResultError.NotFound("Cliente"));
        }

        var cobranca = new Cobranca
        {
            ContadorId     = request.ContadorId,
            ClienteId      = request.ClienteId,
            Mes            = request.Mes,
            Ano            = request.Ano,
            ValorTotal     = request.ValorTotal,
            Status         = StatusCobrancaEnum.Pendente,
            DataVencimento = request.DataVencimento,
            Observacao     = request.Observacao,
            Contador       = contador,
            Cliente        = cliente,
        };

        await uow.Cobrancas.AddAsync(cobranca, ct);
        await uow.SaveChangesAsync(ct);

        return Result.Success(CobrancaDtoMapper.ToDto(cobranca));
    }
}
