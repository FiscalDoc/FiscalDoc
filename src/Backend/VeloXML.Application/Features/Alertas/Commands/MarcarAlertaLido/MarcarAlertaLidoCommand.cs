using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Alertas.Commands.MarcarAlertaLido;

public record MarcarAlertaLidoCommand(Guid AlertaId) : IRequest<Result>;
