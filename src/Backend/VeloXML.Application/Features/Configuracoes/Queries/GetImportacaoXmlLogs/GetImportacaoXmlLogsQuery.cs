using MediatR;
using VeloXML.Domain.Enums;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Configuracoes.Queries.GetImportacaoXmlLogs;

public record GetImportacaoXmlLogsQuery(Guid? ClienteId, OrigemImportacaoEnum? Origem = null, int Page = 1, int PageSize = 25)
    : IRequest<Result<PagedResult<ImportacaoXmlLogDto>>>;

public record ImportacaoXmlLogDto(
    Guid Id,
    string Origem,
    DateTime ExecutadoEm,
    Guid ClienteId,
    string ClienteNome,
    int EmailsEncontrados,
    int XmlsProcessados,
    int XmlsImportados,
    int Erros,
    string? MensagemErro,
    List<Guid> DocumentoIds
);
