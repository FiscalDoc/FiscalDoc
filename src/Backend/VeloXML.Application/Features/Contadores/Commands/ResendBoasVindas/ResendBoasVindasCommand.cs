using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Contadores.Commands.ResendBoasVindas;

public record ResendBoasVindasCommand(Guid ContadorId) : IRequest<Result<bool>>;
