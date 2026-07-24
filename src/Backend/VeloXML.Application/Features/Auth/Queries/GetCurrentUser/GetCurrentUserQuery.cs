using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Auth.Queries.GetCurrentUser;

public record GetCurrentUserQuery : IRequest<Result<UserDto>>;
