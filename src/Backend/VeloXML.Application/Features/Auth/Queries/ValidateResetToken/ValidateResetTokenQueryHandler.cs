using MediatR;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Auth.Queries.ValidateResetToken;

public sealed class ValidateResetTokenQueryHandler(IUnitOfWork uow) : IRequestHandler<ValidateResetTokenQuery, Result<bool>>
{
    public async Task<Result<bool>> Handle(ValidateResetTokenQuery request, CancellationToken ct)
    {
        var token = await uow.PasswordResetTokens.GetByTokenAsync(request.Token, ct);
        return Result.Success(token is not null && token.IsActive);
    }
}
