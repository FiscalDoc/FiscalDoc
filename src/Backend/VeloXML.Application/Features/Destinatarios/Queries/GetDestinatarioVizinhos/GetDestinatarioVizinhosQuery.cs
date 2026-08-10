using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Destinatarios.Queries.GetDestinatarioVizinhos;

public record GetDestinatarioVizinhosQuery(Guid ClienteId, Guid Id) : IRequest<Result<DestinatarioVizinhosDto>>;

public record DestinatarioVizinhosDto(Guid? AnteriorId, string? AnteriorLabel, Guid? ProximoId, string? ProximoLabel, int Posicao, int Total);
