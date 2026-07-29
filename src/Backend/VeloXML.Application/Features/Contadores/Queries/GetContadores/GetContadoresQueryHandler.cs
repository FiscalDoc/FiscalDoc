using MediatR;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Contadores.Queries.GetContadores;

public sealed class GetContadoresQueryHandler(IUnitOfWork uow)
    : IRequestHandler<GetContadoresQuery, Result<PagedResult<ContadorDto>>>
{
    public async Task<Result<PagedResult<ContadorDto>>> Handle(GetContadoresQuery request, CancellationToken ct)
    {
        var paged = await uow.Contadores.SearchAsync(request.Termo, request.Page, request.PageSize, ct);

        if (paged.Items.Count == 0)
            return Result.Success(PagedResult<ContadorDto>.Create([], paged.TotalCount, paged.Page, paged.PageSize));

        var contadorIds = paged.Items.Select(c => c.Id).ToList();
        var now = DateTime.UtcNow;

        var cobrancasList = await uow.Cobrancas.GetByContadoresMesAsync(contadorIds, now.Month, now.Year, ct);
        var cobrancas = cobrancasList.ToDictionary(c => c.ContadorId);

        var items = paged.Items.Select(c =>
        {
            cobrancas.TryGetValue(c.Id, out var cb);
            if (cb is not null) cb.Contador = c;
            var dataLimite = c.DataLimiteAcesso ?? c.CreatedAt.AddDays(30);
            return new ContadorDto(
                c.Id, c.Nome, c.Email, c.Telefone, c.Crc, c.Empresa, c.Ativo,
                c.Clientes.Count(cl => cl.DeletedAt == null),
                c.CanalNotificacao,
                c.StatusLicenca.ToString(),
                c.MotivoBloqueio,
                dataLimite,
                c.ValorPorCliente, c.LimiteXmlPorCliente, c.ValorXmlExcedente,
                c.FotoUrl,
                cb is null ? null : CobrancaDtoMapper.ToDto(cb),
                c.Tenant?.Plano ?? "Starter"
            );
        }).ToList();

        return Result.Success(PagedResult<ContadorDto>.Create(items, paged.TotalCount, paged.Page, paged.PageSize));
    }
}
