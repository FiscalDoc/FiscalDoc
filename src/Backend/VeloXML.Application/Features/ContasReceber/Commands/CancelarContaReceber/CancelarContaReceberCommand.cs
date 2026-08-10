using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.ContasReceber.Commands.CancelarContaReceber;

public record CancelarContaReceberCommand(Guid Id, Guid ClienteId) : IRequest<Result>;
