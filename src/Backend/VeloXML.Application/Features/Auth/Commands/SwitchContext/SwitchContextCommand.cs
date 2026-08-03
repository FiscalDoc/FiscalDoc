using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Auth.Commands.SwitchContext;

// ContadorId só é obrigatório pra Perfil=Contador — pra Perfil=Cliente, o Contador é sempre
// derivado do próprio Cliente selecionado (o Admin escolhe o Cliente direto, sem precisar
// escolher o Contador antes).
public record SwitchContextCommand(Guid? ContadorId, string Perfil, Guid? ClienteId) : IRequest<Result<SwitchContextResponse>>;

public record SwitchContextResponse(string AccessToken, DateTime ExpiresAt, string Perfil, string? Empresa);
