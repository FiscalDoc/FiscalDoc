using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Transportadoras.Queries.GetTransportadoraVizinhos;

public record GetTransportadoraVizinhosQuery(Guid ClienteId, Guid Id) : IRequest<Result<TransportadoraVizinhosDto>>;

public record TransportadoraVizinhosDto(Guid? AnteriorId, string? AnteriorLabel, Guid? ProximoId, string? ProximoLabel, int Posicao, int Total);
