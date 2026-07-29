using VeloXML.Domain.Entities;

namespace VeloXML.Domain.Interfaces;

public interface IBlogCategoriaRepository : IRepository<BlogCategoria>
{
    Task<IReadOnlyList<BlogCategoria>> GetAllOrderedAsync(CancellationToken ct = default);
    Task<bool> SlugExisteAsync(string slug, Guid? excludeId, CancellationToken ct = default);
}
