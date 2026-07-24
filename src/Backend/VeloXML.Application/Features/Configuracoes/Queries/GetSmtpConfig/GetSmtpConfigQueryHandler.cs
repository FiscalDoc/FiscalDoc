using MediatR;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Configuracoes.Queries.GetSmtpConfig;

public sealed class GetSmtpConfigQueryHandler(IUnitOfWork uow)
    : IRequestHandler<GetSmtpConfigQuery, Result<SmtpConfigDto>>
{
    public async Task<Result<SmtpConfigDto>> Handle(GetSmtpConfigQuery request, CancellationToken ct)
    {
        var keys = await uow.Configuracoes.GetByPrefixoAsync("smtp.", ct);
        string Get(string k) => keys.FirstOrDefault(x => x.Chave == k)?.Valor ?? string.Empty;

        return Result.Success(new SmtpConfigDto(
            Host:       Get("smtp.host").Length > 0 ? Get("smtp.host") : "localhost",
            Port:       int.TryParse(Get("smtp.port"), out var p) ? p : 1025,
            From:       Get("smtp.from").Length > 0 ? Get("smtp.from") : "noreply@fiscaldoc.com.br",
            FromName:   Get("smtp.from_name").Length > 0 ? Get("smtp.from_name") : "FiscalDoc",
            Username:   Get("smtp.username").Length > 0 ? Get("smtp.username") : null,
            EnableSsl:  Get("smtp.ssl") == "true",
            ReplyTo:    Get("smtp.reply_to").Length > 0 ? Get("smtp.reply_to") : null
        ));
    }
}
