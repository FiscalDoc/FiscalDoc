using System.Text.Json;
using MediatR;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Configuracoes.Queries.GetImportacaoXmlStatus;

public sealed class GetImportacaoXmlStatusQueryHandler(IUnitOfWork uow)
    : IRequestHandler<GetImportacaoXmlStatusQuery, Result<ImportacaoXmlStatusDto?>>
{
    public const string ChaveConfiguracao = "sistema.importacao_xml_status";

    public async Task<Result<ImportacaoXmlStatusDto?>> Handle(GetImportacaoXmlStatusQuery request, CancellationToken ct)
    {
        var config = await uow.Configuracoes.GetByChaveAsync(ChaveConfiguracao, ct);
        if (config is null || string.IsNullOrWhiteSpace(config.Valor))
            return Result.Success<ImportacaoXmlStatusDto?>(null);

        try
        {
            var status = JsonSerializer.Deserialize<ImportacaoXmlStatusDto>(config.Valor);
            return Result.Success(status);
        }
        catch (JsonException)
        {
            return Result.Success<ImportacaoXmlStatusDto?>(null);
        }
    }
}
