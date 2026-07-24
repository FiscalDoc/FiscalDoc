using MediatR;
using VeloXML.Application.Features.Auth.Commands.Login;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Auth.Commands.Verify2fa;

public record Verify2faCommand(string TwoFactorToken, string Code) : IRequest<Result<LoginResponse>>;
