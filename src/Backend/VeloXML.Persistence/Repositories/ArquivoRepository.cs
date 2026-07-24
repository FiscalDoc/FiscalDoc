using Microsoft.EntityFrameworkCore;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Interfaces;
using VeloXML.Persistence.Context;

namespace VeloXML.Persistence.Repositories;

public sealed class ArquivoRepository(AppDbContext context) : BaseRepository<Arquivo>(context), IArquivoRepository
{
    public async Task<IReadOnlyList<Arquivo>> GetByDocumentoAsync(Guid documentoId, CancellationToken ct = default) =>
        await DbSet.Where(a => a.DocumentoId == documentoId).ToListAsync(ct);
}
