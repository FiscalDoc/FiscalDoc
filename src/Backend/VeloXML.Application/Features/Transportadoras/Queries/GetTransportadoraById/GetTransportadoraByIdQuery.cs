using MediatR;
using VeloXML.Application.Features.Transportadoras.Commands.CreateTransportadora;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Transportadoras.Queries.GetTransportadoraById;

public record GetTransportadoraByIdQuery(Guid Id, Guid ClienteId) : IRequest<Result<TransportadoraDto>>;
