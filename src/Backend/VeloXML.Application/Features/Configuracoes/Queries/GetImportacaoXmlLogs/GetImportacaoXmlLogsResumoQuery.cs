using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Configuracoes.Queries.GetImportacaoXmlLogs;

public record GetImportacaoXmlLogsResumoQuery : IRequest<Result<ImportacaoXmlLogsResumoDto>>;

public record ImportacaoXmlLogsResumoDto(int TotalExecucoes, int TotalErros, DateTime? UltimaExecucaoEm);
