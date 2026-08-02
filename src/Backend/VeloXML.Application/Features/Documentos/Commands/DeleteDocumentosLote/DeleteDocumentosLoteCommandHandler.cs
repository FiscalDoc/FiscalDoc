using MediatR;
using VeloXML.Application.Common.Interfaces;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Documentos.Commands.DeleteDocumentosLote;

public sealed class DeleteDocumentosLoteCommandHandler(
    IUnitOfWork uow,
    IStorageService storage) : IRequestHandler<DeleteDocumentosLoteCommand, Result<int>>
{
    public async Task<Result<int>> Handle(DeleteDocumentosLoteCommand request, CancellationToken ct)
    {
        var excluidos = 0;
        foreach (var id in request.Ids.Distinct())
        {
            var documento = await uow.Documentos.GetByIdWithArquivosAsync(id, ct);
            if (documento is null) continue;

            foreach (var arquivo in documento.Arquivos)
                await storage.DeleteAsync(arquivo.ObjectKey, arquivo.Bucket, ct);

            uow.Documentos.Remove(documento);
            excluidos++;
        }

        await uow.SaveChangesAsync(ct);
        return Result.Success(excluidos);
    }
}
