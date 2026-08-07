using MediatR;
using VeloXML.Application.Common.Interfaces;
using VeloXML.Domain.Enums;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Usuarios.Commands.UploadAvatarClienteUsuario;

// Mesmo padrão de UploadFoto do Contador: chave fixa (sem extensão/Guid), sobrescreve o mesmo
// objeto a cada upload — a imagem é servida por GET /usuarios/{id}/avatar, cache-busted pelo
// frontend via query string, então não precisa de chave nova por upload.
public sealed class UploadAvatarClienteUsuarioCommandHandler(IUnitOfWork uow, ICurrentUser currentUser, IStorageService storage)
    : IRequestHandler<UploadAvatarClienteUsuarioCommand, Result<string?>>
{
    private static readonly string[] TiposPermitidos = ["image/jpeg", "image/png", "image/webp"];

    public async Task<Result<string?>> Handle(UploadAvatarClienteUsuarioCommand request, CancellationToken ct)
    {
        if (currentUser.Role == nameof(PerfilEnum.Cliente) && currentUser.ClienteId != request.ClienteId)
            return Result.Failure<string?>(ResultError.Unauthorized("Você não tem permissão para alterar usuários deste cliente."));

        var alvo = await uow.Users.GetByIdAsync(request.Id, ct);
        if (alvo is null || alvo.ClienteId != request.ClienteId)
            return Result.Failure<string?>(ResultError.NotFound("Usuário"));

        if (!TiposPermitidos.Contains(request.Arquivo.ContentType))
            return Result.Failure<string?>(ResultError.Validation("Arquivo", "Formato não suportado. Use JPG, PNG ou WebP."));

        var objectKey = $"usuarios/{alvo.Id}/avatar";
        await storage.UploadAsync(request.Arquivo.Content, objectKey, storage.ResolveBucket("veloxml"), request.Arquivo.ContentType, ct);

        alvo.AvatarObjectKey = objectKey;
        uow.Users.Update(alvo);
        await uow.SaveChangesAsync(ct);

        return Result.Success<string?>(objectKey);
    }
}
