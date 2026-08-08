using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Transportadoras.Commands.DeleteTransportadora;

public record DeleteTransportadoraCommand(Guid Id, Guid ClienteId) : IRequest<Result>;
