using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Auth.Commands.ResetPassword;

public record ResetPasswordCommand(string Token, string NovaSenha) : IRequest<Result>;
