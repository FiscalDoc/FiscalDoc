using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Configuracoes.Queries.GetSocialConfig;

public record GetSocialConfigQuery : IRequest<Result<SocialConfigDto>>;

public record SocialConfigDto(
    string? Instagram,
    string? Facebook,
    string? Linkedin,
    string? Tiktok
);
