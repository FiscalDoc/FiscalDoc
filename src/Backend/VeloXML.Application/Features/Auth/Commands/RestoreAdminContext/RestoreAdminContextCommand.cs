using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Auth.Commands.RestoreAdminContext;

public record RestoreAdminContextCommand : IRequest<Result<RestoreAdminContextResponse>>;

public record RestoreAdminContextResponse(string AccessToken, string RefreshToken, DateTime ExpiresAt);
