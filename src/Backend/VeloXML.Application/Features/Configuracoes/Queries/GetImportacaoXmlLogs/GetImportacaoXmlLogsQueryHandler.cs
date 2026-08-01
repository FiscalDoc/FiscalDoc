using MediatR;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Configuracoes.Queries.GetImportacaoXmlLogs;

public sealed class GetImportacaoXmlLogsQueryHandler(IUnitOfWork uow)
    : IRequestHandler<GetImportacaoXmlLogsQuery, Result<PagedResult<ImportacaoXmlLogDto>>>
{
    public async Task<Result<PagedResult<ImportacaoXmlLogDto>>> Handle(GetImportacaoXmlLogsQuery request, CancellationToken ct)
    {
        var pageSize = request.PageSize is < 1 or > 100 ? 25 : request.PageSize;
        var page = request.Page < 1 ? 1 : request.Page;

        var paged = await uow.ImportacaoXmlLogs.SearchAsync(request.ClienteId, request.Origem, page, pageSize, ct);

        var dtos = paged.Items.Select(l => new ImportacaoXmlLogDto(
            l.Id, l.Origem.ToString(), l.ExecutadoEm, l.ClienteId, l.ClienteNome,
            l.EmailsEncontrados, l.XmlsProcessados, l.XmlsImportados, l.Erros, l.MensagemErro)).ToList();

        return Result.Success(PagedResult<ImportacaoXmlLogDto>.Create(dtos, paged.TotalCount, page, pageSize));
    }
}
