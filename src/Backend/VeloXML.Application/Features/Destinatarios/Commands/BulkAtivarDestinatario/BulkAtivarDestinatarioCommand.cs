using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Destinatarios.Commands.BulkAtivarDestinatario;

public record BulkAtivarDestinatarioCommand(Guid ClienteId, List<Guid> Ids, bool Ativo) : IRequest<Result>;
