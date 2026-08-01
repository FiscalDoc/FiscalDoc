using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Auth.Queries.ValidateResetToken;

public record ValidateResetTokenQuery(string Token) : IRequest<Result<bool>>;
