using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Configuracoes.Queries.GetSmtpConfig;

public record GetSmtpConfigQuery : IRequest<Result<SmtpConfigDto>>;

public record SmtpConfigDto(
    string Host, int Port, string From, string FromName,
    string? Username, bool EnableSsl, string? ReplyTo
);
