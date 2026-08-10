using MediatR;
using VeloXML.Application.Features.Transportadoras.Commands.CreateTransportadora;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Transportadoras.Commands.DuplicarTransportadora;

public record DuplicarTransportadoraCommand(Guid Id, Guid ClienteId) : IRequest<Result<TransportadoraDto>>;
