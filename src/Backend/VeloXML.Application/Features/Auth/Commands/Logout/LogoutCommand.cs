using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Auth.Commands.Logout;

public record LogoutCommand(string RefreshToken) : IRequest<Result>;
