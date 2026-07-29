using MediatR;
using VeloXML.Application.Features.Configuracoes.Queries.GetSocialConfig;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Configuracoes.Commands.SaveSocialConfig;

public sealed class SaveSocialConfigCommandHandler(IUnitOfWork uow)
    : IRequestHandler<SaveSocialConfigCommand, Result<SocialConfigDto>>
{
    public async Task<Result<SocialConfigDto>> Handle(SaveSocialConfigCommand request, CancellationToken ct)
    {
        await uow.Configuracoes.UpsertAsync("social.instagram", request.Instagram ?? "", "Link do Instagram", ct);
        await uow.Configuracoes.UpsertAsync("social.facebook",  request.Facebook ?? "",  "Link do Facebook", ct);
        await uow.Configuracoes.UpsertAsync("social.linkedin",  request.Linkedin ?? "",  "Link do LinkedIn", ct);
        await uow.Configuracoes.UpsertAsync("social.tiktok",    request.Tiktok ?? "",    "Link do TikTok", ct);

        await uow.SaveChangesAsync(ct);

        return Result.Success(new SocialConfigDto(
            string.IsNullOrWhiteSpace(request.Instagram) ? null : request.Instagram,
            string.IsNullOrWhiteSpace(request.Facebook) ? null : request.Facebook,
            string.IsNullOrWhiteSpace(request.Linkedin) ? null : request.Linkedin,
            string.IsNullOrWhiteSpace(request.Tiktok) ? null : request.Tiktok));
    }
}
