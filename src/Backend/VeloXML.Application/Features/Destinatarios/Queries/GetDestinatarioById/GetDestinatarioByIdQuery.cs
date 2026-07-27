using MediatR;
using VeloXML.Application.Features.Destinatarios.Commands.CreateDestinatario;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Destinatarios.Queries.GetDestinatarioById;

public record GetDestinatarioByIdQuery(Guid Id, Guid ClienteId) : IRequest<Result<DestinatarioDto>>;
