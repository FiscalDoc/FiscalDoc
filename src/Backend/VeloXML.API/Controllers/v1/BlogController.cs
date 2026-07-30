using MediatR;
using Microsoft.AspNetCore.Mvc;
using VeloXML.Application.Common.Interfaces;
using VeloXML.Application.Features.Blog.Queries.GetBlogCategorias;
using VeloXML.Application.Features.Blog.Queries.GetPublicBlogPostBySlug;
using VeloXML.Application.Features.Blog.Queries.GetPublicBlogPosts;

namespace VeloXML.API.Controllers.v1;

[ApiController]
[Route("api/v1/blog")]
public sealed class BlogController(IMediator mediator, IStorageService storage, ILogger<BlogController> logger) : ControllerBase
{
    private static readonly Dictionary<string, string> ContentTypesPorExtensao = new(StringComparer.OrdinalIgnoreCase)
    {
        [".jpg"] = "image/jpeg",
        [".jpeg"] = "image/jpeg",
        [".png"] = "image/png",
        [".webp"] = "image/webp",
        [".gif"] = "image/gif",
    };

    [HttpGet("posts")]
    public async Task<IActionResult> GetPosts(
        [FromQuery] string? termo,
        [FromQuery] string? categoriaSlug,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12,
        CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetPublicBlogPostsQuery(termo, categoriaSlug, page, pageSize), ct);
        return Ok(result.Value);
    }

    [HttpGet("posts/{slug}")]
    public async Task<IActionResult> GetPostBySlug(string slug, CancellationToken ct)
    {
        var result = await mediator.Send(new GetPublicBlogPostBySlugQuery(slug), ct);
        return result.IsSuccess ? Ok(result.Value) : NotFound(result.Error);
    }

    [HttpGet("categorias")]
    public async Task<IActionResult> GetCategorias(CancellationToken ct)
    {
        var result = await mediator.Send(new GetBlogCategoriasQuery(), ct);
        return Ok(result.Value);
    }

    [HttpGet("imagens/{key}")]
    public async Task<IActionResult> GetImagem(string key, CancellationToken ct)
    {
        var extensao = Path.GetExtension(key);
        if (!ContentTypesPorExtensao.TryGetValue(extensao, out var contentType))
        {
            logger.LogWarning("[Blog] Extensão de imagem não reconhecida ao servir {Key}", key);
            return NotFound();
        }

        try
        {
            var stream = await storage.DownloadAsync(key, "blog", ct);
            return File(stream, contentType);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "[Blog] Falha ao buscar imagem {Key} no bucket 'blog'", key);
            return NotFound();
        }
    }
}
