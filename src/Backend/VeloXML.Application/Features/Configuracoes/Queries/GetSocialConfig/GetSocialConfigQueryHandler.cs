using MediatR;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Configuracoes.Queries.GetSocialConfig;

public sealed class GetSocialConfigQueryHandler(IUnitOfWork uow)
    : IRequestHandler<GetSocialConfigQuery, Result<SocialConfigDto>>
{
    public async Task<Result<SocialConfigDto>> Handle(GetSocialConfigQuery request, CancellationToken ct)
    {
        var keys = await uow.Configuracoes.GetByPrefixoAsync("social.", ct);
        string? Get(string k)
        {
            var valor = keys.FirstOrDefault(x => x.Chave == k)?.Valor;
            return string.IsNullOrWhiteSpace(valor) ? null : valor;
        }

        return Result.Success(new SocialConfigDto(
            Instagram: Get("social.instagram"),
            Facebook:  Get("social.facebook"),
            Linkedin:  Get("social.linkedin"),
            Tiktok:    Get("social.tiktok")
        ));
    }
}
