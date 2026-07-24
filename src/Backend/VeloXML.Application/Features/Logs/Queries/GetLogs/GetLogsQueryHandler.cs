using MediatR;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Logs.Queries.GetLogs;

public sealed class GetLogsQueryHandler(IUnitOfWork uow)
    : IRequestHandler<GetLogsQuery, Result<PagedResult<LogDto>>>
{
    public async Task<Result<PagedResult<LogDto>>> Handle(GetLogsQuery request, CancellationToken ct)
    {
        var (items, total) = await uow.Logs.SearchAsync(
            request.Categoria, request.Operacao, request.Page, request.PageSize, ct);

        var dtos = items.Select(l => new LogDto(
            l.Id, l.Tabela, l.Operacao, l.RegistroId,
            l.ValoresAntigos, l.ValoresNovos,
            l.UserId, l.IpAddress, l.CreatedAt)).ToList();

        return Result.Success(PagedResult<LogDto>.Create(
            dtos, total, request.Page, request.PageSize));
    }
}
