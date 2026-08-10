using MediatR;
using VeloXML.Application.Features.Destinatarios.Commands.CreateDestinatario;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Destinatarios.Commands.DuplicarDestinatario;

public record DuplicarDestinatarioCommand(Guid Id, Guid ClienteId) : IRequest<Result<DestinatarioDto>>;
