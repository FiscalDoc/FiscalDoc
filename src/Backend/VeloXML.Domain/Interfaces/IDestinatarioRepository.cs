using VeloXML.Domain.Entities;
using VeloXML.SharedKernel;

namespace VeloXML.Domain.Interfaces;

public interface IDestinatarioRepository : IRepository<Destinatario>
{
    Task<PagedResult<Destinatario>> SearchAsync(Guid clienteId, string? termo, bool? ativo, int page, int pageSize, CancellationToken ct = default);

    // "Anterior/Próximo" na tela de detalhe — mesma ordem alfabética (por Razão Social) que a
    // grade usa, com Id como desempate pra ordem determinística entre itens de nome igual.
    Task<(Guid? AnteriorId, string? AnteriorLabel, Guid? ProximoId, string? ProximoLabel, int Posicao, int Total)> GetVizinhosAsync(Guid clienteId, Guid id, CancellationToken ct = default);
}
