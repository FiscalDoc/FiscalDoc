using MediatR;
using VeloXML.Application.Features.Configuracoes.Queries.GetSocialConfig;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Configuracoes.Commands.SaveSocialConfig;

public record SaveSocialConfigCommand(
    string? Instagram,
    string? Facebook,
    string? Linkedin,
    string? Tiktok
) : IRequest<Result<SocialConfigDto>>;
