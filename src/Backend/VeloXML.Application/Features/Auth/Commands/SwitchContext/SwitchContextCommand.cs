using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Auth.Commands.SwitchContext;

public record SwitchContextCommand(Guid ContadorId, string Perfil, Guid? ClienteId) : IRequest<Result<SwitchContextResponse>>;

public record SwitchContextResponse(string AccessToken, DateTime ExpiresAt, string Perfil, string? Empresa);
