using MediatR;
using VeloXML.Application.Common;
using VeloXML.Application.Features.Configuracoes.Queries.GetFocusNfeConfig;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Configuracoes.Commands.SaveFocusNfeConfig;

public sealed class SaveFocusNfeConfigCommandHandler(IUnitOfWork uow)
    : IRequestHandler<SaveFocusNfeConfigCommand, Result<FocusNfeConfigDto>>
{
    public async Task<Result<FocusNfeConfigDto>> Handle(SaveFocusNfeConfigCommand request, CancellationToken ct)
    {
        if (request.TokenHomologacao is not null)
            await uow.Configuracoes.UpsertAsync(FocusNfeConfigKeys.TokenHomologacao, request.TokenHomologacao, "Token da Focus NFe (homologação)", ct);

        if (request.TokenProducao is not null)
            await uow.Configuracoes.UpsertAsync(FocusNfeConfigKeys.TokenProducao, request.TokenProducao, "Token da Focus NFe (produção)", ct);

        if (request.WebhookSecret is not null)
            await uow.Configuracoes.UpsertAsync(FocusNfeConfigKeys.WebhookSecret, request.WebhookSecret, "Segredo da URL de webhook da Focus NFe", ct);

        await uow.SaveChangesAsync(ct);

        var keys = await uow.Configuracoes.GetByPrefixoAsync("focusnfe.", ct);
        string? Get(string k) => keys.FirstOrDefault(x => x.Chave == k)?.Valor;

        return Result.Success(new FocusNfeConfigDto(
            TokenHomologacaoConfigurado: !string.IsNullOrEmpty(Get(FocusNfeConfigKeys.TokenHomologacao)),
            TokenProducaoConfigurado: !string.IsNullOrEmpty(Get(FocusNfeConfigKeys.TokenProducao)),
            WebhookSecret: Get(FocusNfeConfigKeys.WebhookSecret)
        ));
    }
}
