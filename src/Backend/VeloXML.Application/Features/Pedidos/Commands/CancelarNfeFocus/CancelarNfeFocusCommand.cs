using MediatR;
using VeloXML.Application.Features.Pedidos.Commands.EmitirNfeFocus;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Pedidos.Commands.CancelarNfeFocus;

public record CancelarNfeFocusCommand(
    Guid ClienteId,
    Guid PedidoId,
    string Justificativa
) : IRequest<Result<NfeEmissaoDto>>;
