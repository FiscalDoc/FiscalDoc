using MediatR;
using VeloXML.Application.Common.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Blog.Commands.UploadBlogImagem;

public sealed class UploadBlogImagemCommandHandler(IStorageService storage)
    : IRequestHandler<UploadBlogImagemCommand, Result<UploadBlogImagemResultDto>>
{
    private static readonly Dictionary<string, string> ExtensoesPermitidas = new(StringComparer.OrdinalIgnoreCase)
    {
        [".jpg"] = "image/jpeg",
        [".jpeg"] = "image/jpeg",
        [".png"] = "image/png",
        [".webp"] = "image/webp",
        [".gif"] = "image/gif",
    };

    private const long TamanhoMaximo = 5 * 1024 * 1024;

    public async Task<Result<UploadBlogImagemResultDto>> Handle(UploadBlogImagemCommand request, CancellationToken ct)
    {
        var arquivo = request.Arquivo;

        if (arquivo.Size == 0)
            return Result.Failure<UploadBlogImagemResultDto>(ResultError.BadRequest("Arquivo vazio."));
        if (arquivo.Size > TamanhoMaximo)
            return Result.Failure<UploadBlogImagemResultDto>(ResultError.BadRequest("A imagem deve ter no máximo 5MB."));

        var extensao = Path.GetExtension(arquivo.FileName);
        if (!ExtensoesPermitidas.TryGetValue(extensao, out var contentType))
            return Result.Failure<UploadBlogImagemResultDto>(
                ResultError.BadRequest("Formato de imagem não suportado. Use JPG, PNG, WEBP ou GIF."));

        var objectKey = $"{Guid.NewGuid()}{extensao.ToLowerInvariant()}";
        await storage.UploadAsync(arquivo.Content, objectKey, storage.ResolveBucket("blog"), contentType, ct);

        return Result.Success(new UploadBlogImagemResultDto(objectKey, $"/blog/imagens/{objectKey}/conteudo"));
    }
}
