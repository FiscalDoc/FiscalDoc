using MediatR;
using VeloXML.Application.Features.Configuracoes.Queries.GetSmtpConfig;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Configuracoes.Commands.SaveSmtpConfig;

public sealed class SaveSmtpConfigCommandHandler(IUnitOfWork uow)
    : IRequestHandler<SaveSmtpConfigCommand, Result<SmtpConfigDto>>
{
    public async Task<Result<SmtpConfigDto>> Handle(SaveSmtpConfigCommand request, CancellationToken ct)
    {
        await uow.Configuracoes.UpsertAsync("smtp.host",      request.Host,                       "Servidor SMTP", ct);
        await uow.Configuracoes.UpsertAsync("smtp.port",      request.Port.ToString(),             "Porta SMTP", ct);
        await uow.Configuracoes.UpsertAsync("smtp.from",      request.From,                        "E-mail remetente", ct);
        await uow.Configuracoes.UpsertAsync("smtp.from_name", request.FromName,                    "Nome remetente", ct);
        await uow.Configuracoes.UpsertAsync("smtp.ssl",       request.EnableSsl ? "true" : "false","SSL/TLS", ct);

        if (request.Username is not null)
            await uow.Configuracoes.UpsertAsync("smtp.username", request.Username, "Usuário SMTP", ct);

        if (request.Password is not null)
            await uow.Configuracoes.UpsertAsync("smtp.password", request.Password, "Senha SMTP", ct);

        if (request.ReplyTo is not null)
            await uow.Configuracoes.UpsertAsync("smtp.reply_to", request.ReplyTo, "Reply-To", ct);

        await uow.SaveChangesAsync(ct);

        return Result.Success(new SmtpConfigDto(
            request.Host, request.Port, request.From, request.FromName,
            request.Username, request.EnableSsl, request.ReplyTo));
    }
}
