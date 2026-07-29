using MediatR;
using VeloXML.Domain.Exceptions;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Blog.Commands.DespublicarBlogPost;

public sealed class DespublicarBlogPostCommandHandler(IUnitOfWork uow)
    : IRequestHandler<DespublicarBlogPostCommand, Result<BlogPostDto>>
{
    public async Task<Result<BlogPostDto>> Handle(DespublicarBlogPostCommand request, CancellationToken ct)
    {
        var post = await uow.BlogPosts.GetByIdComCategoriaAsync(request.Id, ct);
        if (post is null)
            throw new NotFoundException("BlogPost", request.Id);

        post.Status = "Rascunho";

        uow.BlogPosts.Update(post);
        await uow.SaveChangesAsync(ct);

        return Result.Success(BlogDtoMapper.ToDto(post));
    }
}
