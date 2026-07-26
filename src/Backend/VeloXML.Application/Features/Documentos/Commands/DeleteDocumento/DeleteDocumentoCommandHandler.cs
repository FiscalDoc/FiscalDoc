using MediatR;
using VeloXML.Application.Common.Interfaces;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Documentos.Commands.DeleteDocumento;

public sealed class DeleteDocumentoCommandHandler(
    IUnitOfWork uow,
    IStorageService storage) : IRequestHandler<DeleteDocumentoCommand, Result>
{
    public async Task<Result> Handle(DeleteDocumentoCommand request, CancellationToken ct)
    {
        var documento = await uow.Documentos.GetByIdWithArquivosAsync(request.Id, ct);
        if (documento is null)
            return Result.Failure(ResultError.NotFound("Documento"));

        foreach (var arquivo in documento.Arquivos)
            await storage.DeleteAsync(arquivo.ObjectKey, arquivo.Bucket, ct);

        uow.Documentos.Remove(documento);
        await uow.SaveChangesAsync(ct);

        return Result.Success();
    }
}
