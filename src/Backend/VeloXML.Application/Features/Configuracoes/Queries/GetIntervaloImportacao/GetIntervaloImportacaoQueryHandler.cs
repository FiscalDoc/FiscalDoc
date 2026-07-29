using MediatR;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Configuracoes.Queries.GetIntervaloImportacao;

public sealed class GetIntervaloImportacaoQueryHandler(IUnitOfWork uow)
    : IRequestHandler<GetIntervaloImportacaoQuery, Result<int>>
{
    public const string ChaveConfiguracao = "sistema.importacao_xml_intervalo_minutos";
    public const int IntervaloPadraoMinutos = 5;

    public async Task<Result<int>> Handle(GetIntervaloImportacaoQuery request, CancellationToken ct)
    {
        var config = await uow.Configuracoes.GetByChaveAsync(ChaveConfiguracao, ct);
        if (config is null || !int.TryParse(config.Valor, out var minutos) || minutos < 1)
            return Result.Success(IntervaloPadraoMinutos);

        return Result.Success(minutos);
    }
}
