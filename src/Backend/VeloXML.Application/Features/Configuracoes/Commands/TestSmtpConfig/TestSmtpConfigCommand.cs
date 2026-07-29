using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Configuracoes.Commands.TestSmtpConfig;

public record TestSmtpConfigCommand(
    string Host,
    int Port,
    string From,
    string FromName,
    string? Username,
    string? Password,
    bool EnableSsl,
    string EmailDestino
) : IRequest<Result>;
