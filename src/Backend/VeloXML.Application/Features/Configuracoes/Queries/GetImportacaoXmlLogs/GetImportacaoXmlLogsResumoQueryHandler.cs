using MediatR;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Configuracoes.Queries.GetImportacaoXmlLogs;

public sealed class GetImportacaoXmlLogsResumoQueryHandler(IUnitOfWork uow)
    : IRequestHandler<GetImportacaoXmlLogsResumoQuery, Result<ImportacaoXmlLogsResumoDto>>
{
    public async Task<Result<ImportacaoXmlLogsResumoDto>> Handle(GetImportacaoXmlLogsResumoQuery request, CancellationToken ct)
    {
        var (totalExecucoes, totalErros, ultimaExecucaoEm) = await uow.ImportacaoXmlLogs.GetResumoAsync(request.Origem, ct);
        return Result.Success(new ImportacaoXmlLogsResumoDto(totalExecucoes, totalErros, ultimaExecucaoEm));
    }
}
