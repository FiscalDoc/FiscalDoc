using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Destinatarios.Commands.DeleteDestinatario;

public record DeleteDestinatarioCommand(Guid Id) : IRequest<Result>;
