using MediatR;
using VeloXML.Domain.Exceptions;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Blog.Commands.DeleteBlogPost;

public sealed class DeleteBlogPostCommandHandler(IUnitOfWork uow)
    : IRequestHandler<DeleteBlogPostCommand, Result>
{
    public async Task<Result> Handle(DeleteBlogPostCommand request, CancellationToken ct)
    {
        var post = await uow.BlogPosts.GetByIdAsync(request.Id, ct);
        if (post is null)
            throw new NotFoundException("BlogPost", request.Id);

        uow.BlogPosts.Remove(post);
        await uow.SaveChangesAsync(ct);
        return Result.Success();
    }
}
