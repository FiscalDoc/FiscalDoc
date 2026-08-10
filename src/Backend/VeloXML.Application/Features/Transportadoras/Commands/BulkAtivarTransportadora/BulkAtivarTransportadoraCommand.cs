using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Transportadoras.Commands.BulkAtivarTransportadora;

public record BulkAtivarTransportadoraCommand(Guid ClienteId, List<Guid> Ids, bool Ativo) : IRequest<Result>;
