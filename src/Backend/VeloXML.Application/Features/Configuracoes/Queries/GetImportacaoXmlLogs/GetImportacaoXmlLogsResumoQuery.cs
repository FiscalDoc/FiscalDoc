using MediatR;
using VeloXML.Domain.Enums;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Configuracoes.Queries.GetImportacaoXmlLogs;

public record GetImportacaoXmlLogsResumoQuery(OrigemImportacaoEnum? Origem = null) : IRequest<Result<ImportacaoXmlLogsResumoDto>>;

public record ImportacaoXmlLogsResumoDto(int TotalExecucoes, int TotalErros, DateTime? UltimaExecucaoEm);
