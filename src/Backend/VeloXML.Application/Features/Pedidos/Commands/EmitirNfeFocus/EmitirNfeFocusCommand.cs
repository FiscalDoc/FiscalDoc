using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Pedidos.Commands.EmitirNfeFocus;

public record EmitirNfeFocusCommand(Guid PedidoId, Guid ClienteId) : IRequest<Result<NfeEmissaoDto>>;
