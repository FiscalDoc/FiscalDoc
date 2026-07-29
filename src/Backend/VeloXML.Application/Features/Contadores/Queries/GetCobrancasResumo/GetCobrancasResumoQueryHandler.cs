using MediatR;
using VeloXML.Domain.Enums;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Contadores.Queries.GetCobrancasResumo;

public sealed class GetCobrancasResumoQueryHandler(IUnitOfWork uow)
    : IRequestHandler<GetCobrancasResumoQuery, Result<CobrancasResumoDto>>
{
    public async Task<Result<CobrancasResumoDto>> Handle(GetCobrancasResumoQuery request, CancellationToken ct)
    {
        var pendentesEAtrasadas = await uow.Cobrancas.GetAllPendentesEAtrasadasAsync(ct);

        var pendentes = pendentesEAtrasadas.Where(c => c.Status == StatusCobrancaEnum.Pendente).ToList();
        var atrasadas = pendentesEAtrasadas.Where(c => c.Status == StatusCobrancaEnum.Atrasado).ToList();

        var now = DateTime.UtcNow;
        var recebidoMes = await uow.Cobrancas.SomaPagasNoMesAsync(now.Month, now.Year, ct);

        return Result.Success(new CobrancasResumoDto(
            pendentes.Sum(c => c.ValorTotal), pendentes.Count,
            atrasadas.Sum(c => c.ValorTotal), atrasadas.Count,
            recebidoMes));
    }
}
