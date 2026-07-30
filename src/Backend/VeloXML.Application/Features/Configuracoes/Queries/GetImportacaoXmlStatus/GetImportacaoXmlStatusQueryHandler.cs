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

        ImportacaoXmlStatusDto? status;
        try
        {
            status = JsonSerializer.Deserialize<ImportacaoXmlStatusDto>(config.Valor);
        }
        catch (JsonException)
        {
            return Result.Success<ImportacaoXmlStatusDto?>(null);
        }

        if (status is null)
            return Result.Success<ImportacaoXmlStatusDto?>(null);

        // O blob salvo pelo job é sempre da plataforma inteira (todos os tenants/contadores).
        // O filtro de tenant/contador do Cliente já restringe uow.Clientes ao que o usuário
        // logado pode ver — reaproveitamos isso pra recortar a mesma lista aqui, em vez de um
        // Contador conseguir enxergar o resumo de clientes de outro Contador (mesma regra do
        // isolamento multi-tenant aplicado nas outras telas).
        var idsVisiveis = (await uow.Clientes.FindAsync(_ => true, ct)).Select(c => c.Id).ToHashSet();
        var clientesVisiveis = status.Clientes.Where(c => idsVisiveis.Contains(c.ClienteId)).ToList();

        var statusFiltrado = status with
        {
            Clientes = clientesVisiveis,
            ClientesProcessados = clientesVisiveis.Count,
            EmailsEncontrados = clientesVisiveis.Sum(c => c.EmailsEncontrados),
            XmlsProcessados = clientesVisiveis.Sum(c => c.XmlsProcessados),
            XmlsImportados = clientesVisiveis.Sum(c => c.XmlsImportados),
            Erros = clientesVisiveis.Sum(c => c.Erros),
        };

        return Result.Success<ImportacaoXmlStatusDto?>(statusFiltrado);
    }
}
