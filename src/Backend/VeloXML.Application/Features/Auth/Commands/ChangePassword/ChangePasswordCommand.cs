using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Auth.Commands.ChangePassword;

public record ChangePasswordCommand(string SenhaAtual, string NovaSenha) : IRequest<Result>;
