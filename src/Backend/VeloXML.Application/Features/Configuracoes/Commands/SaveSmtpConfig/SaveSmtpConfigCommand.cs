using MediatR;
using VeloXML.Application.Features.Configuracoes.Queries.GetSmtpConfig;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Configuracoes.Commands.SaveSmtpConfig;

public record SaveSmtpConfigCommand(
    string Host, int Port, string From, string FromName,
    string? Username, string? Password, bool EnableSsl, string? ReplyTo
) : IRequest<Result<SmtpConfigDto>>;
