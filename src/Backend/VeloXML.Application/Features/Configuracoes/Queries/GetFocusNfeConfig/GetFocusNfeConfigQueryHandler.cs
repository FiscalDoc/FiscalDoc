using MediatR;
using VeloXML.Application.Common;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Configuracoes.Queries.GetFocusNfeConfig;

public sealed class GetFocusNfeConfigQueryHandler(IUnitOfWork uow)
    : IRequestHandler<GetFocusNfeConfigQuery, Result<FocusNfeConfigDto>>
{
    public async Task<Result<FocusNfeConfigDto>> Handle(GetFocusNfeConfigQuery request, CancellationToken ct)
    {
        var keys = await uow.Configuracoes.GetByPrefixoAsync("focusnfe.", ct);
        string? Get(string k) => keys.FirstOrDefault(x => x.Chave == k)?.Valor;

        return Result.Success(new FocusNfeConfigDto(
            TokenHomologacaoConfigurado: !string.IsNullOrEmpty(Get(FocusNfeConfigKeys.TokenHomologacao)),
            TokenProducaoConfigurado: !string.IsNullOrEmpty(Get(FocusNfeConfigKeys.TokenProducao)),
            WebhookSecret: Get(FocusNfeConfigKeys.WebhookSecret)
        ));
    }
}
