using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Contadores.Commands.SetDataLimiteAcesso;

public record SetDataLimiteAcessoCommand(Guid ContadorId, DateTime? DataLimite) : IRequest<Result<bool>>;
