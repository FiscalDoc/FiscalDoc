using MediatR;
using VeloXML.Application.Features.Auth.Commands.Login;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Auth.Commands.RefreshToken;

public record RefreshTokenCommand(string AccessToken, string RefreshToken) : IRequest<Result<LoginResponse>>;
