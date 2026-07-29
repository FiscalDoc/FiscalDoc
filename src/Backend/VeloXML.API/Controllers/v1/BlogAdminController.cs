using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VeloXML.Application.Common.DTOs;
using VeloXML.Application.Features.Blog.Commands.CreateBlogCategoria;
using VeloXML.Application.Features.Blog.Commands.CreateBlogPost;
using VeloXML.Application.Features.Blog.Commands.DeleteBlogCategoria;
using VeloXML.Application.Features.Blog.Commands.DeleteBlogPost;
using VeloXML.Application.Features.Blog.Commands.DespublicarBlogPost;
using VeloXML.Application.Features.Blog.Commands.PublicarBlogPost;
using VeloXML.Application.Features.Blog.Commands.UpdateBlogCategoria;
using VeloXML.Application.Features.Blog.Commands.UpdateBlogPost;
using VeloXML.Application.Features.Blog.Commands.UploadBlogImagem;
using VeloXML.Application.Features.Blog.Queries.GetBlogCategorias;
using VeloXML.Application.Features.Blog.Queries.GetBlogPostById;
using VeloXML.Application.Features.Blog.Queries.GetBlogPosts;

namespace VeloXML.API.Controllers.v1;

[ApiController]
[Route("api/v1/admin/blog")]
[Authorize(Roles = "Administrador")]
public sealed class BlogAdminController(IMediator mediator) : ControllerBase
{
    [HttpGet("posts")]
    public async Task<IActionResult> GetPosts(
        [FromQuery] string? termo,
        [FromQuery] string? status,
        [FromQuery] Guid? categoriaId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetBlogPostsQuery(termo, status, categoriaId, page, pageSize), ct);
        return Ok(result.Value);
    }

    [HttpGet("posts/{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new GetBlogPostByIdQuery(id), ct);
        return result.IsSuccess ? Ok(result.Value) : NotFound(result.Error);
    }

    [HttpPost("posts")]
    public async Task<IActionResult> Create([FromBody] BlogPostRequest body, CancellationToken ct)
    {
        var result = await mediator.Send(new CreateBlogPostCommand(
            body.Titulo, body.Slug, body.Resumo, body.Conteudo, body.ImagemCapaKey,
            body.CategoriaId, body.Tags, body.Autor, body.DataPublicacao, body.Status,
            body.MetaTitulo, body.MetaDescricao), ct);
        return result.IsSuccess ? Created(string.Empty, result.Value) : BadRequest(result.Error);
    }

    [HttpPut("posts/{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] BlogPostRequest body, CancellationToken ct)
    {
        var result = await mediator.Send(new UpdateBlogPostCommand(
            id, body.Titulo, body.Slug, body.Resumo, body.Conteudo, body.ImagemCapaKey,
            body.CategoriaId, body.Tags, body.Autor, body.DataPublicacao, body.Status,
            body.MetaTitulo, body.MetaDescricao), ct);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpDelete("posts/{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new DeleteBlogPostCommand(id), ct);
        return result.IsSuccess ? NoContent() : NotFound(result.Error);
    }

    [HttpPost("posts/{id:guid}/publicar")]
    public async Task<IActionResult> Publicar(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new PublicarBlogPostCommand(id), ct);
        return result.IsSuccess ? Ok(result.Value) : NotFound(result.Error);
    }

    [HttpPost("posts/{id:guid}/despublicar")]
    public async Task<IActionResult> Despublicar(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new DespublicarBlogPostCommand(id), ct);
        return result.IsSuccess ? Ok(result.Value) : NotFound(result.Error);
    }

    [HttpPost("upload-imagem")]
    [RequestSizeLimit(5_242_880)]
    public async Task<IActionResult> UploadImagem(IFormFile file, CancellationToken ct)
    {
        if (file.Length == 0) return BadRequest(new { message = "Arquivo vazio." });

        var dto = new FileUploadDto(file.OpenReadStream(), file.FileName, file.ContentType, file.Length);
        var result = await mediator.Send(new UploadBlogImagemCommand(dto), ct);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpGet("categorias")]
    public async Task<IActionResult> GetCategorias(CancellationToken ct)
    {
        var result = await mediator.Send(new GetBlogCategoriasQuery(), ct);
        return Ok(result.Value);
    }

    [HttpPost("categorias")]
    public async Task<IActionResult> CreateCategoria([FromBody] BlogCategoriaRequest body, CancellationToken ct)
    {
        var result = await mediator.Send(new CreateBlogCategoriaCommand(body.Nome, body.Slug), ct);
        return result.IsSuccess ? Created(string.Empty, result.Value) : BadRequest(result.Error);
    }

    [HttpPut("categorias/{id:guid}")]
    public async Task<IActionResult> UpdateCategoria(Guid id, [FromBody] BlogCategoriaRequest body, CancellationToken ct)
    {
        var result = await mediator.Send(new UpdateBlogCategoriaCommand(id, body.Nome, body.Slug), ct);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpDelete("categorias/{id:guid}")]
    public async Task<IActionResult> DeleteCategoria(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new DeleteBlogCategoriaCommand(id), ct);
        return result.IsSuccess ? NoContent() : NotFound(result.Error);
    }
}

public record BlogPostRequest(
    string Titulo,
    string? Slug,
    string Resumo,
    string Conteudo,
    string? ImagemCapaKey,
    Guid? CategoriaId,
    List<string> Tags,
    string Autor,
    DateTime? DataPublicacao,
    string Status,
    string? MetaTitulo,
    string? MetaDescricao
);

public record BlogCategoriaRequest(string Nome, string? Slug);
